import { TAG_META, type TimelineItem } from "@atlas/shared";
import { formatClock } from "../model";

type Props = {
  item: TimelineItem;
  compact?: boolean;
};

export const EventChip = ({ item, compact }: Props) => {
  const isNote = item.tag === "note";
  return (
    <article
      aria-label={`${TAG_META[item.tag].label}：${item.title}，${formatClock(item.startAt)}`}
      className={`relative overflow-hidden text-[var(--ink)] transition-colors duration-200 ${
        compact
          ? "rounded-lg bg-black/[0.03] hover:bg-black/[0.05] px-2.5 py-1.5"
          : "rounded-lg bg-black/[0.03] hover:bg-black/[0.05] p-3"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-2 bottom-2 left-0 w-[2px] rounded-r-full ${
          isNote ? "bg-[var(--violet)]/60" : "bg-[var(--ink)]/40"
        }`}
      />
      <div className="min-w-0 pl-1.5">
        <p className={`truncate font-medium text-[var(--ink)] ${compact ? "text-[11px] leading-tight" : "text-[13px]"}`}>
          {item.title}
        </p>
        {compact ? (
          <p className="mt-0.5 truncate text-[10px] text-[var(--faint)] tabular-nums">
            {formatClock(item.startAt)}
          </p>
        ) : (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
            <span className="text-[10px] font-normal text-[var(--faint)] uppercase tracking-wider">
              {TAG_META[item.tag].label}
            </span>
            <span className="tabular-nums text-[var(--faint)]">{formatClock(item.startAt)}</span>
          </div>
        )}
      </div>
    </article>
  );
};