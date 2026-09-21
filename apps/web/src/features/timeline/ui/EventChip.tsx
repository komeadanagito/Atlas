import { TAG_META, type TimelineItem } from "@atlas/shared";
import { formatClock } from "../model";

type Props = {
  item: TimelineItem;
  compact?: boolean;
};

export const EventChip = ({ item, compact }: Props) => (
  <article
    className={`relative overflow-hidden rounded-lg bg-[var(--wash)] duration-200 ${
      compact ? "px-1.5 py-1" : "px-3 py-2.5"
    }`}
  >
    <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-[var(--accent)]" />
    <p className={`truncate pl-1.5 font-medium ${compact ? "text-[11px] leading-4" : "text-[13px]"}`}>
      {item.title}
    </p>
    {compact ? (
      <p className="truncate pl-1.5 text-[10px] text-[var(--muted)]">{formatClock(item.startAt)}</p>
    ) : (
      <p className="mt-0.5 pl-1.5 text-[12px] text-[var(--muted)]">
        {TAG_META[item.tag].label} · {formatClock(item.startAt)}
      </p>
    )}
  </article>
);