import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { IconArrowDown, IconCheck, IconCopy, IconUndo } from "../../../shared/ui/Icons";
import { Markdown, useCopy } from "../Markdown";
import type { Message } from "../model";

const STICK_PX = 64;

type Props = {
  scroller: RefObject<HTMLDivElement | null>;
  messages: Message[];
  busy: boolean;
  onRetry: (id: string) => void;
};

export const Transcript = ({ scroller, messages, busy, onRetry }: Props) => {
  const pinned = useRef(true);
  const [away, setAway] = useState(false);
  const last = messages.at(-1);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [scroller, messages.length, last?.content, last?.reasoning, last?.status]);

  const toBottom = () => {
    const el = scroller.current;
    if (!el) return;
    pinned.current = true;
    setAway(false);
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  if (messages.length === 0) return <Welcome />;

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          const near = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_PX;
          pinned.current = near;
          if (near === away) setAway(!near);
        }}
        className="soft-scroll h-full overflow-y-auto bg-[var(--aichat-bg-editor)]"
      >
        {/* .sand-virtual-transcript: padding 28px top, column centred at 690px via lateral padding. */}
        <ol aria-label="对话内容" className="mx-auto flex w-full max-w-[690px] flex-col px-4 pb-10 pt-7 sm:px-0">
          {messages.map((m) => (
            <Row key={m.id} message={m} animate={!!m.local} canRetry={!busy && m === last && m.role === "assistant"} onRetry={onRetry} />
          ))}
          {busy && last?.role === "user" ? <TypingRow /> : null}
        </ol>
      </div>
      <button
        type="button"
        onClick={toBottom}
        aria-label="回到最新"
        tabIndex={away ? 0 : -1}
        className={`absolute bottom-3 left-1/2 flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full border border-[var(--aichat-stroke-tertiary)] bg-white/95 px-3 text-[12px] text-[var(--aichat-text-tertiary)] shadow-[var(--shadow)] backdrop-blur transition-[opacity,transform] duration-200 ease-[var(--ease)] hover:text-[var(--aichat-text-primary)] ${away ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
      >
        <IconArrowDown className="h-3.5 w-3.5" />
        {busy ? "正在回答" : "回到最新"}
      </button>
    </div>
  );
};

const Welcome = () => (
  <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-[var(--aichat-bg-editor)] px-6 py-10 text-center">
    <h2 className="display text-[22px] font-semibold text-[var(--aichat-text-primary)]">有什么可以帮你？</h2>
    <p className="mt-1.5 text-[13px] text-[var(--aichat-text-tertiary)]">在下方输入问题，按 Enter 发送。</p>
  </div>
);

type RowProps = { message: Message; animate: boolean; canRetry: boolean; onRetry: (id: string) => void };

/** .sand-transcript-row { margin: 0 0 22px }; thinking/tool rows are full-width outline items, message is a bubble. */
const Row = ({ message, animate, canRetry, onRetry }: RowProps) => {
  const mine = message.role === "user";
  const streaming = message.status === "streaming";
  const { copied, copy } = useCopy(message.content);
  const showActions = !streaming && !!message.content;
  return (
    <li className={`mb-[22px] flex flex-col ${mine ? "items-end" : "items-start"} ${animate ? (mine ? "ai-enter-mine" : "ai-enter") : ""}`}>
      {!mine && message.reasoning ? <Thinking text={message.reasoning} active={streaming && !message.content} /> : null}

      {/* .sand-message-action-anchor (relative) > bubble + .sand-message-hover-actions (absolute bottom:-30px). */}
      <div className="group relative w-fit max-w-full">
        {mine ? (
          <p className="box-border max-w-[min(88%,640px,calc(100%-82px))] whitespace-pre-wrap break-words rounded-[var(--aichat-radius-3xl)] bg-[var(--aichat-bubble-user)] px-3 py-2 text-[14px] leading-[20px] text-[var(--aichat-text-on-color)]">
            {message.content}
          </p>
        ) : message.content ? (
          <div className="box-border min-w-0 max-w-[min(88%,640px,calc(100%-82px))] rounded-[var(--aichat-radius-3xl)] bg-[var(--aichat-bubble-agent)] px-3 py-2 text-[14px] leading-[20px] text-[var(--aichat-text-primary)]">
            <Markdown source={message.content} />
            {streaming ? <span aria-hidden="true" className="ai-caret" /> : null}
          </div>
        ) : streaming && !message.reasoning ? (
          <TypingBubble />
        ) : message.status === "done" ? (
          <p className="px-1 text-[11px] text-[var(--aichat-text-tertiary)]">已停止生成</p>
        ) : null}

        <div
          data-find-skip
          className={`absolute -bottom-[30px] z-[2] flex gap-1 transition-opacity duration-[120ms] ${mine ? "right-0" : "left-0"} ${showActions ? "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100" : "invisible"}`}
        >
          {showActions ? (
            <>
              <HoverAction label={copied ? "已复制" : "复制"} onClick={copy}>{copied ? <IconCheck className="h-3 w-3" /> : <IconCopy className="h-3 w-3" />}</HoverAction>
              {canRetry ? <HoverAction label="重新生成" onClick={() => onRetry(message.id)}><IconUndo className="h-3 w-3" /></HoverAction> : null}
            </>
          ) : null}
        </div>
      </div>

      {message.status === "error" ? (
        <div role="alert" className="mt-2 flex items-center gap-2 text-[11px] text-[var(--danger)]">
          <span>{message.error}</span>
          {canRetry ? (
            <button type="button" onClick={() => onRetry(message.id)} className="inline-flex items-center gap-1 font-medium text-[var(--aichat-accent)] hover:underline">
              <IconUndo className="h-3 w-3" />
              重试
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
};

/** .sand-message-hover-actions__button: dark chip, min-height 28px, radius 7px, 11px text; inverted to a light hairline chip. */
const HoverAction = ({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="inline-flex min-h-[28px] items-center gap-1.5 rounded-[7px] border border-[var(--aichat-stroke-tertiary)] bg-[var(--aichat-bg-elevated)] px-2 text-[11px] text-[var(--aichat-text-secondary)] shadow-[var(--aichat-shadow-sm)] transition-colors duration-[120ms] hover:bg-[var(--aichat-bg-secondary)] hover:text-[var(--aichat-text-primary)]"
  >
    {children}
    <span>{label}</span>
  </button>
);

/** .sand-message-typing: pill padding 10px 12px, radius 14px, three 5px dots. */
const TypingBubble = () => (
  <span role="status" aria-label="正在思考" className="flex w-max items-center gap-1 rounded-[14px] bg-[var(--aichat-bubble-agent)] px-3 py-[10px]">
    {[0, 1, 2].map((i) => <span key={i} className="ai-dot size-[5px] rounded-full bg-[var(--aichat-text-tertiary)]" style={{ animationDelay: `${i * 160}ms` }} />)}
  </span>
);

/** Standalone typing indicator appended at the transcript end while the agent runs. */
const TypingRow = () => (
  <li className="mb-[22px] flex flex-col items-start">
    <TypingBubble />
  </li>
);

/** .sand-outline-item[data-kind=thinking]: bordered elevated card, 9px radius, 34px row, hand-rolled chevron. */
const Thinking = ({ text, active }: { text: string; active: boolean }) => {
  const [manual, setManual] = useState<boolean | null>(null);
  const open = manual ?? active;
  const lastLine = text.trim().split("\n").filter(Boolean).at(-1) ?? "";
  return (
    <div className="mb-[10px] w-full rounded-[9px] border border-[var(--aichat-stroke-tertiary)] bg-[var(--aichat-bg-elevated)]" data-find-skip={open ? undefined : true}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setManual(!open)}
        className="flex min-h-[34px] w-full items-center gap-2 rounded-[9px] px-[9px] py-[7px] text-left transition-colors duration-[120ms] hover:bg-[var(--aichat-bg-secondary)]"
      >
        <ThinkingIcon className="size-4 shrink-0 text-[var(--aichat-icon-secondary)]" />
        <span className={`shrink-0 text-[11px] font-semibold leading-none ${active ? "ai-shimmer" : "text-[var(--aichat-text-primary)]"}`}>
          {active ? "思考中" : "已思考"}
        </span>
        {!open ? <span className="min-w-0 flex-1 truncate text-[10px] leading-none text-[var(--aichat-text-tertiary)]">{lastLine}</span> : <span className="flex-1" />}
        <span
          aria-hidden="true"
          className="size-[6px] shrink-0 border-b border-r border-[var(--aichat-text-secondary)] transition-transform duration-[120ms]"
          style={{ transform: open ? "rotate(45deg)" : "rotate(-45deg)" }}
        />
      </button>
      {open ? (
        <div className="px-[10px] pb-[10px] pl-[25px] text-[10px] leading-[1.6] text-[var(--aichat-text-secondary)]">
          <pre className="soft-scroll max-h-[220px] overflow-y-auto whitespace-pre-wrap break-words font-[inherit]">{text}</pre>
        </div>
      ) : null}
    </div>
  );
};

/** A minimal "thinking" glyph: three dots in a rounded thought bubble, echoing the reference's thinking-medium icon. */
const ThinkingIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={className} aria-hidden="true">
    <rect x="1.5" y="2.5" width="13" height="9" rx="4.5" />
    <path d="M5.5 11.5 5 14l3-2" strokeLinejoin="round" />
    <circle cx="5.5" cy="7" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="8" cy="7" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="10.5" cy="7" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);