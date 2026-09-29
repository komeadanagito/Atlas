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

// Smooth deceleration, no overshoot: the pill glides instead of bouncing.
const PILL_TRANSITION =
  "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), width 0.5s cubic-bezier(0.22, 1, 0.36, 1)";

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
    // offset* ignores transforms and matches the pill's own coordinate space inside the nav.
    const measure = () => setPill({ x: target.offsetLeft, width: target.offsetWidth });
    measure();
    // Re-measure when web fonts finish loading or the nav changes size, so the pill never drifts.
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(target);
    return () => observer.disconnect();
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
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-3 xl:max-w-7xl 2xl:max-w-[1440px] sm:gap-4 sm:px-8 xl:px-12">
        <button
          type="button"
          onClick={() => onChange("timeline")}
          className="flex shrink-0 items-center transition-opacity hover:opacity-60"
        >
          <img src={logo} alt="Atlas" className="h-6 w-auto select-none" />
        </button>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {user ? (
            <nav
              ref={navRef}
              aria-label="主导航"
              className="relative flex shrink-0 items-center rounded-full bg-black/[0.04] p-0.5 text-xs font-medium"
            >
              {pill ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0.5 bottom-0.5 rounded-full bg-white shadow-[var(--shadow-xs)]"
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
                    className={`relative z-10 flex h-7 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 transition-colors duration-300 sm:px-3.5 ${
                      selected
                        ? "text-[var(--ink)]"
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
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={() => onChange("profile")}
                className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium transition-colors sm:gap-1.5 sm:px-3 ${
                  active === "profile"
                    ? "bg-[var(--ink)] text-white"
                    : "text-[var(--ink)] hover:bg-black/[0.04]"
                }`}
                title={`查看个人主页：${user.username}`}
              >
                <IconUser className={`h-3.5 w-3.5 shrink-0 ${active === "profile" ? "text-white/70" : "text-[var(--muted)]"}`} />
                <span className="max-w-[60px] truncate whitespace-nowrap sm:max-w-[120px]">{user.username}</span>
              </button>
              <button
                type="button"
                aria-label="退出登录"
                onClick={() => { void signOut(); }}
                disabled={signingOut}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--faint)] transition-colors hover:bg-black/[0.04] hover:text-[var(--ink)]"
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