import { KIT_MODULES, type KitModuleId } from "../../app/routes";
import { IconPrev, KIND_ICON } from "../../shared/ui/Icons";

type Props = {
  id: KitModuleId;
  onBack: () => void;
};

export const Placeholder = ({ id, onBack }: Props) => {
  const meta = KIT_MODULES.find((item) => item.id === id);
  const Icon = KIND_ICON[id];
  return (
    <main className="rise">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        <IconPrev className="h-4 w-4" />
        百宝箱
      </button>
      <div className="mt-8 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <Icon className="h-5 w-5" />
        </span>
        <h1 className="display text-3xl">{meta?.label ?? id}</h1>
      </div>
      <p className="mt-3 max-w-md text-sm leading-7 text-[var(--muted)]">
        独立功能，稍后单独做。和时间轴没有数据关系。
      </p>
    </main>
  );
};