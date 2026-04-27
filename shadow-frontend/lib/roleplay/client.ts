import {
  AttachmentKind,
  SessionAttachment,
  SessionConfig,
  SessionSummary,
  SessionTurn,
  TurnResponse,
} from "@/context";
import {
  getRoleplayContextEndpoint,
  getRoleplayEndEndpoint,
  getRoleplayTurnEndpoint,
} from "@/lib/api";

function inferAudioExtension(audioUri: string) {
  const cleanedUri = audioUri.split("?")[0]?.toLowerCase() ?? "";
  if (cleanedUri.endsWith(".wav")) return "wav";
  if (cleanedUri.endsWith(".caf")) return "caf";
  if (cleanedUri.endsWith(".mp3")) return "mp3";
  if (cleanedUri.endsWith(".webm")) return "webm";
  if (cleanedUri.endsWith(".aac")) return "aac";
  if (cleanedUri.endsWith(".m4a")) return "m4a";
  return "m4a";
}

function inferAudioMimeType(extension: string) {
  switch (extension) {
    case "wav":
      return "audio/wav";
    case "caf":
      return "audio/x-caf";
    case "mp3":
      return "audio/mpeg";
    case "webm":
      return "audio/webm";
    case "aac":
      return "audio/aac";
    case "m4a":
    default:
      return "audio/m4a";
  }
}

function asAudioUri(value: unknown, mimeType?: string | null) {
  if (typeof value !== "string" || !value.trim()) return null;
  if (value.startsWith("http") || value.startsWith("file:") || value.startsWith("data:")) {
    return value;
  }
  if (mimeType) {
    return `data:${mimeType};base64,${value}`;
  }
  return value;
}

function normalizeTurnResponse(payload: any): TurnResponse {
  const audioMimeType =
    typeof payload?.assistantAudioMimeType === "string"
      ? payload.assistantAudioMimeType
      : typeof payload?.audioMimeType === "string"
      ? payload.audioMimeType
      : "audio/mpeg";

  return {
    userTranscript:
      payload?.userTranscript ??
      payload?.transcript ??
      payload?.inputTranscript ??
      "",
    assistantText:
      payload?.assistantText ??
      payload?.reply ??
      payload?.response ??
      "",
    assistantAudioUri:
      asAudioUri(payload?.assistantAudioUri, audioMimeType) ??
      asAudioUri(payload?.assistantAudioBase64, audioMimeType) ??
      asAudioUri(payload?.audio, audioMimeType),
    assistantAudioMimeType: audioMimeType,
  };
}

function normalizeSummaryResponse(payload: any, turns: SessionTurn[]): SessionSummary {
  const transcript =
    payload?.transcript ??
    payload?.fullTranscript ??
    turns
      .map((turn) => `${turn.role === "user" ? "You" : "Partner"}: ${turn.text}`)
      .join("\n");

  return {
    transcript,
    overview:
      payload?.overview ??
      payload?.summary ??
      "You kept the conversation moving and surfaced enough context to coach the next round.",
    wins: Array.isArray(payload?.wins)
      ? payload.wins
      : Array.isArray(payload?.strengths)
      ? payload.strengths
      : [],
    drills: Array.isArray(payload?.drills)
      ? payload.drills
      : Array.isArray(payload?.areasForImprovement)
      ? payload.areasForImprovement
      : [],
    nextStep:
      payload?.nextStep ??
      payload?.next_step ??
      "Run the scenario again and focus on calmer pacing, clearer structure, and stronger confidence.",
    scenarioId: typeof payload?.scenarioId === "string" ? payload.scenarioId : undefined,
    intro: typeof payload?.intro === "string" ? payload.intro : undefined,
    sections: Array.isArray(payload?.sections) ? payload.sections : undefined,
  };
}

function normalizeAttachmentResponse(payload: any): SessionAttachment {
  if (!payload || typeof payload !== "object") {
    throw new Error("Attachment upload returned an invalid response.");
  }

  if (
    payload.kind !== "slides" &&
    payload.kind !== "instructions" &&
    payload.kind !== "rubric" &&
    payload.kind !== "resume" &&
    payload.kind !== "job-listing" &&
    payload.kind !== "notes"
  ) {
    throw new Error("Attachment upload returned an invalid attachment kind.");
  }

  return {
    id:
      typeof payload.id === "string" && payload.id.trim()
        ? payload.id
        : `attachment-${Date.now()}`,
    name:
      typeof payload.name === "string" && payload.name.trim()
        ? payload.name
        : "Uploaded file",
    mimeType:
      typeof payload.mimeType === "string" && payload.mimeType.trim()
        ? payload.mimeType
        : "application/octet-stream",
    kind: payload.kind as AttachmentKind,
    extractedText:
      typeof payload.extractedText === "string" ? payload.extractedText : "",
    promptText: typeof payload.promptText === "string" ? payload.promptText : "",
  };
}

async function parseJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text);
  }
}

async function parseError(response: Response) {
  const payload = await parseJson(response);
  const message =
    typeof payload?.error === "string"
      ? payload.error
      : typeof payload?.message === "string"
      ? payload.message
      : null;

  return message;
}

async function postTurn(
  config: SessionConfig,
  history: SessionTurn[],
  audioUri: string
) {
  const extension = inferAudioExtension(audioUri);
  const mimeType = inferAudioMimeType(extension);

  const body = new FormData();
  body.append("config", JSON.stringify(config));
  body.append("history", JSON.stringify(history));
  body.append(
    "audio",
    {
      uri: audioUri,
      name: `turn.${extension}`,
      type: mimeType,
    } as any
  );

  const response = await fetch(getRoleplayTurnEndpoint(), {
    method: "POST",
    body,
  });

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message ?? `Turn request failed (${response.status})`);
  }

  return normalizeTurnResponse(await parseJson(response));
}

async function postSummary(config: SessionConfig, turns: SessionTurn[]) {
  const response = await fetch(getRoleplayEndEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ config, history: turns }),
  });

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message ?? `Summary request failed (${response.status})`);
  }

  return normalizeSummaryResponse(await parseJson(response), turns);
}

async function postContextUpload(
  fileUri: string,
  fileName: string,
  mimeType: string,
  kind: AttachmentKind
) {
  const body = new FormData();
  body.append("kind", kind);
  body.append(
    "file",
    {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any
  );

  const response = await fetch(getRoleplayContextEndpoint(), {
    method: "POST",
    body,
  });

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message ?? `Context upload failed (${response.status})`);
  }

  return normalizeAttachmentResponse(await parseJson(response));
}

export async function submitRoleplayTurn(
  config: SessionConfig,
  history: SessionTurn[],
  audioUri: string
) {
  try {
    return await postTurn(config, history, audioUri);
  } catch (error: any) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unable to reach the roleplay turn endpoint.");
  }
}

export async function endRoleplaySession(
  config: SessionConfig,
  turns: SessionTurn[]
) {
  try {
    return await postSummary(config, turns);
  } catch (error: any) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unable to reach the roleplay summary endpoint.");
  }
}

export async function uploadRoleplayContext(
  fileUri: string,
  fileName: string,
  mimeType: string,
  kind: AttachmentKind
) {
  try {
    return await postContextUpload(fileUri, fileName, mimeType, kind);
  } catch (error: any) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unable to reach the roleplay context endpoint.");
  }
}
