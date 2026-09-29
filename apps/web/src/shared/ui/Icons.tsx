import type { ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CalendarFold,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  Dumbbell,
  Eye,
  EyeOff,
  LibraryBig,
  LocateFixed,
  LockKeyhole,
  LogOut,
  Minus,
  NotebookPen,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash,
  UserRound,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { KitModuleId } from "../../app/routes";

type IconProps = {
  className?: string;
};

// One stroke weight for the whole app; absoluteStrokeWidth keeps lines equally fine at every size.
const STROKE = 1.5;

const wrapIcon = (Glyph: LucideIcon) =>
  function AtlasIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
    return (
      <Glyph
        className={className}
        strokeWidth={STROKE}
        absoluteStrokeWidth
        aria-hidden="true"
        focusable="false"
      />
    );
  };

export const IconToday = wrapIcon(CalendarFold);
export const IconCalendar = wrapIcon(CalendarDays);
export const IconNow = wrapIcon(Clock);
export const IconBackToNow = wrapIcon(LocateFixed);
export const IconUndo = wrapIcon(RotateCcw);
export const IconCaretDown = wrapIcon(ChevronDown);
export const IconPrev = wrapIcon(ChevronLeft);
export const IconNext = wrapIcon(ChevronRight);
export const IconFitness = wrapIcon(Dumbbell);
export const IconLearning = wrapIcon(BookOpen);
export const IconDaily = wrapIcon(NotebookPen);
export const IconKnowledge = wrapIcon(LibraryBig);
export const IconClose = wrapIcon(X);
export const IconTrash = wrapIcon(Trash);
export const IconUser = wrapIcon(UserRound);
export const IconLock = wrapIcon(LockKeyhole);
export const IconEye = wrapIcon(Eye);
export const IconEyeSlash = wrapIcon(EyeOff);
export const IconSparkle = wrapIcon(Sparkles);
export const IconShieldCheck = wrapIcon(ShieldCheck);
export const IconCheckCircle = wrapIcon(CircleCheck);
export const IconLightning = wrapIcon(Zap);
export const IconArrowRight = wrapIcon(ArrowRight);
export const IconSignOut = wrapIcon(LogOut);
export const IconPlus = wrapIcon(Plus);
export const IconMinus = wrapIcon(Minus);

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
  disabled?: boolean;
  children: ReactNode;
};

export const IconButton = ({ label, onClick, active, disabled, children }: ButtonProps) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    disabled={disabled}
    className={`flex h-8 w-8 items-center justify-center rounded-full transition-[color,background-color,opacity,transform] duration-200 active:scale-90 disabled:pointer-events-none disabled:opacity-30 ${
      active
        ? "bg-black/[0.06] text-[var(--ink)]"
        : "text-[var(--muted)] hover:bg-black/[0.04] hover:text-[var(--ink)]"
    }`}
  >
    {children}
  </button>
);