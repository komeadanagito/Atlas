import { KIT_MODULES, type KitModuleId } from "../../app/routes";
import { KIND_ICON } from "../../shared/ui/Icons";

type Props = {
  onOpen: (id: KitModuleId) => void;
};

export const KitHub = ({ onOpen }: Props) => (
  <main className="rise">
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {KIT_MODULES.map((item) => {
        const Icon = KIND_ICON[item.id];
        return (
          <li key={item.id}>
            <button
              onClick={() => onOpen(item.id)}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-[var(--line)] px-4 py-4 text-left hover:-translate-y-0.5 hover:border-[var(--accent)]/30 hover:bg-[var(--accent-soft)] hover:shadow-[var(--shadow)]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-[15px] font-medium">{item.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  </main>
);