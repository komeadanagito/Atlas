import { conversationTitle, previewOf, type AiConversationSummary, type AiMessage } from "@atlas/shared";

/** `local` marks turns created in this tab (they animate in); it is never sent or persisted. */
export type Message = AiMessage & { local?: boolean };

/** Server is the source of truth; this is the client's cache of it plus optimistic in-flight turns. */
export type ChatState = {
  conversations: AiConversationSummary[];
  /** Loaded threads only; a missing key means "not fetched yet". */
  threads: Record<string, Message[]>;
  activeId: string | null;
  listed: boolean;
};

export type ChatAction =
  | { type: "listed"; conversations: AiConversationSummary[] }
  | { type: "new" }
  | { type: "select"; id: string }
  | { type: "loaded"; id: string; messages: Message[] }
  | { type: "remove"; id: string }
  | { type: "restore"; conversation: AiConversationSummary; messages?: Message[] }
  | { type: "ask"; conversationId: string; user: Message; reply: Message }
  | { type: "retry"; conversationId: string; replyId: string }
  | { type: "delta"; conversationId: string; replyId: string; field: "content" | "reasoning"; text: string }
  | { type: "settle"; conversationId: string; replyId: string; error?: string };

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    // Non-secure contexts (plain-HTTP LAN) lack randomUUID; the server only needs a well-formed v4 id.
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (Number(c) ^ ((Math.random() * 16) & (15 >> (Number(c) / 4)))).toString(16));

export const emptyState: ChatState = { conversations: [], threads: {}, activeId: null, listed: false };

const byRecent = (a: AiConversationSummary, b: AiConversationSummary) => b.updatedAt.localeCompare(a.updatedAt);

const touch = (state: ChatState, id: string): AiConversationSummary[] =>
  state.conversations.map((c) => (c.id === id ? { ...c, updatedAt: new Date().toISOString() } : c)).sort(byRecent);

const patchReply = (state: ChatState, conversationId: string, replyId: string, patch: (m: Message) => Message): ChatState => {
  const thread = state.threads[conversationId];
  if (!thread) return state;
  return { ...state, threads: { ...state.threads, [conversationId]: thread.map((m) => (m.id === replyId ? patch(m) : m)) } };
};

const without = <T,>(record: Record<string, T>, key: string) => {
  const { [key]: _, ...rest } = record;
  return rest;
};

export const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case "listed": {
      // Keep optimistic conversations the server hasn't reported yet.
      const known = new Set(action.conversations.map((c) => c.id));
      const pending = state.conversations.filter((c) => !known.has(c.id) && state.threads[c.id]);
      return { ...state, listed: true, conversations: [...pending, ...action.conversations].sort(byRecent) };
    }
    case "new":
      return { ...state, activeId: null };
    case "select":
      return { ...state, activeId: action.id };
    case "loaded":
      return { ...state, threads: { ...state.threads, [action.id]: action.messages } };
    case "remove":
      return {
        ...state,
        conversations: state.conversations.filter((c) => c.id !== action.id),
        threads: without(state.threads, action.id),
        activeId: state.activeId === action.id ? null : state.activeId,
      };
    case "restore":
      return {
        ...state,
        conversations: [...state.conversations.filter((c) => c.id !== action.conversation.id), action.conversation].sort(byRecent),
        threads: action.messages ? { ...state.threads, [action.conversation.id]: action.messages } : state.threads,
      };
    case "ask": {
      const { conversationId: id } = action;
      const exists = state.conversations.some((c) => c.id === id);
      const preview = previewOf(action.user.content);
      const conversations = exists
        ? state.conversations.map((c) => (c.id === id ? { ...c, preview } : c))
        : [{ id, title: conversationTitle(action.user.content), updatedAt: "", preview }, ...state.conversations];
      const thread = [...(state.threads[id] ?? []), action.user, action.reply];
      const next = { ...state, conversations, threads: { ...state.threads, [id]: thread }, activeId: id };
      return { ...next, conversations: touch(next, id) };
    }
    case "retry":
      return patchReply({ ...state, conversations: touch(state, action.conversationId) }, action.conversationId, action.replyId, ({ reasoning: _, error: __, ...m }) => ({ ...m, content: "", status: "streaming" }));
    case "delta":
      return patchReply(state, action.conversationId, action.replyId, (m) => ({ ...m, [action.field]: (m[action.field] ?? "") + action.text }));
    case "settle": {
      const reply = state.threads[action.conversationId]?.find((m) => m.id === action.replyId);
      const preview = reply?.content ? previewOf(reply.content) : null;
      const next = preview === null ? state : {
        ...state,
        conversations: state.conversations.map((c) => (c.id === action.conversationId ? { ...c, preview } : c)),
      };
      return patchReply(next, action.conversationId, action.replyId, (m) => ({
        ...m,
        status: action.error ? "error" : "done",
        ...(action.error ? { error: action.error } : {}),
      }));
    }
    default:
      return state;
  }
};

/** Conversations whose reply is live in this tab (drives the sidebar status dot). */
export const streamingIds = (state: ChatState) =>
  new Set(Object.entries(state.threads).filter(([, thread]) => thread.some((m) => m.status === "streaming")).map(([id]) => id));