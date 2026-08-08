import { useCallback, useEffect, useRef, useState } from "react";

const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/altus-os`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export interface AltusSource { key: string; label: string; window: string; status: "connected" | "missing" }

export interface AltusContext {
  client: any;
  profile: any;
  goals: any[];
  integrations: any[];
  connected: string[];
  missing: { provider: string; label: string }[];
  metrics: any;
  insights: any[];
  activity: any[];
  sources: AltusSource[];
  dataDepthDays: number;
  confidence: "alta" | "media" | "baixa";
}

export interface AltusMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: AltusSource[];
  confidence?: string | null;
  pending?: boolean;
}

export interface AltusConversation {
  id: string;
  title: string;
  last_message_at: string;
  created_at: string;
}

const post = async (session: string | null, body: Record<string, unknown>) => {
  const res = await fetch(FN_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}`, apikey: ANON },
    body: JSON.stringify({ session, ...body }),
  });
  return res;
};

const postJson = async (session: string | null, body: Record<string, unknown>) => {
  const res = await post(session, body);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error ?? "Pedido falhou.");
  return data as any;
};

/** Business context for the current client — the single source the portal reads. */
export const useAltusContext = (session: string | null, enabled = true) => {
  const [context, setContext] = useState<AltusContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      const data = await postJson(session, { action: "context" });
      setContext(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, [session, enabled]);

  useEffect(() => { load(); }, [load]);

  return { context, loading, error, reload: load };
};

export const useAltusConversations = (session: string | null) => {
  const [conversations, setConversations] = useState<AltusConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await postJson(session, { action: "conversations" });
      setConversations(data.conversations ?? []);
    } catch { /* surfaced by the chat view */ }
    setLoading(false);
  }, [session]);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async () => {
    const data = await postJson(session, { action: "create_conversation" });
    await load();
    return data.conversation as AltusConversation;
  }, [session, load]);

  const rename = useCallback(async (id: string, title: string) => {
    await postJson(session, { action: "rename_conversation", conversation_id: id, title });
    setConversations((c) => c.map((x) => (x.id === id ? { ...x, title } : x)));
  }, [session]);

  const remove = useCallback(async (id: string) => {
    await postJson(session, { action: "delete_conversation", conversation_id: id });
    setConversations((c) => c.filter((x) => x.id !== id));
  }, [session]);

  return { conversations, loading, reload: load, create, rename, remove };
};

/** Streaming chat against the AltusOS engine, scoped to one conversation. */
export const useAltusChat = (session: string | null, conversationId: string | null) => {
  const [messages, setMessages] = useState<AltusMessage[]>([]);
  const [status, setStatus] = useState<"idle" | "submitted" | "streaming">("idle");
  const [thinking, setThinking] = useState("");
  const [error, setError] = useState<string | null>(null);
  const activeId = useRef<string | null>(null);

  useEffect(() => {
    activeId.current = conversationId;
    setMessages([]);
    setError(null);
    setStatus("idle");
    if (!conversationId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await postJson(session, { action: "messages", conversation_id: conversationId });
        if (!cancelled && activeId.current === conversationId) setMessages(data.messages ?? []);
      } catch { /* empty conversation */ }
    })();
    return () => { cancelled = true; };
  }, [session, conversationId]);

  const send = useCallback(async (text: string, onCreated?: (id: string, title: string) => void) => {
    const question = text.trim();
    if (!question || status !== "idle") return;
    setError(null);
    setThinking("");
    setMessages((m) => [...m, { role: "user", content: question }]);
    setStatus("submitted");

    try {
      const res = await post(session, { action: "chat", message: question, conversation_id: conversationId });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.error ?? "Não consegui responder agora.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant: AltusMessage = { role: "assistant", content: "", pending: true };
      setMessages((m) => [...m, assistant]);

      const patch = (next: Partial<AltusMessage>) => {
        assistant = { ...assistant, ...next };
        setMessages((m) => [...m.slice(0, -1), assistant]);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          try {
            const evt = JSON.parse(line.slice(5).trim());
            if (evt.type === "meta") {
              patch({ sources: evt.sources, confidence: evt.confidence });
              if (!conversationId && evt.conversation_id) onCreated?.(evt.conversation_id, "Nova conversa");
            } else if (evt.type === "thinking") {
              setThinking((t) => (t + evt.text).slice(-260));
            } else if (evt.type === "delta") {
              setStatus("streaming");
              patch({ content: assistant.content + evt.text });
            } else if (evt.type === "done") {
              patch({ pending: false });
              if (evt.conversation_id) onCreated?.(evt.conversation_id, evt.title ?? "Nova conversa");
            }
          } catch { /* ignore malformed chunk */ }
        }
      }
      patch({ pending: false });
    } catch (e) {
      setError((e as Error).message);
      setMessages((m) => (m[m.length - 1]?.role === "assistant" && m[m.length - 1]?.pending ? m.slice(0, -1) : m));
    }
    setThinking("");
    setStatus("idle");
  }, [session, conversationId, status]);

  return { messages, status, thinking, error, send };
};
