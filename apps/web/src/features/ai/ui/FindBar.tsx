import { useEffect, useRef, type KeyboardEvent } from "react";
import { IconArrowDown, IconArrowUp, IconClose, IconSearch } from "../../../shared/ui/Icons";

type Props = {
  query: string;
  count: number;
  index: number;
  onQuery: (value: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
};

export const FindBar = ({ query, count, index, onQuery, onNext, onPrev, onClose }: Props) => {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); input.current?.select(); }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); if (e.shiftKey) onPrev(); else onNext(); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  const nav = "flex size-7 items-center justify-center rounded-md text-[var(--muted)] hover:bg-black/[0.05] hover:text-[var(--ink)] disabled:opacity-30";
  return (
    <div role="search" className="swap-in absolute right-3 top-2 z-10 flex h-10 items-center gap-1 rounded-xl border border-black/[0.08] bg-white pl-2.5 pr-1 shadow-[var(--shadow-lg)] sm:right-5">
      <IconSearch className="h-3.5 w-3.5 shrink-0 text-[var(--faint)]" />
      <label htmlFor="ai-find" className="sr-only">在对话中查找</label>
      <input
        id="ai-find"
        ref={input}
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="在对话中查找"
        className="w-36 bg-transparent text-[12.5px] outline-none focus-visible:outline-none sm:w-48"
      />
      <span aria-live="polite" className="min-w-10 text-right text-[11px] tabular-nums text-[var(--faint)]">
        {query.trim() ? `${count ? index + 1 : 0}/${count}` : ""}
      </span>
      <button type="button" onClick={onPrev} disabled={!count} aria-label="上一条" className={nav}><IconArrowUp className="h-3.5 w-3.5" /></button>
      <button type="button" onClick={onNext} disabled={!count} aria-label="下一条" className={nav}><IconArrowDown className="h-3.5 w-3.5" /></button>
      <button type="button" onClick={onClose} aria-label="关闭查找" className={nav}><IconClose className="h-3.5 w-3.5" /></button>
    </div>
  );
};