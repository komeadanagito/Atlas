import type { TimelineItem } from "@atlas/shared";
import { parseDateKey, weekdayOf, WEEKDAY_LABELS, type MonthCell } from "../model";
import { EventChip } from "./EventChip";
import { IconArrowRight, IconPlus } from "../../../shared/ui/Icons";

type Props = {
  cells: MonthCell[];
  selected: string;
  selectedItems: TimelineItem[];
  onSelect: (date: string) => void;
  onOpenDay: (date: string) => void;
};

export const MonthBoard = ({ cells, selected, selectedItems, onSelect, onOpenDay }: Props) => {
  const date = parseDateKey(selected);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <div className="flex-1 rounded-2xl bg-white p-5 sm:p-7 ring-1 ring-[var(--line)]">
        <div className="mb-2 grid grid-cols-7 border-b border-[var(--line-soft)] pb-3 text-center text-[11px] tracking-wide text-[var(--faint)]">
          {WEEKDAY_LABELS.map((label, index) => (
            <span key={label} className={index >= 5 ? "text-[var(--faint)]/70" : ""}>周{label}</span>
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
                  className={`numeral flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-lg sm:text-xl leading-none transition-colors duration-200 ${
                    active
                      ? "bg-[var(--ink)] text-white font-semibold"
                      : cell.isToday
                        ? "ring-1 ring-[var(--ink)] text-[var(--ink)] font-semibold"
                        : "font-medium text-[var(--ink)]/85 group-hover:bg-black/[0.04]"
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

      <div className="w-full lg:w-[380px] xl:w-[420px] lg:shrink-0 rounded-2xl bg-white p-6 ring-1 ring-[var(--line)]">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--line-soft)]">
          <div>
            <h2 className="flex items-baseline gap-2 text-[var(--ink)]">
              <span className="numeral text-[2rem] font-semibold leading-[0.85]">{date.getDate()}</span>
              <span className="text-xs text-[var(--muted)]">
                {date.getMonth() + 1}月 · {weekdayOf(selected)}
              </span>
            </h2>
            <p className="mt-1.5 text-xs text-[var(--faint)] tabular-nums">共 {selectedItems.length} 项</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenDay(selected)}
            aria-label={selectedItems.length > 0 ? "按时刻查看" : "添加日程"}
            title={selectedItems.length > 0 ? "按时刻查看" : "添加日程"}
            className="group flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition-[background-color,color,transform] hover:bg-black/[0.04] hover:text-[var(--ink)] active:scale-90"
          >
            {selectedItems.length > 0 ? (
              <IconArrowRight className="h-4 w-4 transition-transform duration-200 ease-[var(--ease)] group-hover:translate-x-0.5" />
            ) : (
              <IconPlus className="h-4 w-4 transition-transform duration-300 ease-[var(--ease)] group-hover:rotate-90" />
            )}
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