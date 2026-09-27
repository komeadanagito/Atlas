import type { ReactNode } from "react";
import {
  ArrowCounterClockwise,
  BookOpen,
  Books,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  Clock,
  Barbell,
  CheckCircle,
  Eye,
  EyeSlash,
  Lightning,
  LockKey,
  Minus,
  Note,
  Plus,
  ShieldCheck,
  SignOut,
  Sparkle,
  Trash,
  User,
  X,
  ArrowRight,
  type Icon,
} from "@phosphor-icons/react";
import type { KitModuleId } from "../../app/routes";

type IconProps = {
  className?: string;
};

const wrapIcon = (Glyph: Icon) =>
  function AtlasIcon({ className = "h-[18px] w-[18px]" }: IconProps) {
    return <Glyph className={className} weight="regular" aria-hidden="true" focusable="false" />;
  };

export const IconToday = wrapIcon(CalendarBlank);
export const IconNow = wrapIcon(Clock);
export const IconBackToNow = wrapIcon(ArrowCounterClockwise);
export const IconPrev = wrapIcon(CaretLeft);
export const IconNext = wrapIcon(CaretRight);
export const IconFitness = wrapIcon(Barbell);
export const IconLearning = wrapIcon(BookOpen);
export const IconDaily = wrapIcon(Note);
export const IconKnowledge = wrapIcon(Books);
export const IconClose = wrapIcon(X);
export const IconTrash = wrapIcon(Trash);
export const IconUser = wrapIcon(User);
export const IconLock = wrapIcon(LockKey);
export const IconEye = wrapIcon(Eye);
export const IconEyeSlash = wrapIcon(EyeSlash);
export const IconSparkle = wrapIcon(Sparkle);
export const IconShieldCheck = wrapIcon(ShieldCheck);
export const IconCheckCircle = wrapIcon(CheckCircle);
export const IconLightning = wrapIcon(Lightning);
export const IconArrowRight = wrapIcon(ArrowRight);
export const IconSignOut = wrapIcon(SignOut);
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
  children: ReactNode;
};

export const IconButton = ({ label, onClick, active, children }: ButtonProps) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 ${
      active
        ? "bg-black/[0.06] text-[var(--ink)]"
        : "text-[var(--muted)] hover:bg-black/[0.04] hover:text-[var(--ink)]"
    }`}
  >
    {children}
  </button>
);
