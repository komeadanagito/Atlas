import type { TimelineItem } from "@atlas/shared";
import { itemsOn, type WeekDay } from "../model";
import { EventChip } from "./EventChip";
import { IconArrowRight, IconPlus } from "../../../shared/ui/Icons";

type Props = {
  days: WeekDay[];
  items: TimelineItem[];
  selected: string;
  onSelect: (date: string) => void;
  onOpenDay: (date: string) => void;
};

const monthOf = (dateKey: string) => Number(dateKey.slice(5, 7));
const isWeekend = (index: number) => index >= 5;

// Revealed on column hover for pointer devices; always visible on touch.
const REVEAL =
  "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/col:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100";

export const WeekBoard = ({ days, items, selected, onSelect, onOpenDay }: Props) => (
  <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 soft-scroll pb-2">
    <div className="grid min-w-[48rem] grid-cols-7 divide-x divide-[var(--line-soft)] overflow-hidden rounded-2xl border border-[var(--line)] bg-white sm:min-w-0">
      {days.map((day, index) => {
        const active = day.date === selected;
        const dayItems = itemsOn(items, day.date);
        const hasItems = dayItems.length > 0;
        const action = hasItems ? "看这一天" : "添加日程";
        return (
          <section
            key={day.date}
            aria-label={`${day.date} 周${day.weekday}${day.isToday ? "，今天" : ""}`}
            className={`group/col relative flex min-w-0 flex-col min-h-[360px] sm:min-h-[420px] lg:min-h-[480px] transition-colors duration-300 ${
              active ? "bg-[var(--wash)]" : "hover:bg-black/[0.012]"
            }`}
          >
            {/* Hairline marker for the selected column; grows from center. */}
            <span
              aria-hidden="true"
              className={`absolute inset-x-4 top-0 h-[2px] rounded-b-full bg-[var(--ink)] transition-transform duration-300 ease-[var(--ease)] ${
                active ? "scale-x-100" : "scale-x-0"
              }`}
            />

            <button
              type="button"
              onClick={() => onSelect(day.date)}
              aria-pressed={active}
              className="flex flex-col gap-2 px-4 pt-4 pb-3 text-left"
            >
              <span className="flex h-4 items-center justify-between">
                <span
                  className={`text-[11px] tracking-wide ${
                    day.isToday
                      ? "font-medium text-[var(--ink)]"
                      : isWeekend(index)
                        ? "text-[var(--faint)]/70"
                        : "text-[var(--faint)]"
                  }`}
                >
                  周{day.weekday}
                </span>
                {day.isToday ? (
                  <span className="rounded-full bg-[var(--ink)] px-1.5 py-px text-[10px] leading-4 text-white">今天</span>
                ) : null}
              </span>
              <span className="flex items-baseline gap-1.5">
                <span
                  className={`numeral text-[2.5rem] leading-[0.85] ${
                    day.isToday ? "font-semibold text-[var(--ink)]" : "font-medium text-[var(--ink)]/85"
                  }`}
                >
                  {day.dayOfMonth}
                </span>
                {day.dayOfMonth === 1 ? (
                  <span className="text-[11px] text-[var(--muted)] tabular-nums">{monthOf(day.date)}月</span>
                ) : null}
              </span>
            </button>

            <div className="mx-4 h-px bg-[var(--line-soft)]" />

            <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto soft-scroll px-3 pt-3">
              {dayItems.map((item) => (
                <EventChip key={item.id} item={item} compact />
              ))}
            </div>

            <div className="flex justify-center px-3 pt-2 pb-3">
              <button
                type="button"
                onClick={() => onOpenDay(day.date)}
                aria-label={action}
                title={action}
                className={`group/act inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] text-[var(--muted)] transition-[opacity,color,background-color] duration-200 hover:bg-black/[0.04] hover:text-[var(--ink)] ${REVEAL}`}
              >
                {hasItems ? (
                  <>
                    <span>查看</span>
                    <IconArrowRight className="h-3 w-3 transition-transform duration-200 ease-[var(--ease)] group-hover/act:translate-x-0.5" />
                  </>
                ) : (
                  <>
                    <IconPlus className="h-3 w-3 transition-transform duration-300 ease-[var(--ease)] group-hover/act:rotate-90" />
                    <span>添加</span>
                  </>
                )}
              </button>
            </div>
          </section>
        );
      })}
    </div>
  </div>
);