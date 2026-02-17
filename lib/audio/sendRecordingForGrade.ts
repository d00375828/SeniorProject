import { AUDIO_ENDPOINT } from "@/lib/api";
import { GradeResult, normalizeServerGrade } from "@/lib/audio/grade";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

function isM4A(uri: string) {
  const lower = uri.split("?")[0].toLowerCase();
  return lower.endsWith(".m4a");
}

async function uploadBinaryNative(fileUri: string) {
  const BINARY =
    (FileSystem as any)?.FileSystemUploadType?.BINARY_CONTENT ?? 0;

  const res = await FileSystem.uploadAsync(AUDIO_ENDPOINT, fileUri, {
    httpMethod: "POST",
    headers: {
      "Content-Type": "audio/m4a",
      Accept: "application/json, text/plain, */*",
    },
    uploadType: BINARY as number,
  });

  return { status: res.status, body: res.body };
}

async function uploadBinaryWeb(fileUri: string) {
  const resp = await fetch(fileUri);
  const blob = await resp.blob();
  const r = await fetch(AUDIO_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "audio/m4a",
      Accept: "application/json, text/plain, */*",
    },
    body: blob,
  });
  const body = await r.text();
  return { status: r.status, body };
}

export async function sendRecordingForGrade(
  uri: string
): Promise<GradeResult> {
  if (!uri) {
    throw new Error("Missing recording. Please record again.");
  }

  if (!isM4A(uri)) {
    throw new Error(
      "This server only accepts .m4a audio files. Please re-record and try again."
    );
  }

  const { status, body } =
    Platform.OS === "web"
      ? await uploadBinaryWeb(uri)
      : await uploadBinaryNative(uri);

  if (!(status >= 200 && status < 300)) {
    throw new Error(`Upload failed (${status}): ${body}`);
  }

  try {
    const data = JSON.parse(body);
    return normalizeServerGrade(data);
  } catch {
    throw new Error("Unexpected server response. Please try again.");
  }
}
