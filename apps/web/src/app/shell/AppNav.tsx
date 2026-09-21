import { NAV, type SectionId } from "../routes";
import logo from "../../assets/atlas-logo.png";

type Props = {
  active: string;
  onChange: (id: SectionId) => void;
};

export const AppNav = ({ active, onChange }: Props) => (
  <header className="shrink-0 border-b border-[var(--line)] bg-white/90 backdrop-blur-md">
    <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
      <button onClick={() => onChange("timeline")} className="flex items-center opacity-90 hover:opacity-100">
        <img src={logo} alt="Atlas" className="h-7 w-auto select-none" />
      </button>
      <nav className="flex items-center gap-6 text-[13px] text-[var(--muted)]">
        {NAV.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`relative shrink-0 pb-0.5 ${
                selected ? "text-[var(--accent)]" : "hover:text-[var(--ink)]"
              }`}
            >
              {item.label}
              <span
                className={`absolute inset-x-0 -bottom-px h-px origin-center bg-[var(--accent)] transition-transform duration-300 ease-[var(--ease)] ${
                  selected ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </button>
          );
        })}
      </nav>
    </div>
  </header>
);