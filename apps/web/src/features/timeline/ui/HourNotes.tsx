import { TAG_META, type TimelineItem } from "@atlas/shared";
import { addMinutesToClock, formatClock } from "../model";

type NoteProps = {
  item: TimelineItem;
  compact?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
};

export const HourNote = ({ item, compact, selected, onSelect, onDelete }: NoteProps) => {
  const end = addMinutesToClock(item.startAt, item.durationMin);
  return (
    <article
      onClick={onSelect}
      className={`relative overflow-hidden text-left ${
        compact
          ? "w-[7.5rem] shrink-0 rounded-lg bg-[var(--wash)] px-2 py-1.5"
          : "min-w-0 w-full rounded-xl bg-white px-3 py-2.5 shadow-[var(--shadow)]"
      } ${onSelect ? "cursor-pointer" : ""} ${
        selected ? "ring-2 ring-[var(--accent)]" : onSelect ? "hover:ring-1 hover:ring-[var(--accent)]/35" : ""
      }`}
    >
      <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-[var(--accent)]" />
      {onDelete ? (
        <button
          type="button"
          aria-label={`删除${item.title}`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full text-[var(--faint)] hover:bg-white hover:text-[var(--ink)]"
        >
          ×
        </button>
      ) : null}
      <p className={`truncate pl-1.5 font-medium ${compact ? "text-[12px]" : "pr-5 text-[13px]"}`}>{item.title}</p>
      <p className={`truncate pl-1.5 text-[var(--muted)] ${compact ? "mt-0.5 text-[10px]" : "mt-0.5 text-[11px]"}`}>
        {compact ? `${formatClock(item.startAt)}–${end}` : `${TAG_META[item.tag].label} · ${formatClock(item.startAt)}–${end}`}
      </p>
    </article>
  );
};

export const HourNoteStrip = ({ items, limit = 4 }: { items: TimelineItem[]; limit?: number }) => (
  <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
    {items.slice(0, limit).map((item) => (
      <HourNote key={item.id} item={item} compact />
    ))}
    {items.length > limit ? (
      <span className="shrink-0 text-[11px] text-[var(--faint)]">+{items.length - limit}</span>
    ) : null}
  </div>
);

type BoardProps = {
  items: TimelineItem[];
  selectedId?: string;
  onSelect: (item: TimelineItem) => void;
  onDelete: (id: string) => void;
};

export const HourNoteBoard = ({ items, selectedId, onSelect, onDelete }: BoardProps) => {
  if (items.length === 0) {
    return (
      <div className="flex h-14 items-center rounded-xl bg-white/90 px-3 text-xs text-[var(--muted)]">
        这一小时还没有安排
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <HourNote
          key={item.id}
          item={item}
          selected={item.id === selectedId}
          onSelect={() => onSelect(item)}
          onDelete={() => onDelete(item.id)}
        />
      ))}
    </div>
  );
};