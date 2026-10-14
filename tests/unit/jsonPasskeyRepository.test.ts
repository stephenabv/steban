import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JsonPasskeyRepository } from "@/server/repositories/JsonPasskeyRepository";
import { PasskeyAlreadyExistsError } from "@/server/repositories/PasskeyRepository";
import type { CreatePasskeyInput } from "@/server/domain/entities";

const input = (overrides: Partial<CreatePasskeyInput> = {}): CreatePasskeyInput => ({
  id: "cred-1",
  ownerId: "admin",
  name: "Laptop",
  publicKey: new Uint8Array([1, 2, 3, 255]),
  counter: 0,
  transports: ["internal", "hybrid"],
  deviceType: "multiDevice",
  backedUp: true,
  aaguid: "00000000-0000-0000-0000-000000000000",
  ...overrides,
});

describe("JsonPasskeyRepository", () => {
  let dir: string;
  let repo: JsonPasskeyRepository;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "passkeys-"));
    repo = new JsonPasskeyRepository(path.join(dir, "passkeys.json"));
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("round-trips a passkey, including its key bytes", async () => {
    await repo.create(input());
    const found = await repo.findById("cred-1");
    expect(found?.publicKey).toEqual(new Uint8Array([1, 2, 3, 255]));
    expect(found).toMatchObject({
      name: "Laptop",
      transports: ["internal", "hybrid"],
      lastUsedAt: null,
    });
    expect(await repo.findById("missing")).toBeNull();
  });

  it("rejects a duplicate credential", async () => {
    await repo.create(input());
    await expect(repo.create(input({ name: "Again" }))).rejects.toBeInstanceOf(
      PasskeyAlreadyExistsError
    );
  });

  it("lists only the owner's passkeys", async () => {
    await repo.create(input({ id: "a" }));
    await repo.create(input({ id: "b", ownerId: "someone-else" }));
    expect((await repo.listByOwner("admin")).map((p) => p.id)).toEqual(["a"]);
  });

  it("only moves the signature counter forward", async () => {
    await repo.create(input({ counter: 5 }));
    const usedAt = new Date("2026-10-14T12:00:00Z");
    expect(await repo.recordUse("cred-1", 5, usedAt)).toBe(false);
    expect(await repo.recordUse("cred-1", 6, usedAt)).toBe(true);
    expect(await repo.findById("cred-1")).toMatchObject({ counter: 6, lastUsedAt: usedAt });
    expect(await repo.recordUse("missing", 9, usedAt)).toBe(false);
  });

  it("accepts repeated zero counters from authenticators that don't count", async () => {
    await repo.create(input({ counter: 0 }));
    expect(await repo.recordUse("cred-1", 0, new Date())).toBe(true);
    expect(await repo.recordUse("cred-1", 0, new Date())).toBe(true);
  });

  it("deletes only when the owner matches", async () => {
    await repo.create(input());
    expect(await repo.delete("someone-else", "cred-1")).toBe(false);
    expect(await repo.delete("admin", "cred-1")).toBe(true);
    expect(await repo.findById("cred-1")).toBeNull();
  });

  it("serializes concurrent writes", async () => {
    await Promise.all(["a", "b", "c", "d"].map((id) => repo.create(input({ id }))));
    expect(await repo.listByOwner("admin")).toHaveLength(4);
  });
});
