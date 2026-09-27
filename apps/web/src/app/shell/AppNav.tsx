import { useLayoutEffect, useRef, useState } from "react";
import { NAV, type SectionId } from "../routes";
import logo from "../../assets/atlas-logo.png";
import { useAuth } from "../../features/auth/AuthContext";
import { IconSignOut, IconUser } from "../../shared/ui/Icons";

type Props = {
  active: string;
  onChange: (id: SectionId) => void;
};

type PillBox = { x: number; width: number };

const PILL_TRANSITION =
  "transform 0.3s cubic-bezier(0.34, 1.4, 0.4, 1), width 0.3s cubic-bezier(0.34, 1.4, 0.4, 1)";

export const AppNav = ({ active, onChange }: Props) => {
  const { user, loading, logout } = useAuth();
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const navItemRefs = useRef(new Map<string, HTMLButtonElement>());
  const [pill, setPill] = useState<PillBox | null>(null);

  useLayoutEffect(() => {
    const root = navRef.current;
    const target = navItemRefs.current.get(active);
    if (!root || !target) {
      setPill(null);
      return;
    }
    const rootBox = root.getBoundingClientRect();
    const box = target.getBoundingClientRect();
    setPill({ x: box.left - rootBox.left, width: box.width });
  }, [active, user]);

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true); setError("");
    try { await logout(); }
    catch { setError("退出失败，请检查连接后重试"); }
    finally { setSigningOut(false); }
  };

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-[var(--line-soft)] bg-[var(--wash)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl xl:max-w-7xl 2xl:max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8 xl:px-12">
        <button
          type="button"
          onClick={() => onChange("timeline")}
          className="flex items-center transition-opacity hover:opacity-60"
        >
          <img src={logo} alt="Atlas" className="h-6 w-auto select-none" />
        </button>

        <div className="flex items-center gap-2">
          {user ? (
            <nav
              ref={navRef}
              aria-label="主导航"
              className="relative flex items-center rounded-full bg-black/[0.04] p-0.5 text-xs font-medium"
            >
              {pill ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0.5 bottom-0.5 rounded-full bg-white shadow-[var(--shadow-xs)]"
                  style={{
                    transform: `translateX(${pill.x}px)`,
                    width: pill.width,
                    transition: PILL_TRANSITION,
                    willChange: "transform, width",
                  }}
                />
              ) : null}
              {NAV.map((item) => {
                const selected = item.id === active;
                return (
                  <button
                    key={item.id}
                    ref={(node) => {
                      if (node) navItemRefs.current.set(item.id, node);
                      else navItemRefs.current.delete(item.id);
                    }}
                    type="button"
                    aria-current={selected ? "page" : undefined}
                    onClick={() => onChange(item.id)}
                    className={`relative z-10 flex h-7 items-center rounded-full px-3.5 transition-colors duration-300 ${
                      selected
                        ? "text-[var(--ink)] font-semibold"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          ) : null}

          {loading ? null : user ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChange("profile")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  active === "profile"
                    ? "bg-[var(--ink)] text-white"
                    : "text-[var(--ink)] hover:bg-black/[0.04]"
                }`}
                title={`查看个人主页：${user.username}`}
              >
                <IconUser className={`h-3.5 w-3.5 ${active === "profile" ? "text-white/70" : "text-[var(--muted)]"}`} />
                <span className="max-w-[80px] sm:max-w-[120px] truncate">{user.username}</span>
              </button>
              <button
                type="button"
                aria-label="退出登录"
                onClick={() => { void signOut(); }}
                disabled={signingOut}
                className="flex size-8 items-center justify-center rounded-full text-[var(--faint)] transition-colors hover:bg-black/[0.04] hover:text-[var(--ink)]"
                title="退出登录"
              >
                <IconSignOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {error && <p role="alert" className="px-4 py-2 text-sm text-rose-700">{error}</p>}
    </header>
  );
};