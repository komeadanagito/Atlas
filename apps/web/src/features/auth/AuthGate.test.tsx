// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { AuthGate } from "./AuthGate";
import { AuthProvider } from "./AuthContext";
import * as client from "../../shared/api/client";

vi.mock("../../shared/api/client", () => ({
  fetchMeApi: vi.fn(),
  loginApi: vi.fn(),
  registerApi: vi.fn(),
  logoutApi: vi.fn(),
  changePasswordApi: vi.fn(),
}));

const testUser = { id: "u1", username: "alice", createdAt: "2026-01-01" };

beforeEach(() => {
  vi.mocked(client.fetchMeApi).mockResolvedValue(null);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

const renderGate = async () => {
  let utils: ReturnType<typeof render>;
  await act(async () => {
    utils = render(
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    );
  });
  return utils!;
};

describe("AuthGate component", () => {
  it("renders premium branding and login tab by default", async () => {
    await renderGate();
    expect(screen.getByText("Atlas")).toBeTruthy();
    expect(screen.getByRole("button", { name: "登录" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "注册" })).toBeTruthy();
    expect(screen.getByLabelText(/^用户名/)).toBeTruthy();
    expect(screen.getByLabelText(/^密码/)).toBeTruthy();
  });

  it("submits login credentials correctly", async () => {
    await renderGate();
    fireEvent.change(screen.getByLabelText(/^用户名/), { target: { value: "alice" } });
    fireEvent.change(screen.getByLabelText(/^密码/), { target: { value: "secret123" } });
    vi.mocked(client.loginApi).mockResolvedValue({ user: testUser });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /立即登录/ }));
    });

    expect(client.loginApi).toHaveBeenCalledWith({
      username: "alice",
      password: "secret123",
    });
  });

  it("switches to registration mode and validates matching passwords", async () => {
    await renderGate();
    fireEvent.click(screen.getByRole("button", { name: "注册" }));

    expect(screen.getByLabelText(/^确认密码/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/^用户名/), { target: { value: "bob" } });
    fireEvent.change(screen.getByLabelText(/^密码/), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/^确认密码/), { target: { value: "mismatch" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /创建账户/ }));
    });

    expect(screen.getByRole("alert").textContent).toContain("不一致");
    expect(client.registerApi).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/^确认密码/), { target: { value: "password123" } });
    vi.mocked(client.registerApi).mockResolvedValue({ user: testUser });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /创建账户/ }));
    });

    expect(client.registerApi).toHaveBeenCalledWith({
      username: "bob",
      password: "password123",
    });
  });

  it("restores the registration form when the request fails", async () => {
    vi.mocked(client.registerApi).mockRejectedValue(new Error("用户名已被使用"));
    await renderGate();
    fireEvent.click(screen.getByRole("button", { name: "注册" }));
    fireEvent.change(screen.getByLabelText(/^用户名/), { target: { value: "bob" } });
    fireEvent.change(screen.getByLabelText(/^密码/), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/^确认密码/), { target: { value: "password123" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /创建账户/ }));
    });

    expect(client.registerApi).toHaveBeenCalledOnce();
    expect(screen.getByRole("alert").textContent).toBe("用户名已被使用");
    expect(screen.getByRole("button", { name: "登录" }).hasAttribute("disabled")).toBe(false);
    expect((screen.getByLabelText(/^用户名/) as HTMLInputElement).value).toBe("bob");
  });

  it("handles unmount during submission cleanly", async () => {
    let resolveRegister: (value: { user: typeof testUser }) => void;
    const registerPromise = new Promise<{ user: typeof testUser }>((resolve) => {
      resolveRegister = resolve;
    });
    vi.mocked(client.registerApi).mockReturnValue(registerPromise);

    const { unmount } = await renderGate();
    fireEvent.click(screen.getByRole("button", { name: "注册" }));
    fireEvent.change(screen.getByLabelText(/^用户名/), { target: { value: "bob" } });
    fireEvent.change(screen.getByLabelText(/^密码/), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/^确认密码/), { target: { value: "password123" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /创建账户/ }));
    });

    unmount();

    await act(async () => {
      resolveRegister!({ user: testUser });
    });
  });

  it("toggles password visibility", async () => {
    await renderGate();
    const pwdInput = screen.getByLabelText(/^密码/) as HTMLInputElement;
    expect(pwdInput.type).toBe("password");

    const toggleBtn = screen.getByRole("button", { name: "显示密码" });
    fireEvent.click(toggleBtn);
    expect(pwdInput.type).toBe("text");

    const hideBtn = screen.getByRole("button", { name: "隐藏密码" });
    fireEvent.click(hideBtn);
    expect(pwdInput.type).toBe("password");
  });
});
