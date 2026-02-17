// lib/chat/types.ts
export type Role = "user" | "assistant";

export type Msg = {
  id: string;
  role: Role;
  text: string;
  ts: number;
};

export type ChatApiRequest = { message: string };

export type ChatApiSuccess = {
  response: string; // your server field
  status: "success" | string;
};

export type ChatApiError = {
  status?: string;
  error?: string;
};
