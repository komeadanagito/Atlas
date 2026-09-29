import { afterEach, expect, it, vi } from "vitest";
import { isTransientDbError, pool, query } from "./client";

afterEach(() => vi.restoreAllMocks());
const fakeClient = (run: () => Promise<unknown>) => ({ query: vi.fn(run), release: vi.fn() });

it("classifies connection failures as transient", () => {
  expect(isTransientDbError(new Error("Connection terminated due to connection timeout"))).toBe(true);
  expect(isTransientDbError({ code: "ECONNRESET", message: "" })).toBe(true);
  expect(isTransientDbError({ code: "23505", message: "duplicate key" })).toBe(false);
});

it("retries a failed connect and then succeeds", async () => {
  const client = fakeClient(async () => ({ rows: [{ ok: 1 }] }));
  const connect = vi.spyOn(pool, "connect")
    .mockRejectedValueOnce(new Error("Connection terminated due to connection timeout") as never)
    .mockResolvedValueOnce(client as never);
  await expect(query("SELECT 1")).resolves.toMatchObject({ rows: [{ ok: 1 }] });
  expect(connect).toHaveBeenCalledTimes(2);
});

it("retries reads once on a dropped connection and destroys the broken client", async () => {
  const dropped = new Error("Connection terminated unexpectedly");
  const broken = fakeClient(async () => { throw dropped; });
  const healthy = fakeClient(async () => ({ rows: [] }));
  vi.spyOn(pool, "connect").mockResolvedValueOnce(broken as never).mockResolvedValueOnce(healthy as never);
  await expect(query("SELECT * FROM timeline_items")).resolves.toMatchObject({ rows: [] });
  expect(broken.release).toHaveBeenCalledWith(dropped);
  expect(healthy.release).toHaveBeenCalledWith();
});

it("never re-runs a write that failed mid-flight", async () => {
  const broken = fakeClient(async () => { throw new Error("Connection terminated unexpectedly"); });
  const connect = vi.spyOn(pool, "connect").mockResolvedValue(broken as never);
  await expect(query("INSERT INTO t VALUES (1)")).rejects.toThrow("terminated");
  expect(connect).toHaveBeenCalledTimes(1);
});
