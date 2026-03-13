import {
  SessionConfig,
  SessionSummary,
  SessionTurn,
  TurnResponse,
} from "@/context";
import {
  ROLEPLAY_END_ENDPOINT,
  ROLEPLAY_TURN_ENDPOINT,
  USE_ROLEPLAY_MOCKS,
} from "@/lib/api";

import { mockEndSession, mockSubmitTurn } from "./mock";

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

async function postTurn(
  config: SessionConfig,
  history: SessionTurn[],
  audioUri: string
) {
  const body = new FormData();
  body.append("config", JSON.stringify(config));
  body.append("history", JSON.stringify(history));
  body.append(
    "audio",
    {
      uri: audioUri,
      name: "turn.m4a",
      type: "audio/m4a",
    } as any
  );

  const response = await fetch(ROLEPLAY_TURN_ENDPOINT, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    throw new Error(`Turn request failed (${response.status})`);
  }

  return normalizeTurnResponse(await parseJson(response));
}

async function postSummary(config: SessionConfig, turns: SessionTurn[]) {
  const response = await fetch(ROLEPLAY_END_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ config, history: turns }),
  });

  if (!response.ok) {
    throw new Error(`Summary request failed (${response.status})`);
  }

  return normalizeSummaryResponse(await parseJson(response), turns);
}

export async function submitRoleplayTurn(
  config: SessionConfig,
  history: SessionTurn[],
  audioUri: string
) {
  if (USE_ROLEPLAY_MOCKS) {
    return mockSubmitTurn(config, history);
  }

  try {
    return await postTurn(config, history, audioUri);
  } catch (error) {
    if (__DEV__) {
      return mockSubmitTurn(config, history);
    }
    throw error;
  }
}

export async function endRoleplaySession(
  config: SessionConfig,
  turns: SessionTurn[]
) {
  if (USE_ROLEPLAY_MOCKS) {
    return mockEndSession(config, turns);
  }

  try {
    return await postSummary(config, turns);
  } catch (error) {
    if (__DEV__) {
      return mockEndSession(config, turns);
    }
    throw error;
  }
}
