import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { User } from "@atlas/shared";
import { fetchMeApi, loginApi, logoutApi, registerApi, changePasswordApi } from "../../shared/api/client";

type Auth = {
  user: User | null; loading: boolean; error: string; isModalOpen: boolean;
  openLogin: () => void; closeLogin: () => void; retry: () => void;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
};
const Context = createContext<Auth | null>(null);
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const generation = useRef(0);
  const busy = useRef(false);
  /** `silent` re-checks in the background while the error banner stays up, so recovery doesn't flicker. */
  const restore = useCallback(async (silent = false) => {
    const version = ++generation.current;
    if (!silent) { setLoading(true); setError(""); }
    try { const next = await fetchMeApi(); if (version === generation.current) { setUser(next); setError(""); } }
    catch { if (version === generation.current) setError("无法恢复登录状态，请检查连接后重试。"); }
    finally { if (version === generation.current) setLoading(false); }
  }, []);
  // A backend restart shouldn't strand the user: keep probing while restore is failing.
  useEffect(() => {
    if (!error) return;
    const again = () => { void restore(true); };
    const timer = window.setInterval(again, 3000);
    window.addEventListener("focus", again);
    window.addEventListener("online", again);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", again);
      window.removeEventListener("online", again);
    };
  }, [error, restore]);
  useEffect(() => {
    localStorage.removeItem("atlas_auth_token");
    void restore();
    const expired = () => { ++generation.current; setUser(null); setLoading(false); setError(""); setIsModalOpen(true); };
    window.addEventListener("atlas:unauthorized", expired);
    return () => { ++generation.current; window.removeEventListener("atlas:unauthorized", expired); };
  }, [restore]);
  const authenticate = async (action: typeof loginApi, username: string, password: string) => {
    if (busy.current) throw new Error("操作进行中，请稍候");
    busy.current = true;
    const version = ++generation.current;
    try { const res = await action({ username, password }); if (version === generation.current) { setUser(res.user); setError(""); setLoading(false); setIsModalOpen(false); } }
    finally { busy.current = false; }
  };
  const endSession = async (action: () => Promise<unknown>, promptLogin: boolean) => {
    if (busy.current) throw new Error("操作进行中，请稍候");
    busy.current = true;
    const version = ++generation.current;
    try {
      await action();
      if (version === generation.current) {
        setUser(null);
        setError("");
        setLoading(false);
        setIsModalOpen(promptLogin);
      }
    } finally {
      busy.current = false;
    }
  };
  const logout = () => endSession(logoutApi, false);
  const changePassword = (current: string, next: string) =>
    endSession(() => changePasswordApi(current, next), true);
  return <Context.Provider value={{ user, loading, error, isModalOpen, retry: () => { void restore(); }, openLogin: () => setIsModalOpen(true), closeLogin: () => setIsModalOpen(false), login: (u,p) => authenticate(loginApi,u,p), register: (u,p) => authenticate(registerApi,u,p), logout, changePassword }}>{children}</Context.Provider>;
};
export const useAuth = () => {
  const auth = useContext(Context);
  if (!auth) throw new Error("useAuth must be used within AuthProvider");
  return auth;
};