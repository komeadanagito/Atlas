import type { TimelineItem } from "@atlas/shared";
import { parseDateKey, weekdayOf, WEEKDAY_LABELS, type MonthCell } from "../model";
import { EventChip } from "./EventChip";

type Props = {
  cells: MonthCell[];
  selected: string;
  selectedItems: TimelineItem[];
  onSelect: (date: string) => void;
  onOpenDay: (date: string) => void;
};

export const MonthBoard = ({ cells, selected, selectedItems, onSelect, onOpenDay }: Props) => {
  const date = parseDateKey(selected);
  const selectedLabel = `${date.getMonth() + 1}月${date.getDate()}日 ${weekdayOf(selected)}`;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <div className="flex-1 rounded-xl bg-white p-6 sm:p-8 ring-1 ring-[var(--line)]">
        <div className="grid grid-cols-7 pb-3 text-center text-[10px] font-normal tracking-wider text-[var(--faint)] uppercase">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((cell) => {
            const active = cell.date === selected;
            return (
              <button
                type="button"
                key={cell.date}
                onClick={() => onSelect(cell.date)}
                className={`group flex flex-col items-center gap-1 rounded-lg py-2 transition-colors ${
                  !cell.inMonth ? "opacity-25 hover:opacity-40" : ""
                }`}
              >
                <span
                  className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-sm tabular-nums transition-all duration-200 ${
                    active
                      ? "bg-[var(--ink)] text-white font-medium"
                      : cell.isToday
                        ? "ring-1 ring-[var(--ink)] text-[var(--ink)] font-medium"
                        : "text-[var(--ink)] group-hover:bg-black/[0.04]"
                  }`}
                >
                  {cell.dayOfMonth}
                </span>
                <span className="flex h-1 items-center justify-center">
                  {cell.count > 0 ? (
                    <span
                      className={`h-1 w-1 rounded-full ${
                        active ? "bg-white/80" : "bg-[var(--faint)]"
                      }`}
                    />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full lg:w-[380px] xl:w-[420px] lg:shrink-0 rounded-xl bg-white p-6 ring-1 ring-[var(--line)]">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--line-soft)]">
          <div>
            <h2 className="text-sm font-medium tracking-tight text-[var(--ink)]">{selectedLabel}</h2>
            <p className="mt-0.5 text-xs text-[var(--faint)] tabular-nums">共 {selectedItems.length} 项</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenDay(selected)}
            className="text-xs font-normal text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            {selectedItems.length > 0 ? "按时刻查看 →" : "添加日程"}
          </button>
        </div>
        <div className="mt-4 space-y-2 max-h-[460px] overflow-y-auto soft-scroll pr-1">
          {selectedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg py-12 text-center text-[var(--faint)]">
              <p className="text-xs font-normal">这一天还没有安排</p>
              <button
                type="button"
                onClick={() => onOpenDay(selected)}
                className="mt-2 text-xs font-normal text-[var(--muted)] hover:text-[var(--ink)] hover:underline"
              >
                前往该日添加日程
              </button>
            </div>
          ) : (
            selectedItems.map((item) => <EventChip key={item.id} item={item} />)
          )}
        </div>
      </div>
    </div>
  );
};