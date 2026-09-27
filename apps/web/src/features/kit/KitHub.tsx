import { KIT_MODULES, type KitModuleId } from "../../app/routes";
import { KIND_ICON } from "../../shared/ui/Icons";

type Props = {
  onOpen: (id: KitModuleId) => void;
};

const KIT_DESCRIPTIONS: Record<KitModuleId, string> = {
  fitness: "运动打卡与训练计划",
  learning: "专注学习与知识输入",
  daily: "生活随手记与日常备忘",
  knowledge: "结构化知识沉淀与分类",
};

export const KitHub = ({ onOpen }: Props) => (
  <main className="rise max-w-5xl">
    <div className="mb-6">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">百宝箱</h1>
      <p className="mt-1 text-xs sm:text-sm text-slate-500">各领域专属独立模块，自由拓展日程之外的个人管理系统</p>
    </div>
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {KIT_MODULES.map((item) => {
        const Icon = KIND_ICON[item.id];
        const desc = KIT_DESCRIPTIONS[item.id];
        return (
          <li key={item.id} data-kit={item.id}>
            <button
              type="button"
              onClick={() => onOpen(item.id)}
              className="group flex h-full w-full flex-col justify-between rounded-3xl bg-white p-6 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--kit-soft)] text-[var(--kit-color)] transition-transform duration-200 group-hover:scale-105">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-slate-600 transition-colors">
                    →
                  </span>
                </div>
                <h2 className="mt-5 text-base font-semibold text-slate-900">{item.label}</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
              </div>
              <div className="mt-5 flex items-center justify-between text-[11px] font-medium text-[var(--kit-color)]">
                <span>进入模块</span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  </main>
);