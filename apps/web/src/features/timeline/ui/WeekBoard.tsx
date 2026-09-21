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
  <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
    <div className="grid min-w-[44rem] grid-cols-7 gap-2 sm:min-w-0">
      {days.map((day) => {
        const active = day.date === selected;
        const dayItems = itemsOn(items, day.date);
        return (
          <section
            key={day.date}
            className={`min-w-0 rounded-2xl border px-2 py-3 duration-200 ${
              active ? "border-[var(--accent)] bg-[var(--accent-soft)]/50 shadow-[var(--shadow)]" : "border-[var(--line)] hover:border-[var(--accent)]/35"
            }`}
          >
            <button onClick={() => onSelect(day.date)} className="w-full text-left">
              <p className="text-[11px] text-[var(--faint)]">{day.weekday}</p>
              <p className="display mt-0.5 text-2xl leading-none">{day.dayOfMonth}</p>
            </button>
            <div className="mt-3 space-y-1.5">
              {dayItems.length === 0 ? (
                <p className="px-0.5 text-[11px] text-[var(--faint)]">无</p>
              ) : (
                dayItems.map((item) => <EventChip key={item.id} item={item} compact />)
              )}
            </div>
            {dayItems.length > 0 ? (
              <button
                onClick={() => onOpenDay(day.date)}
                className="mt-3 text-[11px] text-[var(--muted)] hover:text-[var(--ink)]"
              >
                看这一天
              </button>
            ) : null}
          </section>
        );
      })}
    </div>
  </div>
);