import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { IconPlus, IconSend, IconStop } from "../../../shared/ui/Icons";

type Props = { busy: boolean; disabled: boolean; onSend: (text: string) => void; onStop: () => void };

const MAX_HEIGHT = 220;

export const Composer = ({ busy, disabled, onSend, onStop }: Props) => {
  const [text, setText] = useState("");
  const field = useRef<HTMLTextAreaElement>(null);
  const canSend = !busy && !disabled && !!text.trim();

  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [text]);

  const submit = () => {
    if (!canSend) return;
    onSend(text);
    setText("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
    else if (e.key === "Escape") { if (busy) onStop(); else e.currentTarget.blur(); }
  };

  return (
    /* .sand-chat-input-dock: padding 8px max(24px,(100%-700px)/2) 18px, no divider above. */
    <div className="shrink-0 bg-[var(--aichat-bg-editor)] px-4 pb-[18px] pt-2 sm:px-6">
      <form
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        onClick={(e) => { if (e.target === e.currentTarget) field.current?.focus(); }}
        className="mx-auto max-w-[700px] cursor-text rounded-[var(--aichat-radius-2xl)] border border-[var(--aichat-stroke-secondary)] bg-[var(--aichat-bg-elevated)] p-[9px] shadow-[var(--aichat-shadow-sm)] transition-[border-color,box-shadow] duration-[120ms] focus-within:border-[var(--aichat-text-disabled)]"
      >
        <label htmlFor="ai-input" className="sr-only">输入问题</label>
        {/* .sand-prompt-field: min-height 48px, no border, no outline, line-height 1.4. */}
        <textarea
          id="ai-input"
          ref={field}
          rows={1}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={disabled ? "AI 服务尚未配置" : "问点什么，或直接提问…"}
          className="soft-scroll block min-h-[48px] w-full resize-none border-0 bg-transparent px-1.5 py-1 text-[14px] leading-[1.4] text-[var(--aichat-text-primary)] outline-none placeholder:text-[var(--aichat-placeholder)] focus-visible:outline-none disabled:cursor-not-allowed"
        />
        {/* .sand-prompt-actions-row: space-between; left attach circle, right trailing cluster. */}
        <div className="flex items-center justify-between">
          <AttachButton />
          <div className="flex gap-1.5">
            <span className="mr-1 hidden items-center text-[10px] text-[var(--aichat-text-tertiary)] sm:flex">
              {busy ? "Esc 停止生成" : "Enter 发送 · Shift+Enter 换行"}
            </span>
            {busy ? (
              <RoundButton tone="primary" label="停止生成" onClick={onStop}>
                <IconStop className="h-3 w-3 fill-current" />
              </RoundButton>
            ) : (
              <RoundButton tone="primary" label="发送" type="submit" disabled={!canSend}>
                <IconSend className="h-4 w-4" />
              </RoundButton>
            )}
          </div>
        </div>
      </form>
      <p className="mt-2 text-center text-[11px] text-[var(--aichat-text-tertiary)]">AI 生成内容可能有误，请核实重要信息。</p>
    </div>
  );
};

/** .sand-prompt-attach: 30px circle, secondary fill. */
const AttachButton = () => (
  <button
    type="button"
    aria-label="附件（暂不可用）"
    title="附件（暂不可用）"
    disabled
    className="grid size-[30px] place-items-center rounded-full bg-[var(--aichat-fill-secondary)] text-[var(--aichat-icon-secondary)] transition-colors duration-[120ms] disabled:cursor-not-allowed disabled:opacity-40"
  >
    <IconPlus className="h-4 w-4" />
  </button>
);

/** .sand-prompt-send: 30px circle; primary fill with on-color glyph; disabled opacity .4. */
const RoundButton = ({ tone, label, type = "button", disabled, onClick, children }: {
  tone: "primary" | "secondary";
  label: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className={`grid size-[30px] place-items-center rounded-full transition-[background-color,opacity,transform] duration-[120ms] active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 ${
      tone === "primary"
        ? "bg-[var(--aichat-fill-primary)] text-[var(--aichat-text-on-color)]"
        : "bg-[var(--aichat-fill-secondary)] text-[var(--aichat-icon-secondary)]"
    }`}
  >
    {children}
  </button>
);