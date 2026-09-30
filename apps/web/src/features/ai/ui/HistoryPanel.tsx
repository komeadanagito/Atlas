import { useMemo, useState } from "react";
import type { AiConversationSummary } from "@atlas/shared";
import { IconClose, IconNewChat, IconSearch, IconTrash } from "../../../shared/ui/Icons";
import { relativeTime } from "../time";

type Props = {
  conversations: AiConversationSummary[];
  listed: boolean;
  streaming: Set<string>;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRemove: (id: string) => void;
  onClose: () => void;
};

/** Floating history drawer: opens over the rail, slides in from the left. */
export const HistoryPanel = ({ conversations, listed, streaming, activeId, onSelect, onNew, onRemove, onClose }: Props) => {
  const [filter, setFilter] = useState("");
  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return needle ? conversations.filter((c) => `${c.title} ${c.preview}`.toLowerCase().includes(needle)) : conversations;
  }, [conversations, filter]);
  const now = Date.now();

  return (
    <>
      <button type="button" aria-label="关闭历史对话" onClick={onClose} className="absolute inset-0 z-30 bg-black/[0.08] backdrop-blur-[1px]" />
      <aside
        aria-label="历史对话"
        className="swap-in absolute inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-[var(--aichat-stroke-tertiary)] bg-[var(--aichat-bg-chrome)] shadow-[var(--shadow-lg)]"
      >
        <div className="flex h-[50px] shrink-0 items-center justify-between border-b border-[var(--aichat-stroke-tertiary)] pl-4 pr-3">
          <span className="text-[15px] font-semibold text-[var(--aichat-text-primary)]">对话</span>
          <div className="flex gap-[3px]">
            <IconBtn label="新对话" onClick={onNew}><IconNewChat className="h-4 w-4" /></IconBtn>
            <IconBtn label="关闭" onClick={onClose}><IconClose className="h-4 w-4" /></IconBtn>
          </div>
        </div>
        <label className="mx-3 mb-1 mt-3 flex h-8 shrink-0 items-center gap-2 rounded-[var(--aichat-radius-lg)] bg-[var(--aichat-bg-secondary)] px-2.5 text-[var(--aichat-text-tertiary)] transition-shadow focus-within:bg-[var(--aichat-bg-elevated)] focus-within:ring-1 focus-within:ring-[var(--aichat-stroke-secondary)]">
          <IconSearch className="h-3.5 w-3.5 shrink-0" />
          <span className="sr-only">搜索对话</span>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="搜索对话"
            className="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--aichat-text-primary)] outline-none placeholder:text-[var(--aichat-placeholder)] focus-visible:outline-none"
          />
        </label>
        <nav className="soft-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-6 pt-1">
          {visible.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-[var(--aichat-text-tertiary)]">{!listed ? "加载中…" : filter ? "没有匹配的对话" : "还没有对话"}</p>
          ) : (
            <ul className="flex flex-col gap-[6px]">
              {visible.map((c) => {
                const selected = c.id === activeId;
                const live = streaming.has(c.id);
                return (
                  <li key={c.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => onSelect(c.id)}
                      aria-current={selected ? "page" : undefined}
                      className={`grid min-h-[58px] w-full grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-[9px] rounded-[var(--aichat-radius-lg)] p-2 text-left transition-colors duration-[120ms] ${selected ? "bg-[var(--aichat-bg-elevated)] shadow-[var(--aichat-shadow-sm)] ring-1 ring-[var(--aichat-stroke-tertiary)]" : "hover:bg-[var(--aichat-bg-secondary)]"}`}
                    >
                      <span className={`grid size-[34px] place-items-center rounded-[var(--aichat-radius-lg)] text-[13px] font-semibold ${selected ? "bg-[var(--aichat-fill-primary)] text-[var(--aichat-text-on-color)]" : "bg-[var(--aichat-bg-secondary)] text-[var(--aichat-text-secondary)]"}`}>
                        {c.title.trim().charAt(0).toUpperCase() || "…"}
                      </span>
                      <span className="grid min-w-0 gap-1">
                        <span className="truncate text-[14px] leading-none text-[var(--aichat-text-primary)]">{c.title}</span>
                        <span className={`truncate text-[12px] leading-none ${live ? "text-[var(--aichat-accent)]" : "text-[var(--aichat-text-tertiary)]"}`}>
                          {live ? "正在回答…" : c.preview || " "}
                        </span>
                      </span>
                      <span className="grid justify-items-end gap-2 self-start pt-[2px] text-[12px] leading-none text-[var(--aichat-text-tertiary)] transition-opacity group-hover:opacity-0 group-focus-within:opacity-0">
                        {live ? <span aria-label="生成中" className="ai-live-dot inline-block size-1.5 rounded-full bg-[var(--aichat-accent)]" /> : relativeTime(c.updatedAt, now)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(c.id)}
                      aria-label={`删除对话：${c.title}`}
                      className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-[var(--aichat-radius-sm)] text-[var(--aichat-text-tertiary)] opacity-0 transition-opacity hover:bg-[var(--aichat-bg-secondary)] hover:text-[var(--danger)] focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
      </aside>
    </>
  );
};

const IconBtn = ({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="grid size-8 place-items-center rounded-[var(--aichat-radius-lg)] text-[var(--aichat-icon-secondary)] transition-colors duration-[120ms] hover:bg-[var(--aichat-bg-secondary)] hover:text-[var(--aichat-text-primary)]"
  >
    {children}
  </button>
);