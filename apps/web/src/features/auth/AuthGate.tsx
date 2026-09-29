import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import "@fontsource/pinyon-script/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import {
  ArrowRight,
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  UserRound,
  type LucideIcon as Icon,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import logo from "../../assets/atlas-logo.png";

type Mode = "login" | "register";

const COPY = {
  login: {
    tab: "登录",
    motto: "Bon retour — le temps vous attend.",
    submit: "立即登录",
    pending: "正在登录…",
    switchHint: "还没有账户？",
    switchAction: "免费注册",
  },
  register: {
    tab: "注册",
    motto: "Chaque heure mérite son histoire.",
    submit: "创建账户",
    pending: "正在创建账户…",
    switchHint: "已有账户？",
    switchAction: "直接登录",
  },
} as const satisfies Record<Mode, Record<string, string>>;

const MODES: readonly Mode[] = ["login", "register"];

const Glyph = ({ as: G, className = "h-[18px] w-[18px]" }: { as: Icon; className?: string }) => (
  <G className={className} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" focusable="false" />
);

/** Staggered page entrance delay for `.auth-enter`; `step` orders the reveal. */
const enter = (step: number) => ({ "--d": `${80 + step * 70}ms` }) as CSSProperties;

const SWAP_BASE = "col-start-1 row-start-1 transition-[opacity,transform,filter] duration-[420ms] ease-[var(--ease)]";
const SWAP_ON = "opacity-100 translate-y-0 blur-[0px]";
const SWAP_OFF = "pointer-events-none opacity-0 translate-y-1.5 blur-[3px]";

/**
 * Renders both modes in one grid cell so the slot always takes the height of the larger view:
 * switching tabs cross-fades content without resizing the layout.
 */
const Swap = ({ mode, render, className = "" }: { mode: Mode; render: (m: Mode) => ReactNode; className?: string }) => (
  <div className={`grid ${className}`}>
    {MODES.map((m) => (
      <div
        key={m}
        aria-hidden={m !== mode}
        inert={m !== mode}
        className={`${SWAP_BASE} ${m === mode ? SWAP_ON : SWAP_OFF}`}
      >
        {render(m)}
      </div>
    ))}
  </div>
);

type FieldProps = {
  id: string;
  name: string;
  label: string;
  icon: Icon;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  autoComplete: string;
  minLength?: number;
  maxLength: number;
  autoFocus?: boolean;
  reveal?: { shown: boolean; toggle: () => void; showLabel: string; hideLabel: string };
};

/** Bordered field: a quiet hairline at rest, a darker border plus a soft halo on focus. */
const Field = ({ id, label, icon, value, onChange, reveal, ...input }: FieldProps) => (
  <div className="group">
    <label htmlFor={id} className="mb-1 block text-xs font-medium text-zinc-700 sm:mb-1.5 sm:text-[13px]">
      {label}
    </label>
    <div className="relative flex items-center rounded-xl border border-zinc-200 bg-white transition-[border-color,box-shadow] duration-200 ease-[var(--ease)] hover:border-zinc-300 group-focus-within:border-zinc-900 group-focus-within:shadow-[0_0_0_4px_rgba(17,19,24,0.06)]">
      <span className="pointer-events-none absolute left-3 text-zinc-400 transition-colors duration-200 group-focus-within:text-[var(--ink)] sm:left-3.5">
        <Glyph as={icon} className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
      </span>
      <input
        id={id}
        type={reveal && !reveal.shown ? "password" : "text"}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`auth-input h-9.5 w-full select-text rounded-xl border-0 bg-transparent pl-9 text-[16px] text-[var(--ink)] disabled:opacity-50 sm:h-11 sm:pl-11 sm:text-[15px] md:h-12 ${
          reveal ? "pr-10 sm:pr-12" : "pr-3 sm:pr-4"
        }`}
        {...input}
      />
      {reveal && (
        <button
          type="button"
          tabIndex={-1}
          disabled={input.disabled}
          aria-label={reveal.shown ? reveal.hideLabel : reveal.showLabel}
          onClick={reveal.toggle}
          className="absolute right-1.5 grid h-7 w-7 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-[var(--ink)] disabled:opacity-50 sm:right-2 sm:h-8 sm:w-8"
        >
          {[false, true].map((shown) => (
            <span
              key={String(shown)}
              className={`col-start-1 row-start-1 transition-[opacity,transform] duration-300 ease-[var(--ease)] ${
                reveal.shown === shown ? "scale-100 opacity-100" : "scale-75 opacity-0"
              }`}
            >
              <Glyph as={shown ? EyeOff : Eye} className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </span>
          ))}
        </button>
      )}
    </div>
  </div>
);

