import type { ReactNode } from "react";
import type { KitModuleId } from "../../app/routes";

type IconProps = {
  className?: string;
};

const Svg = ({ className = "h-[18px] w-[18px]", children }: IconProps & { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-hidden
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

export const IconToday = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="4" y="5.5" width="16" height="14.5" rx="3" />
    <path d="M4 9.5h16" />
    <path d="M8 3.8v3.2M16 3.8v3.2" />
    <rect x="10.2" y="12.6" width="3.6" height="3.6" rx="0.9" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconNow = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 7.2v5.1l3.4 1.9" />
    <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
    <path d="M12 4.6v1.3M19.4 12h-1.3M12 19.4v-1.3M5.9 12H4.6" strokeWidth="1.4" />
  </Svg>
);

export const IconBackToNow = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M7.2 6.4A7.2 7.2 0 1 1 5.2 12" />
    <path d="M7.4 3.6v3.4H10.8" />
    <path d="M12 9v3.2l2.4 1.3" />
  </Svg>
);

export const IconPrev = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M14.2 5.5 8.8 12l5.4 6.5" />
  </Svg>
);

export const IconNext = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M9.8 5.5 15.2 12l-5.4 6.5" />
  </Svg>
);

export const IconFitness = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M7.2 10.2v3.6M16.8 10.2v3.6" />
    <path d="M5 9.2v5.6M19 9.2v5.6" />
    <path d="M7.2 12h9.6" />
    <rect x="3.4" y="8.4" width="2.4" height="7.2" rx="1.1" />
    <rect x="18.2" y="8.4" width="2.4" height="7.2" rx="1.1" />
  </Svg>
);

export const IconLearning = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M5 7.2c3.2-1.6 5.4-.4 7 .8 1.6-1.2 3.8-2.4 7-.8v10.2c-3.2-1.6-5.4-.4-7 .8-1.6-1.2-3.8-2.4-7-.8V7.2Z" />
    <path d="M12 8.2v10" />
  </Svg>
);

export const IconDaily = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M7.5 4.8h7.2L19 9.2v10a1.8 1.8 0 0 1-1.8 1.8H7.5A1.8 1.8 0 0 1 5.7 19.2V6.6a1.8 1.8 0 0 1 1.8-1.8Z" />
    <path d="M14.6 4.8V9h4.3" />
    <path d="M8.6 13h6.8M8.6 16.4h4.6" />
  </Svg>
);

export const IconKnowledge = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M7.4 18.6 12 16.4l4.6 2.2V6.8L12 4.8 7.4 6.8v11.8Z" />
    <path d="M12 4.8v11.6" />
    <path d="M7.4 10.2h9.2" />
  </Svg>
);

export const KIND_ICON: Record<KitModuleId, (props: IconProps) => ReactNode> = {
  fitness: IconFitness,
  learning: IconLearning,
  daily: IconDaily,
  knowledge: IconKnowledge,
};

type ButtonProps = {
  label: string;
  onClick?: () => void;
  active?: boolean;
  children: ReactNode;
};

export const IconButton = ({ label, onClick, active, children }: ButtonProps) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className={`flex h-8 w-8 items-center justify-center rounded-full duration-200 ${
      active
        ? "bg-[var(--accent-soft)] text-[var(--accent)]"
        : "text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
    }`}
  >
    {children}
  </button>
);