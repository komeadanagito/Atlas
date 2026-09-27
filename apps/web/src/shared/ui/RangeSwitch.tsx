import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

export const RANGES = [
  { id: "day", label: "日" },
  { id: "week", label: "周" },
  { id: "month", label: "月" },
] as const;

export type TimeRange = (typeof RANGES)[number]["id"];

type Props = {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
};

type PillBox = { x: number; width: number };

const PILL_TRANSITION =
  "transform 0.28s cubic-bezier(0.34, 1.3, 0.4, 1), width 0.28s cubic-bezier(0.34, 1.3, 0.4, 1)";

export const RangeSwitch = ({ value, onChange }: Props) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState<PillBox | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const index = RANGES.findIndex((item) => item.id === value);
    const target = index >= 0 ? buttons.current[index] : null;
    if (!root || !target) return;
    const rootBox = root.getBoundingClientRect();
    const box = target.getBoundingClientRect();
    setPill({ x: box.left - rootBox.left, width: box.width });
  }, [value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number;
    switch (event.key) {
      case "ArrowRight":
        next = (index + 1) % RANGES.length;
        break;
      case "ArrowLeft":
        next = (index + RANGES.length - 1) % RANGES.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = RANGES.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    buttons.current[next]?.focus();
    onChange(RANGES[next].id);
  };

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label="时间范围"
      className="relative inline-flex h-8 items-center rounded-full bg-black/[0.04] p-0.5"
    >
      {pill ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0.5 bottom-0.5 rounded-full bg-white shadow-[var(--shadow-xs)]"
          style={{
            transform: `translateX(${pill.x}px)`,
            width: pill.width,
            transition: PILL_TRANSITION,
            willChange: "transform, width",
          }}
        />
      ) : null}
      {RANGES.map((item, index) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            ref={(node) => { buttons.current[index] = node; }}
            type="button"
            aria-label={`${item.label}视图`}
            aria-pressed={active}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`relative z-10 min-h-7 rounded-full px-3 text-xs leading-none transition-colors duration-300 ${
              active
                ? "font-semibold text-[var(--ink)]"
                : "text-[var(--muted)] hover:text-[var(--ink)] font-normal"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};