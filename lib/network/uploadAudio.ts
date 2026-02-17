// Upload an audio file to the server and return the response text. Used to get transcription
import { File } from "expo-file-system";
import { fetch } from "expo/fetch";

// Normalize common iOS m4a MIME variants so API Gateway/Lambda treats it as binary
function normalizeM4a(mime?: string) {
  const t = (mime || "").toLowerCase();
  if (t === "audio/x-m4a" || t === "audio/mp4" || t === "audio/m4a") return "audio/m4a";
  return t || "audio/m4a";
}

/** Upload the local recording as RAW body with an audio/* Content-Type. Returns server text. */
export async function uploadAudioFile(uri: string, endpoint: string): Promise<string> {
  if (!uri?.startsWith("file://")) throw new Error("Expected file:// URI from recorder.");

  const file = new File({ uri, name: "recording.m4a", mimeType: "audio/m4a" } as any);

  // Guard: zero-size files likely mean a bad/unfinished recording
  if (file.size === 0) throw new Error("Recorded file is empty. Try re-recording.");

  const contentType = normalizeM4a(file.type);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      "Accept": "application/json, text/plain",
    },
    body: file, // RAW audio body (not multipart)
  });

  const text = await res.text(); // capture whatever the server sent
  if (!res.ok) throw new Error(`Upload failed (${res.status}): ${text}`);
  return text;
}
