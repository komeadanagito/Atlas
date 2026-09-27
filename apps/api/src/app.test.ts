import { expect, it, vi } from "vitest";
vi.mock("./modules/auth/repo",()=>({findUserByToken:vi.fn(),deleteSession:vi.fn()}));
import { app } from "./app";
it("rejects cross-site writes and missing origins", async()=>{
  for (const origin of ["https://evil.example", ""]) {
    const res=await app.request("/api/auth/logout",{method:"POST",headers:origin?{Origin:origin}:{}});
    expect(res.status).toBe(403);
  }
});
it("permits configured browser origin",async()=>{
  expect((await app.request("/api/auth/logout",{method:"POST",headers:{Origin:"http://localhost:5173"}})).status).toBe(200);
});
it("requires session to read timeline",async()=>{
  expect((await app.request("/api/timeline")).status).toBe(401);
});