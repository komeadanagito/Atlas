import { TAG_META, type TimelineItem } from "@atlas/shared";
import { IconTrash } from "../../../shared/ui/Icons";
import { addMinutesToClock, formatClock } from "../model";

type NoteProps = {
  item: TimelineItem;
  compact?: boolean;
  selected?: boolean;
  deleting?: boolean;
  deleteDisabled?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
};

export const HourNote = ({ item, compact, selected, deleting, deleteDisabled, onSelect, onDelete }: NoteProps) => {
  const end = addMinutesToClock(item.startAt, item.durationMin);
  const isNote = item.tag === "note";

  return (
    <article
      className={`relative min-w-0 overflow-hidden text-left text-[var(--ink)] transition-colors duration-200 ${
        compact
          ? "w-[7.5rem] shrink-0 rounded-lg px-2.5 py-1.5"
          : "group w-full rounded-xl p-4"
      } ${
        selected
          ? "bg-black/[0.04]"
          : "bg-white ring-1 ring-[var(--line)] hover:ring-[var(--faint)]/40"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-2.5 bottom-2.5 left-0 w-[2px] rounded-r-full ${
          isNote ? "bg-[var(--violet)]/60" : "bg-[var(--ink)]/40"
        }`}
      />
      {onSelect ? (
        <button
          type="button"
          aria-label={`编辑${item.title}`}
          aria-pressed={!!selected}
          onClick={onSelect}
          className="absolute inset-0 rounded-xl"
        />
      ) : null}
      {onDelete ? (
        <button
          type="button"
          aria-label={`删除${item.title}`}
          disabled={deleteDisabled}
          onClick={onDelete}
          className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full text-[var(--faint)] transition-colors hover:bg-black/[0.04] hover:text-[var(--ink)] disabled:opacity-40"
        >
          <IconTrash className="h-4 w-4" />
        </button>
      ) : null}
      <p
        className={`truncate font-medium text-[var(--ink)] ${
          compact ? "pl-1.5 text-xs" : "pl-2 pr-7 text-sm"
        }`}
        title={item.title}
      >
        {item.title}
      </p>
      {compact ? (
        <p className="mt-0.5 truncate pl-1.5 text-[10px] text-[var(--faint)] tabular-nums">
          {deleting ? "正在删除…" : `${formatClock(item.startAt)}–${end}`}
        </p>
      ) : (
        <div className="mt-1.5 flex items-center gap-1.5 pl-2 text-xs text-[var(--muted)]">
          <span className="text-[10px] font-normal text-[var(--faint)] uppercase tracking-wider">
            {TAG_META[item.tag].label}
          </span>
          <span className="tabular-nums text-[var(--faint)]">
            {deleting ? "正在删除…" : `${formatClock(item.startAt)}–${end}`}
          </span>
        </div>
      )}
    </article>
  );
};

export const HourNoteStrip = ({ items, limit = 4 }: { items: TimelineItem[]; limit?: number }) => (
  <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
    {items.slice(0, limit).map((item) => (
      <HourNote key={item.id} item={item} compact />
    ))}
    {items.length > limit ? (
      <span className="shrink-0 text-[10px] font-normal text-[var(--faint)] tabular-nums">
        +{items.length - limit}
      </span>
    ) : null}
  </div>
);

type BoardProps = {
  items: TimelineItem[];
  selectedId?: string;
  deletingId?: string | null;
  onSelect: (item: TimelineItem) => void;
  onDelete: (id: string) => void;
};

export const HourNoteBoard = ({ items, selectedId, deletingId, onSelect, onDelete }: BoardProps) => {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--line)] px-5 py-10 text-center">
        <p className="text-sm font-medium text-[var(--ink)]">这一小时还空着</p>
        <p className="mt-1 text-pretty text-xs text-[var(--faint)]">在下方填写事件名称，作为这一小时的第一条安排。</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3" aria-busy={!!deletingId}>
      {items.map((item) => (
        <HourNote
          key={item.id}
          item={item}
          selected={item.id === selectedId}
          deleting={item.id === deletingId}
          deleteDisabled={!!deletingId}
          onSelect={() => onSelect(item)}
          onDelete={() => onDelete(item.id)}
        />
      ))}
    </div>
  );
};