import { readSse, type AiChatRequest, type AiConversation, type AiConversationSummary, type AiStatus, type AiStreamEvent } from "@atlas/shared";
import { ApiError, deleteJson, getJson } from "../../shared/api/client";

export const fetchAiStatus = (signal?: AbortSignal) => getJson<AiStatus>("/api/ai/status", signal);
export const fetchConversations = (signal?: AbortSignal) => getJson<AiConversationSummary[]>("/api/ai/conversations", signal);
export const fetchConversation = (id: string, signal?: AbortSignal) => getJson<AiConversation>(`/api/ai/conversations/${encodeURIComponent(id)}`, signal);
export const deleteConversationApi = (id: string) => deleteJson<{ ok: boolean }>(`/api/ai/conversations/${encodeURIComponent(id)}`);

/** Streams an answer; resolves when the server sends `done`, throws ApiError on any failure. */
export async function* streamAnswer(request: AiChatRequest, signal: AbortSignal): AsyncGenerator<Extract<AiStreamEvent, { type: "text" | "reasoning" }>> {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    credentials: "same-origin",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => null);
    if (response.status === 401) window.dispatchEvent(new Event("atlas:unauthorized"));
    throw new ApiError(data?.error || "AI 服务暂时不可用，请稍后重试", response.status);
  }
  for await (const { data } of readSse(response.body, signal)) {
    let event: AiStreamEvent;
    try { event = JSON.parse(data) as AiStreamEvent; } catch { continue; }
    if (event.type === "done") return;
    if (event.type === "error") throw new ApiError(event.message, 502);
    yield event;
  }
  if (!signal.aborted) throw new ApiError("连接中断，回答不完整", 502);
}