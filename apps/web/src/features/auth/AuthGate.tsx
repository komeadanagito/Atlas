import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "./AuthContext";
import logo from "../../assets/atlas-logo.png";
import { IconArrowRight, IconEye, IconEyeSlash, IconLock, IconShieldCheck, IconUser } from "../../shared/ui/Icons";

export const AuthGate = () => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
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

  function changeTab(next: "login" | "register") {
    if (submitting || next === tab) return;
    setTab(next);
    setPassword("");
    setConfirm("");
    setError("");
    setShowPassword(false);
    setShowConfirm(false);
  }

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-[var(--wash)] px-4 py-12 selection:bg-zinc-200">
      {/* 极简柔和背景微光与网格底纹 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[520px] w-[680px] rounded-full bg-gradient-to-b from-zinc-200/50 via-zinc-100/30 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:24px_24px] opacity-35" />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* 品牌标识与标语 */}
        <header className="mb-7 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-black/[0.08] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-transform duration-300 hover:scale-105">
            <img src={logo} alt="Atlas" className="h-8 w-8 select-none object-contain" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--ink)]">Atlas</h1>
          <p className="mt-1.5 text-xs text-[var(--muted)]">
            {tab === "login" ? "登录你的账户，掌控属于自己的时间秩序" : "创建你的账户，开启专注与高效日程"}
          </p>
        </header>

        {/* 认证卡片主体 */}
        <div className="rounded-2xl border border-black/[0.08] bg-white p-7 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.06)] sm:p-8">
          {/* 模式分段选择器 */}
          <nav
            aria-label="账户入口"
            className="relative mb-6 grid grid-cols-2 rounded-xl bg-black/[0.04] p-1 text-sm font-medium"
          >
            <button
              type="button"
              disabled={submitting}
              onClick={() => changeTab("login")}
              aria-pressed={tab === "login"}
              className={`relative z-10 flex h-9 items-center justify-center rounded-lg transition-all duration-200 ${
                tab === "login"
                  ? "bg-white text-[var(--ink)] font-semibold shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              登录
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => changeTab("register")}
              aria-pressed={tab === "register"}
              className={`relative z-10 flex h-9 items-center justify-center rounded-lg transition-all duration-200 ${
                tab === "register"
                  ? "bg-white text-[var(--ink)] font-semibold shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              注册
            </button>
          </nav>

          {/* 表单内容 */}
          <form onSubmit={handleSubmit} className="space-y-4" aria-busy={submitting}>
            {/* 用户名字段 */}
            <div className="space-y-1.5">
              <label htmlFor="auth-username" className="block text-xs font-medium text-[var(--ink)]">
                用户名
              </label>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-3 text-[var(--faint)]">
                  <IconUser className="h-4 w-4" />
                </span>
                <input
                  id="auth-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  autoFocus
                  minLength={2}
                  maxLength={30}
                  placeholder="请输入用户名"
                  value={username}
                  disabled={submitting}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 py-2.5 pr-3.5 pl-9 text-sm text-[var(--ink)] placeholder:text-[var(--faint)] transition-all duration-200 focus:border-[var(--ink)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 disabled:opacity-50"
                />
              </div>
            </div>

            {/* 密码字段 */}
            <div className="space-y-1.5">
              <label htmlFor="auth-password" className="block text-xs font-medium text-[var(--ink)]">
                密码
              </label>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-3 text-[var(--faint)]">
                  <IconLock className="h-4 w-4" />
                </span>
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                  required
                  minLength={8}
                  maxLength={128}
                  placeholder="至少 8 位字符"
                  value={password}
                  disabled={submitting}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 py-2.5 pr-10 pl-9 text-sm text-[var(--ink)] placeholder:text-[var(--faint)] transition-all duration-200 focus:border-[var(--ink)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={submitting}
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 flex h-7 w-7 items-center justify-center rounded-lg text-[var(--faint)] transition-colors hover:text-[var(--ink)] disabled:opacity-50"
                >
                  {showPassword ? <IconEyeSlash className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 确认密码字段（仅在注册时展示） */}
            {tab === "register" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <label htmlFor="auth-confirm" className="block text-xs font-medium text-[var(--ink)]">
                  确认密码
                </label>
                <div className="relative flex items-center">
                  <span className="pointer-events-none absolute left-3 text-[var(--faint)]">
                    <IconShieldCheck className="h-4 w-4" />
                  </span>
                  <input
                    id="auth-confirm"
                    name="confirm"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    maxLength={128}
                    placeholder="再次输入密码"
                    value={confirm}
                    disabled={submitting}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 py-2.5 pr-10 pl-9 text-sm text-[var(--ink)] placeholder:text-[var(--faint)] transition-all duration-200 focus:border-[var(--ink)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    disabled={submitting}
                    aria-label={showConfirm ? "隐藏确认密码" : "显示确认密码"}
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 flex h-7 w-7 items-center justify-center rounded-lg text-[var(--faint)] transition-colors hover:text-[var(--ink)] disabled:opacity-50"
                  >
                    {showConfirm ? <IconEyeSlash className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* 错误提示横幅 */}
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 border border-rose-100"
              >
                <svg className="h-4 w-4 shrink-0 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* 提交主操作按钮 */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ink)] py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>{tab === "login" ? "正在登录…" : "正在创建账户…"}</span>
                </>
              ) : (
                <>
                  <span>{tab === "login" ? "立即登录" : "创建账户"}</span>
                  <IconArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* 模式底部快捷切换 */}
          <div className="mt-6 border-t border-zinc-100 pt-5 text-center">
            {tab === "login" ? (
              <p className="text-xs text-[var(--muted)]">
                还没有账户？{" "}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => changeTab("register")}
                  className="font-medium text-[var(--ink)] underline underline-offset-4 hover:opacity-80"
                >
                  免费注册
                </button>
              </p>
            ) : (
              <p className="text-xs text-[var(--muted)]">
                已有账户？{" "}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => changeTab("login")}
                  className="font-medium text-[var(--ink)] underline underline-offset-4 hover:opacity-80"
                >
                  直接登录
                </button>
              </p>
            )}
          </div>
        </div>

        {/* 底部信任与质感签名 */}
        <footer className="mt-8 text-center text-xs tracking-wider text-[var(--faint)]">
          ATLAS · 个人专注与时间管理
        </footer>
      </div>
    </main>
  );
};
