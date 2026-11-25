import { afterEach, describe, expect, it, vi } from "vitest";
import { createSessionToken, isValidSessionToken } from "../lib/auth";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("session token helpers", () => {
  it("creates a deterministic HMAC token for the configured secret", async () => {
    vi.stubEnv("AUTH_SECRET", "test-secret");

    const firstToken = await createSessionToken("test-password");
    const secondToken = await createSessionToken("test-password");

    expect(firstToken).toMatch(/^[a-f0-9]{64}$/);
    expect(secondToken).toBe(firstToken);
  });

  it("returns null when the signing secret is missing", async () => {
    vi.stubEnv("AUTH_SECRET", "");

    await expect(createSessionToken("test-password")).resolves.toBeNull();
  });

  it("accepts only a token matching the configured password and secret", async () => {
    vi.stubEnv("AUTH_PASSWORD", "test-password");
    vi.stubEnv("AUTH_SECRET", "test-secret");
    const validToken = await createSessionToken("test-password");

    await expect(isValidSessionToken(validToken ?? undefined)).resolves.toBe(true);
    await expect(isValidSessionToken("invalid-token")).resolves.toBe(false);
    await expect(isValidSessionToken(undefined)).resolves.toBe(false);
  });

  it("rejects tokens if authentication settings are missing", async () => {
    vi.stubEnv("AUTH_PASSWORD", "");
    vi.stubEnv("AUTH_SECRET", "");

    await expect(isValidSessionToken("token")).resolves.toBe(false);
  });
});
