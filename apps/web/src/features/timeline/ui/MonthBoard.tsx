import type { TimelineItem } from "@atlas/shared";
import { WEEKDAY_LABELS, type MonthCell } from "../model";
import { EventChip } from "./EventChip";

type Props = {
  cells: MonthCell[];
  selected: string;
  selectedItems: TimelineItem[];
  onSelect: (date: string) => void;
  onOpenDay: (date: string) => void;
};

export const MonthBoard = ({ cells, selected, selectedItems, onSelect, onOpenDay }: Props) => (
  <div>
    <div className="grid grid-cols-7 text-center text-[11px] text-[var(--faint)]">
      {WEEKDAY_LABELS.map((label) => (
        <span key={label} className="py-2">
          {label}
        </span>
      ))}
    </div>
    <div className="grid grid-cols-7 gap-y-1">
      {cells.map((cell) => {
        const active = cell.date === selected;
        return (
          <button
            key={cell.date}
            onClick={() => onSelect(cell.date)}
            className={`flex flex-col items-center gap-1 rounded-2xl py-2 ${
              !cell.inMonth ? "opacity-30" : ""
            }`}
          >
            <span
              className={`display flex h-8 w-8 items-center justify-center rounded-full text-[15px] duration-200 ${
                active
                  ? "bg-[var(--accent)] text-white shadow-[0_6px_14px_-8px_rgba(77,132,184,.9)]"
                  : cell.isToday
                    ? "ring-1 ring-[var(--accent)]"
                    : "hover:bg-[var(--wash)]"
              }`}
            >
              {cell.dayOfMonth}
            </span>
            <span className="flex h-1 items-center justify-center">
              {cell.count > 0 ? <span className="h-1 w-1 rounded-full bg-[var(--accent)]" /> : null}
            </span>
          </button>
        );
      })}
    </div>

    <div className="mt-6 border-t border-[var(--line)] pt-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium">这一天</h2>
        {selectedItems.length > 0 ? (
          <button
            onClick={() => onOpenDay(selected)}
            className="text-[12px] text-[var(--muted)] hover:text-[var(--ink)]"
          >
            按时刻查看
          </button>
        ) : null}
      </div>
      <div className="mt-3 space-y-2">
        {selectedItems.length === 0 ? (
          <p className="text-sm text-[var(--faint)]">这一天还是空的</p>
        ) : (
          selectedItems.map((item) => <EventChip key={item.id} item={item} />)
        )}
      </div>
    </div>
  </div>
);