// lib/chat/client.ts
import { CHAT_ENDPOINT } from "@/lib/api";
import type { ChatApiRequest, ChatApiSuccess } from "./types";

export async function sendChatMessage(message: string): Promise<string> {
  const body: ChatApiRequest = { message };

  const res = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();

  if (!res.ok) {
    // surface server body for debugging
    throw new Error(`Chat error (${res.status}): ${raw}`);
  }

  try {
    const data = JSON.parse(raw) as ChatApiSuccess;
    // Your server: { response: "string", status: "success" }
    if (typeof data?.response === "string") return data.response;
    // Fallback if the server sends plain text
    return raw || "";
  } catch {
    // Non-JSON response
    return raw || "";
  }
}
