// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { AuthModal, ChangePasswordModal } from "./AuthModal";
import { AuthProvider, useAuth } from "./AuthContext";
import * as client from "../../shared/api/client";
vi.mock("../../shared/api/client", () => ({ fetchMeApi: vi.fn(), loginApi: vi.fn(), registerApi: vi.fn(), logoutApi: vi.fn(), changePasswordApi: vi.fn() }));
const user = { id: "u1", username: "alice", createdAt: "2026-01-01" };
beforeEach(() => {
  vi.mocked(client.fetchMeApi).mockResolvedValue(null);
  HTMLDialogElement.prototype.showModal = function() { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function() { this.removeAttribute("open"); };
});
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const Probe = () => {
  const auth = useAuth();
  return <><button onClick={auth.openLogin}>打开登录</button><span>{auth.user?.username}</span><span>{auth.error}</span><button onClick={auth.retry}>重试</button><AuthModal /></>;
};
const open = async () => {
  await act(async () => { render(<AuthProvider><Probe /></AuthProvider>); });
  fireEvent.click(screen.getByText("打开登录"));
};
describe("authentication UI", () => {
  it("logs in without demo credentials", async () => {
    await open();
    expect(screen.queryByText(/演示管理员/)).toBeNull();
    fireEvent.change(screen.getByLabelText("用户名"), {target:{value:"alice"}});
    fireEvent.change(screen.getByLabelText("密码"), {target:{value:"secret123"}});
    vi.mocked(client.loginApi).mockResolvedValue({user});
    await act(async () => { fireEvent.click(screen.getByText("立即登录")); });
    expect(client.loginApi).toHaveBeenCalledWith({username:"alice", password:"secret123"});
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("alice")).toBeTruthy();
  });
  it("requires matching registration passwords", async () => {
    await open(); fireEvent.click(screen.getByText("注册新用户"));
    fireEvent.change(screen.getByLabelText("用户名"), {target:{value:"alice"}});
    fireEvent.change(screen.getByLabelText("密码"), {target:{value:"secret123"}});
    fireEvent.change(screen.getByLabelText("确认密码"), {target:{value:"different"}});
    fireEvent.click(screen.getByText("创建账户"));
    expect(screen.getByRole("alert").textContent).toContain("不一致");
    expect(client.registerApi).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("确认密码"), {target:{value:"secret123"}});
    vi.mocked(client.registerApi).mockResolvedValue({user});
    await act(async () => { fireEvent.click(screen.getByText("创建账户")); });
    expect(client.registerApi).toHaveBeenCalled();
  });
  it("offers retry after restore network failure", async () => {
    vi.mocked(client.fetchMeApi).mockRejectedValueOnce(new Error("offline"));
    await act(async () => { render(<AuthProvider><Probe /></AuthProvider>); });
    expect(screen.getByText(/无法恢复/)).toBeTruthy();
    vi.mocked(client.fetchMeApi).mockResolvedValueOnce(user);
    await act(async () => { fireEvent.click(screen.getByText("重试")); });
    expect(screen.getByText("alice")).toBeTruthy();
  });
  it("shows wrong current password without closing", async () => {
    vi.mocked(client.changePasswordApi).mockRejectedValue(new Error("原密码错误"));
    await act(async () => { render(<AuthProvider><ChangePasswordModal open onClose={vi.fn()} /></AuthProvider>); });
    for (const [label,value] of [["原密码","secret123"],["新密码","secret456"],["确认新密码","secret456"]]) fireEvent.change(screen.getByLabelText(label), {target:{value}});
    await act(async () => { fireEvent.click(screen.getByText("确认修改")); });
    expect(screen.getByRole("alert").textContent).toContain("原密码错误");
  });
});