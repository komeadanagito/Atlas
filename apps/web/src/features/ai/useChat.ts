import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { AiChatRequest } from "@atlas/shared";
import { ApiError } from "../../shared/api/client";
import { deleteConversationApi, fetchConversation, fetchConversations, streamAnswer } from "./api";
import { chatReducer, emptyState, streamingIds, uid, type ChatState } from "./model";

type Run = { conversationId: string; controller: AbortController };

const messageOf = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

export const useChat = (userId: string) => {
  const [state, dispatch] = useReducer(chatReducer, emptyState);
  const [notice, setNotice] = useState("");
  const [running, setRunning] = useState(false);
  const run = useRef<Run | null>(null);
  const latest = useRef<ChatState>(state);
  latest.current = state;

  const apply = useCallback((action: Parameters<typeof chatReducer>[1]) => {
    latest.current = chatReducer(latest.current, action);
    dispatch(action);
  }, []);

  useEffect(() => {
    // Conversations moved to the server; drop the pre-sync browser copy.
    try { localStorage.removeItem(`atlas_ai_${userId}`); } catch { /* storage unavailable */ }
    const controller = new AbortController();
    fetchConversations(controller.signal)
      .then((conversations) => apply({ type: "listed", conversations }))
      .catch((error) => { if (!controller.signal.aborted) setNotice(messageOf(error, "无法加载历史对话")); });
    return () => { controller.abort(); run.current?.controller.abort(); };
  }, [userId, apply]);

  const activeId = state.activeId;
  const needsLoad = activeId !== null && !state.threads[activeId];
  useEffect(() => {
    if (!activeId || !needsLoad) return;
    const controller = new AbortController();
    fetchConversation(activeId, controller.signal)
      .then((conversation) => apply({ type: "loaded", id: activeId, messages: conversation.messages }))
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 404) apply({ type: "remove", id: activeId });
        setNotice(messageOf(error, "无法加载对话"));
      });
    return () => controller.abort();
  }, [activeId, needsLoad, apply]);

  const stream = useCallback(async (request: AiChatRequest) => {
    const { conversationId, replyId } = request;
    const controller = new AbortController();
    run.current = { conversationId, controller };
    setRunning(true);
    // Coalesce token deltas into one render per frame.
    const pending = { content: "", reasoning: "" };
    let frame = 0;
    const flush = () => {
      frame = 0;
      for (const field of ["reasoning", "content"] as const) {
        if (pending[field]) apply({ type: "delta", conversationId, replyId, field, text: pending[field] });
        pending[field] = "";
      }
    };
    let error: string | undefined;
    try {
      for await (const event of streamAnswer(request, controller.signal)) {
        pending[event.type === "text" ? "content" : "reasoning"] += event.delta;
        frame ||= requestAnimationFrame(flush);
      }
    } catch (cause) {
      if (!controller.signal.aborted) error = messageOf(cause, "回答失败，请重试");
    } finally {
      cancelAnimationFrame(frame);
      flush();
      if (run.current?.controller === controller) { run.current = null; setRunning(false); }
      apply({ type: "settle", conversationId, replyId, error });
    }
  }, [apply]);

  const send = useCallback((text: string) => {
    const content = text.trim();
    if (!content || run.current) return;
    const conversationId = latest.current.activeId ?? uid();
    const user = { id: uid(), role: "user" as const, content, status: "done" as const, local: true };
    const reply = { id: uid(), role: "assistant" as const, content: "", status: "streaming" as const, local: true };
    apply({ type: "ask", conversationId, user, reply });
    void stream({ kind: "ask", conversationId, userMessageId: user.id, replyId: reply.id, content });
  }, [apply, stream]);

  const retry = useCallback((replyId: string) => {
    const conversationId = latest.current.activeId;
    if (!conversationId || run.current) return;
    apply({ type: "retry", conversationId, replyId });
    void stream({ kind: "retry", conversationId, replyId });
  }, [apply, stream]);

  const stop = useCallback(() => run.current?.controller.abort(), []);

  const remove = useCallback(async (id: string) => {
    if (run.current?.conversationId === id) stop();
    const conversation = latest.current.conversations.find((c) => c.id === id);
    const messages = latest.current.threads[id];
    apply({ type: "remove", id });
    try { await deleteConversationApi(id); }
    catch (error) {
      // A 404 means it's already gone; anything else puts it back.
      if (error instanceof ApiError && error.status === 404) return;
      if (conversation) apply({ type: "restore", conversation, messages });
      setNotice(messageOf(error, "删除失败，请重试"));
    }
  }, [apply, stop]);

  const messages = activeId ? state.threads[activeId] ?? null : [];
  return {
    conversations: state.conversations,
    listed: state.listed,
    streaming: streamingIds(state),
    active: state.conversations.find((c) => c.id === activeId) ?? null,
    /** null while the active thread is being fetched. */
    messages,
    busy: running,
    notice,
    dismissNotice: () => setNotice(""),
    send,
    retry,
    stop,
    newChat: () => { stop(); apply({ type: "new" }); },
    select: (id: string) => { stop(); apply({ type: "select", id }); },
    remove: (id: string) => { void remove(id); },
  };
};