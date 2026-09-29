// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { fetchMeApi, getJson, loginApi, logoutApi } from "./client";
afterEach(() => vi.unstubAllGlobals());
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {status, headers:{"Content-Type":"application/json"}});
it("distinguishes no session from an unavailable service", async () => {
  vi.stubGlobal("fetch",vi.fn().mockResolvedValueOnce(json({},401)).mockResolvedValue(json({},503)));
  expect(await fetchMeApi()).toBeNull();
  await expect(fetchMeApi()).rejects.toMatchObject({status:503});
});
it("retries a read once after a transient failure", async () => {
  const fetchMock=vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValueOnce(json([{id:"a"}]));
  vi.stubGlobal("fetch",fetchMock);
  await expect(getJson("/api/timeline")).resolves.toEqual([{id:"a"}]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
it("does not retry client errors", async () => {
  const fetchMock=vi.fn().mockResolvedValue(json({error:"bad"},400));
  vi.stubGlobal("fetch",fetchMock);
  await expect(getJson("/api/timeline")).rejects.toThrow("bad");
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("does not broadcast expiry for a wrong login password", async () => {
  const expired=vi.fn(); window.addEventListener("atlas:unauthorized",expired);
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(json({error:"wrong"},401)));
  await expect(loginApi({username:"alice",password:"secret123"})).rejects.toThrow("wrong");
  expect(expired).not.toHaveBeenCalled(); window.removeEventListener("atlas:unauthorized",expired);
});
it("ignores stale unauthorized responses after a new login",async()=>{
  let resolve!: (value:Response)=>void;
  const pending=new Promise<Response>(yes=>{resolve=yes;});
  vi.stubGlobal("fetch",vi.fn().mockReturnValueOnce(pending).mockResolvedValueOnce(json({user:{id:"new"}})));
  const expired=vi.fn(); window.addEventListener("atlas:unauthorized",expired);
  const old=getJson("/api/timeline").catch(error=>error);
  await loginApi({username:"alice",password:"secret123"});
  resolve(json({},401)); await old;
  expect(expired).not.toHaveBeenCalled(); window.removeEventListener("atlas:unauthorized",expired);
});
it("reports logout failure instead of claiming success", async()=>{
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(json({error:"unavailable"},503)));
  await expect(logoutApi()).rejects.toThrow("unavailable");
});