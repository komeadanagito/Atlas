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
    <main className="rise max-w-2xl" data-kit={id}>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-200/50 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all"
      >
        <IconPrev className="h-3.5 w-3.5" />
        返回百宝箱
      </button>
      <div className="mt-6 rounded-3xl bg-white p-6 sm:p-10 shadow-xs">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--kit-soft)] text-[var(--kit-color)]">
            <Icon className="h-7 w-7" />
          </span>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {meta?.label ?? id}
              </h1>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                独立模块
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">领域专享功能，独立运作</p>
          </div>
        </div>
        <p className="mt-6 pt-6 text-sm leading-7 text-slate-500">
          此功能正在单独规划与构建中，和核心时间轴数据保持解耦与独立。稍后将推出专属记录、统计与追踪看板。
        </p>
      </div>
    </main>
  );
};