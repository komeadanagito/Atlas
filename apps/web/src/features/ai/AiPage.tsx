import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AiStatus } from "@atlas/shared";
import { useAuth } from "../auth/AuthContext";
import { IconNewChat, IconSearch, IconSidebar } from "../../shared/ui/Icons";
import { fetchAiStatus } from "./api";
import { useFindInChat } from "./findInChat";
import { Composer } from "./ui/Composer";
import { FindBar } from "./ui/FindBar";
import { HistoryPanel } from "./ui/HistoryPanel";
import { Rail } from "./ui/Rail";
import { Transcript } from "./ui/Transcript";
import { useChat } from "./useChat";

export const AiPage = () => {
  const { user } = useAuth();
  const chat = useChat(user?.id ?? "anonymous");
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const last = chat.messages?.at(-1);
  const find = useFindInChat(scroller, `${chat.active?.id}:${chat.messages?.length}:${last?.content.length}:${last?.status}`);

  useEffect(() => {
    const controller = new AbortController();
    fetchAiStatus(controller.signal).then(setStatus).catch(() => { if (!controller.signal.aborted) setStatus({ configured: false, model: null }); });
    return () => controller.abort();
  }, []);

  const pick = (action: () => void) => { action(); setShowHistory(false); find.close(); };

  return (
    <main className="rise surface relative flex min-h-0 flex-1 overflow-hidden rounded-[22px]">
      {/* Screenshot: a narrow left rail of coloured avatar tiles; history opens as a floating panel. */}
      <Rail
        conversations={chat.conversations}
        streaming={chat.streaming}
        activeId={chat.active?.id ?? null}
        onSelect={(id) => pick(() => chat.select(id))}
        onNew={() => pick(chat.newChat)}
        onOpenHistory={() => setShowHistory(true)}
      />
      {showHistory ? (
        <HistoryPanel
          conversations={chat.conversations}
          listed={chat.listed}
          streaming={chat.streaming}
          activeId={chat.active?.id ?? null}
          onSelect={(id) => pick(() => chat.select(id))}
          onNew={() => pick(chat.newChat)}
          onRemove={chat.remove}
          onClose={() => setShowHistory(false)}
        />
      ) : null}

      {/* Reference: .sand-chat-stage — bg-editor, flex column, overflow hidden. */}
      <section aria-label="AI 对话" className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--aichat-bg-editor)]">
        {/* Reference: .sand-chat-header — min-height 51px, identity (28px avatar + name + Working) left, ghost controls right. */}
        <header className="flex min-h-[51px] shrink-0 items-center gap-2 border-b border-[var(--aichat-stroke-tertiary)] px-4">
          <button type="button" onClick={() => setShowHistory(true)} aria-label="历史对话" className="grid size-8 place-items-center rounded-[var(--aichat-radius-lg)] text-[var(--aichat-icon-secondary)] transition-colors hover:bg-[var(--aichat-bg-secondary)] hover:text-[var(--aichat-text-primary)] md:hidden">
            <IconSidebar className="h-4 w-4" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-[9px] px-[7px] py-[5px]">
            <AgentMark className="size-7 shrink-0" seed={chat.active?.id ?? "atlas"} />
            <div className="min-w-0 flex-1 leading-tight">
              <h1 className="truncate text-[14px] font-semibold text-[var(--aichat-text-primary)]">{chat.active?.title ?? "新对话"}</h1>
              {chat.busy ? <small className="truncate text-[11px] text-[var(--aichat-accent)]">正在回答…</small> : null}
            </div>
          </div>
          <div className="inline-flex shrink-0 items-center gap-[2px]">
            {chat.messages?.length ? (
              <button type="button" onClick={find.open ? find.close : find.show} aria-pressed={find.open} aria-label="在对话中查找 (Ctrl+F)" title="查找 (Ctrl+F)" className="grid size-8 place-items-center rounded-[var(--aichat-radius-lg)] text-[var(--aichat-icon-secondary)] transition-colors hover:bg-[var(--aichat-bg-secondary)] hover:text-[var(--aichat-text-primary)]">
                <IconSearch className="h-4 w-4" />
              </button>
            ) : null}
            <button type="button" onClick={() => pick(chat.newChat)} aria-label="新对话" title="新对话" className="grid size-8 place-items-center rounded-[var(--aichat-radius-lg)] text-[var(--aichat-icon-secondary)] transition-colors hover:bg-[var(--aichat-bg-secondary)] hover:text-[var(--aichat-text-primary)]">
              <IconNewChat className="h-4 w-4" />
            </button>
          </div>
        </header>

        {find.open ? (
          <FindBar query={find.query} count={find.count} index={find.index} onQuery={find.setQuery} onNext={find.next} onPrev={find.prev} onClose={find.close} />
        ) : null}

        {status && !status.configured ? (
          <Banner tone="amber">
            AI 服务尚未配置。在根目录 <code className="font-mono">.env</code> 中设置 <code className="font-mono">AI_API_KEY</code>（可选 <code className="font-mono">AI_MODEL</code>、<code className="font-mono">AI_BASE_URL</code>）后重启 API。
          </Banner>
        ) : null}
        {chat.notice ? (
          <Banner tone="danger" onDismiss={chat.dismissNotice}>{chat.notice}</Banner>
        ) : null}

        {chat.messages === null ? (
          <p role="status" className="flex flex-1 items-center justify-center text-xs text-[var(--aichat-text-tertiary)]">正在加载对话…</p>
        ) : (
          <Transcript key={chat.active?.id ?? "new"} scroller={scroller} messages={chat.messages} busy={chat.busy} onRetry={chat.retry} />
        )}
        <Composer busy={chat.busy} disabled={status?.configured === false} onSend={chat.send} onStop={chat.stop} />
      </section>
    </main>
  );
};

/** Screenshot: a coloured rounded-square agent mark with two "eye" dots, tinted per conversation. */
export const AgentMark = ({ seed, className = "" }: { seed: string; className?: string }) => {
  const palette = ["#f54e00", "#8a6d3b", "#1084fe", "#9159fe", "#00bca6", "#ff309b", "#ff9800"];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const color = palette[hash % palette.length];
  return (
    <span aria-hidden="true" className={`relative grid place-items-center rounded-[8px] ${className}`} style={{ background: color }}>
      <span className="flex gap-[3px]">
        <span className="size-[3px] rounded-full bg-white/90" />
        <span className="size-[3px] rounded-full bg-white/90" />
      </span>
    </span>
  );
};

const Banner = ({ tone, onDismiss, children }: { tone: "amber" | "danger"; onDismiss?: () => void; children: ReactNode }) => (
  <div
    role={tone === "danger" ? "alert" : "status"}
    className={`mx-auto mt-3 flex w-[calc(100%-2rem)] max-w-[700px] items-center gap-2 rounded-[var(--aichat-radius-lg)] px-3.5 py-2.5 text-[12px] leading-relaxed ${tone === "amber" ? "bg-[var(--amber-soft)] text-[var(--amber)]" : "bg-[var(--danger-soft)] text-[var(--danger)]"}`}
  >
    <span className="flex-1">{children}</span>
    {onDismiss ? <button type="button" onClick={onDismiss} className="shrink-0 rounded-full px-2 py-0.5 font-medium hover:bg-white/70">知道了</button> : null}
  </div>
);