import { useState, type FormEvent } from "react";
import { Modal } from "../../shared/ui/Modal";
import { useAuth } from "./AuthContext";

const field = "w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--faint)] outline-none transition-all duration-200 focus:border-[var(--ink)] focus:bg-white focus:ring-2 focus:ring-black/5 disabled:opacity-50";
const Credentials = () => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (saving) return;
    if (tab === "register" && password !== confirm) { setError("两次输入的密码不一致"); return; }
    setSaving(true); setError("");
    try { await (tab === "login" ? login : register)(username.trim(), password); }
    catch (reason) {
      const raw = reason instanceof Error ? reason.message : "连接失败，请重试";
      setError(raw === "Failed to fetch" ? "无法连接到服务器，请检查后端服务是否已启动" : raw);
    }
    finally { setSaving(false); }
  };
  return <>
    <p className="mb-5 text-sm text-pretty text-slate-500">{tab === "login" ? "登录后继续管理你的个人日程。" : "创建账号，开始安排属于自己的时间。"}</p>
    <form onSubmit={submit} className="space-y-4">
      <label className="block space-y-2 text-sm">用户名<input className={field} autoFocus autoComplete="username" required minLength={2} maxLength={30} value={username} onChange={e => setUsername(e.target.value)} disabled={saving} /></label>
      <label className="block space-y-2 text-sm">密码<input className={field} type="password" autoComplete={tab === "login" ? "current-password" : "new-password"} required minLength={8} maxLength={128} placeholder="8–128 位字符" value={password} onChange={e => setPassword(e.target.value)} disabled={saving} /></label>
      {tab === "register" && <label className="block space-y-2 text-sm">确认密码<input className={field} type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} disabled={saving} /></label>}
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <button type="submit" disabled={saving} className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "提交中…" : tab === "login" ? "立即登录" : "创建账户"}</button>
      <button type="button" disabled={saving} onClick={() => { setTab(tab === "login" ? "register" : "login"); setPassword(""); setConfirm(""); setError(""); }} className="w-full py-2 text-sm text-blue-600">{tab === "login" ? "注册新用户" : "返回登录"}</button>
    </form>
  </>;
};
export const AuthModal = () => {
  const { isModalOpen, closeLogin } = useAuth();
  return <Modal open={isModalOpen} title="欢迎使用 Atlas" onClose={closeLogin}><Credentials /></Modal>;
};
export const ChangePasswordModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => <Modal open={open} title="修改密码" onClose={onClose}><PasswordForm onClose={onClose} /></Modal>;
const PasswordForm = ({ onClose }: { onClose: () => void }) => {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState(""); const [next, setNext] = useState(""); const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (saving) return;
    if (next !== confirm) { setError("两次输入的密码不一致"); return; }
    setSaving(true); setError("");
    try { await changePassword(current,next); onClose(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "修改失败，请重试"); }
    finally { setSaving(false); }
  };
  return <form onSubmit={submit} className="space-y-4">
    <p className="text-sm text-pretty text-slate-500">修改成功后所有设备会退出登录，请使用新密码重新登录。</p>
    <label className="block text-sm">原密码<input autoFocus className={field} required type="password" autoComplete="current-password" maxLength={128} value={current} onChange={e=>setCurrent(e.target.value)} disabled={saving}/></label>
    <label className="block text-sm">新密码<input className={field} required type="password" autoComplete="new-password" minLength={8} maxLength={128} value={next} onChange={e=>setNext(e.target.value)} disabled={saving}/></label>
    <label className="block text-sm">确认新密码<input className={field} required type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} disabled={saving}/></label>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    <button type="submit" disabled={saving} className="w-full rounded-xl bg-slate-900 py-3 text-sm text-white disabled:opacity-50">{saving ? "保存中…" : "确认修改"}</button>
  </form>;
};