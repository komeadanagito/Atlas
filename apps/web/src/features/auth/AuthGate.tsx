import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import "@fontsource/pinyon-script/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import {
  ArrowRight,
  CircleNotch,
  Eye,
  EyeSlash,
  LockSimple,
  ShieldCheck,
  User,
  WarningCircle,
  type Icon,
} from "@phosphor-icons/react";
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
  <G className={className} weight="light" aria-hidden="true" focusable="false" />
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

/** Underline field: a hairline at rest, an ink line drawn from the left on focus. */
const Field = ({ id, label, icon, value, onChange, reveal, ...input }: FieldProps) => (
  <div className="group">
    <label
      htmlFor={id}
      className="block text-[11px] font-medium tracking-[0.08em] text-zinc-500 transition-colors duration-300 group-focus-within:text-[var(--ink)]"
    >
      {label}
    </label>
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-0 text-zinc-400 transition-colors duration-300 group-focus-within:text-[var(--ink)]">
        <Glyph as={icon} />
      </span>
      <input
        id={id}
        type={reveal && !reveal.shown ? "password" : "text"}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`auth-input h-12 w-full border-0 bg-transparent pl-8 text-[15px] text-[var(--ink)] focus:outline-none disabled:opacity-50 ${
          reveal ? "pr-10" : "pr-0"
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
          className="absolute right-0 grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:text-[var(--ink)] disabled:opacity-50"
        >
          {[false, true].map((shown) => (
            <span
              key={String(shown)}
              className={`col-start-1 row-start-1 transition-[opacity,transform] duration-300 ease-[var(--ease)] ${
                reveal.shown === shown ? "scale-100 opacity-100" : "scale-75 opacity-0"
              }`}
            >
              <Glyph as={shown ? EyeSlash : Eye} />
            </span>
          ))}
        </button>
      )}
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-zinc-200" />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[var(--ink)] transition-transform duration-500 ease-[var(--ease)] group-focus-within:scale-x-100"
      />
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
    return () => {
      mounted.current = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

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
    } catch (reason) {
      if (mounted.current) {
        setError(reason instanceof Error ? reason.message : "连接失败，请稍后重试");
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
    <main className="soft-scroll relative h-dvh w-full overflow-y-auto overflow-x-hidden bg-white selection:bg-[var(--ink)] selection:text-white">
      <img
        src={logo}
        alt="Atlas"
        draggable={false}
        style={enter(0)}
        className="auth-enter absolute left-5 top-5 z-10 h-7 w-auto select-none object-contain sm:left-8 sm:top-7 sm:h-8"
      />

      <div className="relative flex min-h-full items-center justify-center px-6 pb-12 pt-24 sm:py-16">
        <div className="w-full max-w-[360px]">
          <header className="mb-10 text-center">
            <h1 style={enter(1)} className="auth-enter font-script text-[68px] leading-[1.1] text-[var(--ink)] sm:text-[80px]">
              Atlas
            </h1>
            <div style={enter(2)} className="auth-enter">
              <Swap
                mode={tab}
                className="mt-1"
                render={(m) => (
                  <p lang="fr" className="font-serif-fr text-[17px] italic text-zinc-500">
                    {COPY[m].motto}
                  </p>
                )}
              />
            </div>
          </header>

          <nav style={enter(3)} aria-label="账户入口" className="auth-enter relative mb-9 grid grid-cols-2 text-sm">
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-zinc-100" />
            <span
              aria-hidden="true"
              className={`absolute bottom-0 left-0 h-px w-1/2 bg-[var(--ink)] transition-transform duration-500 ease-[var(--ease)] ${
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
                className={`h-10 font-medium tracking-[0.12em] ${
                  tab === m ? "text-[var(--ink)]" : "text-zinc-500 hover:text-[var(--ink)]"
                }`}
              >
                {COPY[m].tab}
              </button>
            ))}
          </nav>

          <form onSubmit={handleSubmit} className="space-y-6" aria-busy={submitting}>
            <div style={enter(4)} className="auth-enter">
              <Field
                id="auth-username"
                name="username"
                label="用户名"
                icon={User}
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
                icon={LockSimple}
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
                    <p lang="fr" className="flex h-full items-center justify-center font-serif-fr text-[15px] italic text-zinc-500">
                      Le temps est à vous.
                    </p>
                  )
                }
              />
            </div>

            {error && (
              <div role="alert" className="label-in flex items-center gap-2 text-xs font-medium text-rose-600">
                <Glyph as={WarningCircle} className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div style={enter(7)} className="auth-enter pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-full bg-[var(--ink)] text-sm font-medium tracking-[0.08em] text-white hover:bg-black hover:shadow-[0_10px_24px_-12px_rgba(17,19,24,0.55)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span key={`${tab}-${submitting}`} className="label-in flex items-center gap-2">
                  {submitting ? (
                    <>
                      <Glyph as={CircleNotch} className="h-4 w-4 animate-spin" />
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
              className="mt-8 text-center"
              render={(m) => {
                const other: Mode = m === "login" ? "register" : "login";
                return (
                  <p className="text-xs text-zinc-500">
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

          <footer style={enter(9)} lang="fr" className="auth-enter font-serif-fr mt-14 text-center text-[15px] italic text-zinc-500">
            Atlas — l’art de tenir ses heures
          </footer>
        </div>
      </div>
    </main>
  );
};