import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("./repo", () => ({findUserByUsername:vi.fn(),createUser:vi.fn(),createSession:vi.fn(),findUserByToken:vi.fn(),deleteSession:vi.fn(),changePassword:vi.fn()}));
import { authRoutes } from "./routes";
import * as repo from "./repo";
import { hashPassword } from "./crypto";
const user = {id:"u1",username:"alice",createdAt:"2026-01-01"};
const send = (path:string, body:unknown = {}, cookie = "") => authRoutes.request(path,{method:"POST",headers:{"Content-Type":"application/json",Cookie:cookie},body:JSON.stringify(body)});
beforeEach(()=>vi.resetAllMocks());
describe("cookie authentication",()=>{
  it("registers and returns only a user with HttpOnly cookie",async()=>{
    vi.mocked(repo.createUser).mockResolvedValue(user);
    vi.mocked(repo.createSession).mockResolvedValue("session-secret");
    const res = await send("/register",{username:"alice",password:"secret123"});
    expect(res.status).toBe(201); expect(await res.json()).toEqual({user});
    expect(res.headers.get("Set-Cookie")).toContain("HttpOnly");
    expect(res.headers.get("Set-Cookie")).toContain("SameSite=Lax");
  });
  it("handles unique constraint race",async()=>{
    vi.mocked(repo.createUser).mockRejectedValue({code:"23505"});
    expect((await send("/register",{username:"alice",password:"secret123"})).status).toBe(409);
  });
  it.each([null,[],{}, {username:"alice",password:"short"}])("rejects malformed registration %j",async body=>{
    expect((await send("/register",body)).status).toBe(400);
  });
  it("uses generic wrong credential errors",async()=>{
    expect((await send("/login",{username:"alice",password:"secret123"})).status).toBe(401);
    vi.mocked(repo.findUserByUsername).mockResolvedValue({...user,passwordHash:hashPassword("different")});
    expect((await send("/login",{username:"alice",password:"secret123"})).status).toBe(401);
  });
  it("logs in using a cookie",async()=>{
    vi.mocked(repo.findUserByUsername).mockResolvedValue({...user,passwordHash:hashPassword("secret123")});
    vi.mocked(repo.createSession).mockResolvedValue("secret");
    const res=await send("/login",{username:"alice",password:"secret123"});
    expect(res.status).toBe(200); expect(await res.json()).toEqual({user});
  });
  it("restores a cookie session but rejects bearer",async()=>{
    vi.mocked(repo.findUserByToken).mockResolvedValue(user);
    expect((await authRoutes.request("/me",{headers:{Cookie:"atlas_session=secret"}})).status).toBe(200);
    expect((await authRoutes.request("/me",{headers:{Authorization:"Bearer secret"}})).status).toBe(401);
  });
  it("revokes before clearing cookie on logout",async()=>{
    const res=await send("/logout",{},"atlas_session=secret");
    expect(repo.deleteSession).toHaveBeenCalledWith("secret"); expect(res.headers.get("Set-Cookie")).toContain("Max-Age=0");
  });
  it("requires auth and validates original password",async()=>{
    expect((await send("/change-password",{currentPassword:"secret123",newPassword:"secret456"})).status).toBe(401);
    vi.mocked(repo.findUserByToken).mockResolvedValue(user);
    vi.mocked(repo.changePassword).mockResolvedValue(false);
    expect((await send("/change-password",{currentPassword:"secret123",newPassword:"secret456"},"atlas_session=secret")).status).toBe(400);
    vi.mocked(repo.changePassword).mockResolvedValue(true);
    const res=await send("/change-password",{currentPassword:"secret123",newPassword:"secret456"},"atlas_session=secret");
    expect(res.status).toBe(200); expect(res.headers.get("Set-Cookie")).toContain("Max-Age=0");
  });
});