import type { CSSProperties, PointerEvent } from "react";
import { KIT_MODULES, type KitModuleId } from "../../app/routes";
import { IconArrowRight, KIND_ICON } from "../../shared/ui/Icons";

type Props = {
  onOpen: (id: KitModuleId) => void;
};

const pad = (n: number) => String(n).padStart(2, "0");

// Writes the pointer position straight to CSS vars so the spotlight follows without re-rendering.
const trackPointer = (event: PointerEvent<HTMLButtonElement>) => {
  if (event.pointerType !== "mouse") return;
  const el = event.currentTarget;
  const box = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${event.clientX - box.left}px`);
  el.style.setProperty("--my", `${event.clientY - box.top}px`);
};

export const KitHub = ({ onOpen }: Props) => (
  <main aria-label="百宝箱" className="max-w-5xl pb-6">
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {KIT_MODULES.map((item, index) => {
        const Icon = KIND_ICON[item.id];
        return (
          <li key={item.id} data-kit={item.id} className="kit-enter" style={{ "--i": index } as CSSProperties}>
            <button
              type="button"
              onClick={() => onOpen(item.id)}
              onPointerMove={trackPointer}
              className="kit-tile group flex h-36 w-full flex-col justify-between rounded-2xl bg-white p-5 text-left ring-1 ring-[var(--line)] transition-[box-shadow,transform] duration-300 ease-[var(--ease)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] active:translate-y-0 active:scale-[0.99] sm:h-40"
            >
              <span className="flex items-start justify-between">
                {/* Monochrome by default; the module color only appears on hover. */}
                <span className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--ink)]/80 ring-1 ring-[var(--line)] transition-[color,transform,box-shadow] duration-500 ease-[var(--ease)] group-hover:-rotate-6 group-hover:scale-110 group-hover:text-[var(--kit-color)] group-hover:ring-[var(--kit-color)]/25">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="numeral text-sm text-[var(--faint)]/70">{pad(index + 1)}</span>
              </span>

              <span className="flex items-end justify-between">
                <span className="text-[15px] font-medium tracking-wide text-[var(--ink)] transition-transform duration-300 ease-[var(--ease)] group-hover:translate-x-0.5">
                  {item.label}
                </span>
                <IconArrowRight className="h-4 w-4 -translate-x-2 text-[var(--kit-color)] opacity-0 transition-[opacity,transform] duration-300 ease-[var(--ease)] group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  </main>
);