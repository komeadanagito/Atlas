import type { AuthResponse, LoginPayload, RegisterPayload, User } from "@atlas/shared";
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
let sessionVersion = 0;
const sessionActions = new Set(["/api/auth/login", "/api/auth/register", "/api/auth/logout", "/api/auth/change-password"]);
const request = async <T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal): Promise<T> => {
  const version = sessionVersion;
  const response = await fetch(path, { method, credentials: "same-origin", signal, headers: body === undefined ? undefined : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && version === sessionVersion && path !== "/api/auth/login" && path !== "/api/auth/me") window.dispatchEvent(new Event("atlas:unauthorized"));
    throw new ApiError(data?.error || "服务暂时不可用，请稍后重试", response.status);
  }
  if (sessionActions.has(path)) sessionVersion++;
  return data as T;
};
export const postJson = <T>(path: string, body: unknown) => request<T>(path, "POST", body);
const isRetryable = (error: unknown) =>
  error instanceof TypeError || (error instanceof ApiError && error.status >= 500);
const pause = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (signal?.aborted) return reject(signal.reason);
  const timer = setTimeout(resolve, ms);
  signal?.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
});
// Reads are idempotent, so ride out a brief network/DB hiccup with one quiet retry.
export const getJson = async <T>(path: string, signal?: AbortSignal): Promise<T> => {
  try { return await request<T>(path, "GET", undefined, signal); }
  catch (error) {
    if (signal?.aborted || !isRetryable(error)) throw error;
    await pause(600, signal);
    return request<T>(path, "GET", undefined, signal);
  }
};
export const patchJson = <T>(path: string, body: unknown) => request<T>(path, "PATCH", body);
export const deleteJson = <T>(path: string) => request<T>(path, "DELETE");
export const loginApi = (payload: LoginPayload) => postJson<AuthResponse>("/api/auth/login", payload);
export const registerApi = (payload: RegisterPayload) => postJson<AuthResponse>("/api/auth/register", payload);
export const fetchMeApi = async (signal?: AbortSignal): Promise<User | null> => {
  try { return (await getJson<{user: User}>("/api/auth/me", signal)).user; }
  catch (error) { if (error instanceof ApiError && error.status === 401) return null; throw error; }
};
export const logoutApi = () => postJson<{ok: boolean}>("/api/auth/logout", {});
export const changePasswordApi = (currentPassword: string, newPassword: string) => postJson<{ok: boolean}>("/api/auth/change-password", {currentPassword, newPassword});