import type { AiConversationSummary } from "@atlas/shared";
import { IconNewChat, IconSidebar } from "../../../shared/ui/Icons";
import { AgentMark } from "../AiPage";

type Props = {
  conversations: AiConversationSummary[];
  streaming: Set<string>;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onOpenHistory: () => void;
};

/** Screenshot rail: ~64px column of coloured avatar tiles; bottom cluster = new chat + history grid. */
export const Rail = ({ conversations, streaming, activeId, onSelect, onNew, onOpenHistory }: Props) => (
  <aside
    aria-label="对话栏"
    className="flex w-[64px] shrink-0 flex-col items-center border-r border-[var(--aichat-stroke-tertiary)] bg-[var(--aichat-bg-chrome)] py-3"
  >
    <nav aria-label="最近对话" className="soft-scroll flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto px-2">
      {conversations.map((c) => {
        const selected = c.id === activeId;
        const live = streaming.has(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            aria-label={c.title}
            aria-current={selected ? "page" : undefined}
            title={c.title}
            className={`relative shrink-0 rounded-[10px] transition-transform duration-[120ms] active:scale-90 ${selected ? "ring-2 ring-[var(--aichat-text-primary)] ring-offset-2 ring-offset-[var(--aichat-bg-chrome)]" : "opacity-80 hover:opacity-100"}`}
          >
            <AgentMark seed={c.id} className="size-9" />
            {live ? <span aria-label="生成中" className="ai-live-dot absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[var(--aichat-accent)] ring-2 ring-[var(--aichat-bg-chrome)]" /> : null}
          </button>
        );
      })}
    </nav>
    <div className="flex shrink-0 flex-col items-center gap-1.5 pt-3">
      <RailButton label="新对话" onClick={onNew}>
        <IconNewChat className="h-4 w-4" />
      </RailButton>
      <RailButton label="历史对话" onClick={onOpenHistory}>
        <IconSidebar className="h-4 w-4" />
      </RailButton>
    </div>
  </aside>
);

const RailButton = ({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="grid size-9 place-items-center rounded-[10px] text-[var(--aichat-icon-secondary)] transition-colors duration-[120ms] hover:bg-[var(--aichat-bg-secondary)] hover:text-[var(--aichat-text-primary)]"
  >
    {children}
  </button>
);