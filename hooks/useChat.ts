// hooks/useChat.ts
import { sendChatMessage } from "@/lib/chat/client";
import type { Msg } from "@/lib/chat/types";
import { useCallback, useMemo, useState } from "react";

export function useChat() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "intro",
      role: "assistant",
      text: "Welcome to Shadow Chat 👋\nAsk for tips or feedback on your last pitch.",
      ts: Date.now() - 20_000,
    },
  ]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...messages].sort((a, b) => b.ts - a.ts), // FlatList will be inverted
    [messages]
  );

  const push = useCallback((text: string, role: Msg["role"]) => {
    setMessages((m) => [
      { id: String(Date.now() + Math.random()), role, text, ts: Date.now() },
      ...m,
    ]);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || sending) return;
      setError(null);

      // show user message optimistically
      push(t, "user");
      setSending(true);

      try {
        const reply = await sendChatMessage(t);
        push(reply || "(no response)", "assistant");
      } catch (e: any) {
        setError(e?.message ?? "Network error");
        push("Sorry — I couldn’t get feedback right now.", "assistant");
      } finally {
        setSending(false);
      }
    },
    [push, sending]
  );

  return { messages: sorted, send, sending, error };
}
