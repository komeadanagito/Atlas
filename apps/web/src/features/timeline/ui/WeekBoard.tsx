import type { TimelineItem } from "@atlas/shared";
import { itemsOn, type WeekDay } from "../model";
import { EventChip } from "./EventChip";

type Props = {
  days: WeekDay[];
  items: TimelineItem[];
  selected: string;
  onSelect: (date: string) => void;
  onOpenDay: (date: string) => void;
};

export const WeekBoard = ({ days, items, selected, onSelect, onOpenDay }: Props) => (
  <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 soft-scroll pb-2">
    <div className="grid min-w-[48rem] grid-cols-7 gap-2 sm:min-w-0 lg:gap-3">
      {days.map((day) => {
        const active = day.date === selected;
        const dayItems = itemsOn(items, day.date);
        return (
          <section
            key={day.date}
            className={`flex min-w-0 flex-col justify-between rounded-xl p-4 min-h-[360px] sm:min-h-[420px] lg:min-h-[480px] transition-colors duration-200 ${
              active
                ? "bg-white ring-1 ring-[var(--ink)]/15"
                : "bg-white ring-1 ring-[var(--line)] hover:ring-[var(--faint)]/30"
            }`}
          >
            <div>
              <button type="button" onClick={() => onSelect(day.date)} className="w-full text-left">
                <p
                  className={`text-[10px] font-normal uppercase tracking-wider ${
                    active ? "text-[var(--ink)]" : day.isToday ? "text-[var(--ink)]" : "text-[var(--faint)]"
                  }`}
                >
                  {day.weekday}
                  {day.isToday ? " · 今天" : ""}
                </p>
                <p
                  className={`display mt-1.5 text-2xl font-semibold leading-none tabular-nums tracking-tight ${
                    active ? "text-[var(--ink)]" : "text-[var(--ink)]"
                  }`}
                >
                  {day.dayOfMonth}
                </p>
              </button>
              <div className="mt-3 space-y-1.5 max-h-[260px] sm:max-h-[320px] overflow-y-auto soft-scroll pr-0.5">
                {dayItems.length === 0 ? (
                  <div className="rounded-lg py-4 text-center text-[11px] text-[var(--faint)]">
                    无日程
                  </div>
                ) : (
                  dayItems.map((item) => <EventChip key={item.id} item={item} compact />)
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenDay(day.date)}
              className="mt-3 w-full rounded-lg py-2 text-center text-xs font-normal text-[var(--muted)] transition-colors hover:bg-black/[0.04] hover:text-[var(--ink)]"
            >
              {dayItems.length > 0 ? "看这一天" : "添加日程"}
            </button>
          </section>
        );
      })}
    </div>
  </div>
);