export const AuthGate = () => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const preventBounce = (e: TouchEvent) => {
      if ((e.target as HTMLElement)?.closest("input, button, a")) {
        return;
      }
      if (e.cancelable) {
        e.preventDefault();
      }
    };
    document.addEventListener("touchmove", preventBounce, { passive: false });
    return () => {
      mounted.current = false;
      document.removeEventListener("touchmove", preventBounce);
    };
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    if (username.trim().length < 2) {
      setError("用户名至少需要 2 个字符");
      return;
    }

    if (password.length < 8) {
      setError("密码至少需要 8 个字符");
      return;
    }

    if (tab === "register" && password !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      if (tab === "login") {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
      }
      if (typeof window !== "undefined" && window.location.search.includes("preview=auth")) {
        const url = new URL(window.location.href);
        url.searchParams.delete("preview");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      }
    } catch (reason) {
      if (mounted.current) {
        const raw = reason instanceof Error ? reason.message : "连接失败，请稍后重试";
        setError(raw === "Failed to fetch" ? "无法连接到服务器，请检查后端服务是否已启动" : raw);
      }
    } finally {
      if (mounted.current) {
        setSubmitting(false);
      }
    }
  }

  function changeTab(next: Mode) {
    if (submitting || next === tab) return;
    setTab(next);
    setPassword("");
    setConfirm("");
    setError("");
    setShowPassword(false);
    setShowConfirm(false);
  }

  const copy = COPY[tab];

  return (
    <main
      className="fixed inset-0 z-50 flex h-dvh w-full select-none flex-col items-center justify-center overflow-hidden bg-white overscroll-none touch-manipulation [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-4 py-2 sm:px-6 sm:py-6 selection:bg-[var(--ink)] selection:text-white"
      style={{
        paddingTop: "max(0.625rem, env(safe-area-inset-top))",
        paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <img
        src={logo}
        alt="Atlas"
        draggable={false}
        style={{
          ...enter(0),
          top: "max(0.75rem, env(safe-area-inset-top))",
          left: "max(1rem, env(safe-area-inset-left))",
        }}
        className="auth-enter pointer-events-none absolute z-10 h-5 w-auto select-none object-contain sm:left-8 sm:top-7 sm:h-8"
      />

      <div className="relative flex h-full max-h-[660px] w-full max-w-[340px] flex-col items-center justify-center sm:max-w-[380px]">
        <div className="my-auto w-full">
          <header className="mb-[clamp(0.5rem,1.8vh,1.5rem)] text-center">
            <h1
              style={enter(1)}
              className="auth-enter font-script text-[clamp(2.25rem,5.6vh,4.25rem)] leading-none text-[var(--ink)]"
            >
              Atlas
            </h1>
            <div style={enter(2)} className="auth-enter">
              <Swap
                mode={tab}
                className="mt-0.5 sm:mt-1"
                render={(m) => (
                  <p lang="fr" className="font-serif-fr text-[clamp(11px,1.5vh,15px)] italic text-zinc-500">
                    {COPY[m].motto}
                  </p>
                )}
              />
            </div>
          </header>

          <nav
            style={enter(3)}
            aria-label="账户入口"
            className="auth-enter relative mb-[clamp(0.5rem,1.8vh,1.25rem)] grid grid-cols-2 rounded-xl bg-zinc-100 p-1 text-xs sm:text-sm"
          >
            <span
              aria-hidden="true"
              className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-[0_1px_2px_rgba(17,19,24,0.06),0_1px_3px_rgba(17,19,24,0.08)] transition-transform duration-300 ease-[var(--ease)] ${
                tab === "register" ? "translate-x-full" : "translate-x-0"
              }`}
            />
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                disabled={submitting}
                onClick={() => changeTab(m)}
                aria-pressed={tab === m}
                className={`relative h-8 rounded-lg font-medium transition-colors sm:h-9 ${
                  tab === m ? "text-[var(--ink)]" : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {COPY[m].tab}
              </button>
            ))}
          </nav>

          <form onSubmit={handleSubmit} className="space-y-[clamp(0.375rem,1.5vh,1rem)]" aria-busy={submitting}>
            <div style={enter(4)} className="auth-enter">
              <Field
                id="auth-username"
                name="username"
                label="用户名"
                icon={UserRound}
                autoComplete="username"
                autoFocus
                minLength={2}
                maxLength={30}
                value={username}
                disabled={submitting}
                onChange={setUsername}
              />
            </div>

            <div style={enter(5)} className="auth-enter">
              <Field
                id="auth-password"
                name="password"
                label="密码"
                icon={LockKeyhole}
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                minLength={8}
                maxLength={128}
                value={password}
                disabled={submitting}
                onChange={setPassword}
                reveal={{
                  shown: showPassword,
                  toggle: () => setShowPassword((v) => !v),
                  showLabel: "显示密码",
                  hideLabel: "隐藏密码",
                }}
              />
            </div>

            <div style={enter(6)} className="auth-enter">
              <Swap
                mode={tab}
                render={(m) =>
                  m === "register" ? (
                    <Field
                      id="auth-confirm"
                      name="confirm"
                      label="确认密码"
                      icon={ShieldCheck}
                      autoComplete="new-password"
                      maxLength={128}
                      value={confirm}
                      disabled={submitting || tab !== "register"}
                      onChange={setConfirm}
                      reveal={{
                        shown: showConfirm,
                        toggle: () => setShowConfirm((v) => !v),
                        showLabel: "显示确认密码",
                        hideLabel: "隐藏确认密码",
                      }}
                    />
                  ) : (
                    <div className="flex h-full min-h-[54px] items-center justify-center sm:min-h-[60px]">
                      <p lang="fr" className="font-serif-fr text-[13px] italic text-zinc-400 sm:text-[15px]">
                        Le temps est à vous.
                      </p>
                    </div>
                  )
                }
              />
            </div>

            {error && (
              <div role="alert" className="label-in flex items-center gap-1.5 text-xs font-medium text-rose-600 sm:gap-2">
                <Glyph as={CircleAlert} className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>{error}</span>
              </div>
            )}

            <div style={enter(7)} className="auth-enter pt-0.5 sm:pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="group relative flex h-10 w-full items-center justify-center overflow-hidden rounded-xl bg-[var(--ink)] text-sm font-medium text-white shadow-[0_1px_2px_rgba(17,19,24,0.12)] hover:bg-black hover:shadow-[0_8px_20px_-10px_rgba(17,19,24,0.5)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:text-[15px] md:h-12"
              >
                <span key={`${tab}-${submitting}`} className="label-in flex items-center gap-2">
                  {submitting ? (
                    <>
                      <Glyph as={LoaderCircle} className="h-4 w-4 animate-spin" />
                      {copy.pending}
                    </>
                  ) : (
                    <>
                      {copy.submit}
                      <span className="grid w-0 overflow-hidden opacity-0 transition-[width,opacity] duration-300 ease-[var(--ease)] group-hover:w-4 group-hover:opacity-100">
                        <Glyph as={ArrowRight} className="h-4 w-4" />
                      </span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>

          <div style={enter(8)} className="auth-enter">
            <Swap
              mode={tab}
              className="mt-[clamp(0.5rem,1.6vh,1.25rem)] text-center"
              render={(m) => {
                const other: Mode = m === "login" ? "register" : "login";
                return (
                  <p className="text-[11px] text-zinc-500 sm:text-xs">
                    {COPY[m].switchHint}{" "}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => changeTab(other)}
                      className="font-medium text-[var(--ink)] underline decoration-zinc-300 underline-offset-4 hover:decoration-[var(--ink)]"
                    >
                      {COPY[m].switchAction}
                    </button>
                  </p>
                );
              }}
            />
          </div>

          <footer
            style={enter(9)}
            lang="fr"
            className="auth-enter font-serif-fr mt-[clamp(0.5rem,2vh,1.5rem)] text-center text-[clamp(10px,1.4vh,13px)] italic text-zinc-400"
          >
            Atlas — l’art de tenir ses heures
          </footer>
        </div>
      </div>
    </main>
  );
};