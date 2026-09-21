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

export const RangeSwitch = ({ value, onChange }: Props) => (
  <div className="inline-flex rounded-full bg-[var(--wash)] p-0.5">
    {RANGES.map((item) => {
      const active = item.id === value;
      return (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`min-w-7 rounded-full px-2.5 py-1 text-[11px] ${
            active
              ? "bg-white text-[var(--accent)] shadow-[0_1px_3px_rgba(36,48,68,.08)]"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          {item.label}
        </button>
      );
    })}
  </div>
);