import type { WeekDay } from "../model";

type Props = {
  days: WeekDay[];
  selected: string;
  onSelect: (date: string) => void;
};

export const WeekStrip = ({ days, selected, onSelect }: Props) => (
  <div className="flex justify-between">
    {days.map((day, index) => {
      const active = day.date === selected;
      const center = index === Math.floor(days.length / 2);
      return (
        <button
          key={day.date}
          onClick={() => onSelect(day.date)}
          className="flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5"
        >
          <span
            className={`text-[10px] duration-200 ${
              active || center ? "text-[var(--accent)]" : "text-[var(--faint)]"
            }`}
          >
            {day.isToday ? "今" : day.weekday}
          </span>
          <span
            className={`display flex h-8 w-8 items-center justify-center rounded-full text-[13px] duration-300 ${
              active
                ? "bg-[var(--accent)] text-white shadow-[0_6px_14px_-8px_rgba(77,132,184,.9)]"
                : day.isToday
                  ? "ring-1 ring-[var(--accent)]"
                  : "hover:bg-[var(--wash)]"
            }`}
          >
            {day.dayOfMonth}
          </span>
          <span
            className={`h-0.5 w-0.5 rounded-full duration-200 ${
              day.hasEvents ? "bg-[var(--accent)]" : "bg-transparent"
            }`}
          />
        </button>
      );
    })}
  </div>
);