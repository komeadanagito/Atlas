import { useLayoutEffect, useRef, useState } from "react";
import type { WeekDay } from "../model";

type Props = {
  days: WeekDay[];
  selected: string;
  onSelect: (date: string) => void;
};

type PillBox = { x: number; y: number; width: number; height: number };

export const WeekStrip = ({ days, selected, onSelect }: Props) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const [pill, setPill] = useState<PillBox | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const target = buttonRefs.current.get(selected);
    if (!root || !target) return;
    const measure = () => {
      const rootBox = root.getBoundingClientRect();
      const box = target.getBoundingClientRect();
      setPill({
        x: box.left - rootBox.left,
        y: box.top - rootBox.top,
        width: box.width,
        height: box.height,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(target);
    return () => observer.disconnect();
  }, [selected, days]);

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label="选择日期"
      className="relative grid grid-cols-7 gap-0.5"
    >
      {pill ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute z-0 rounded-xl bg-[var(--ink)]"
          style={{
            transform: `translate(${pill.x}px, ${pill.y}px)`,
            width: pill.width,
            height: pill.height,
            transition:
              "transform 0.45s var(--ease), width 0.45s var(--ease)",
            willChange: "transform, width",
          }}
        />
      ) : null}

      {days.map((day) => {
        const active = day.date === selected;
        return (
          <button
            key={day.date}
            ref={(node) => {
              if (node) buttonRefs.current.set(day.date, node);
              else buttonRefs.current.delete(day.date);
            }}
            type="button"
            aria-pressed={active}
            aria-current={day.isToday ? "date" : undefined}
            aria-label={`${day.date} ${day.weekday}${day.isToday ? "，今天" : ""}${day.hasEvents ? "，有日程" : ""}`}
            onClick={() => onSelect(day.date)}
            className={`group relative z-10 flex min-w-0 flex-col items-center gap-1 rounded-xl py-2.5 transition-colors duration-300 ${
              active ? "text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            <span
              className={`text-[10px] font-normal transition-colors duration-300 ${
                active
                  ? "text-white/60"
                  : day.isToday
                    ? "text-[var(--ink)]"
                    : "text-[var(--faint)]"
              }`}
            >
              {day.isToday ? "今" : day.weekday}
            </span>
            <span
              className={`numeral text-[1.375rem] sm:text-2xl leading-none transition-colors duration-300 ${
                active
                  ? "font-semibold text-white"
                  : day.isToday
                    ? "font-semibold text-[var(--ink)]"
                    : "font-medium text-[var(--ink)]/85"
              }`}
            >
              {day.dayOfMonth}
            </span>
            <span
              className={`h-1 w-1 rounded-full transition-colors duration-300 ${
                day.hasEvents
                  ? active
                    ? "bg-white/80"
                    : "bg-[var(--faint)]"
                  : "bg-transparent"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};