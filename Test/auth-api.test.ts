import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSessionToken: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  createSessionToken: mocks.createSessionToken,
}));

import { POST as login } from "../app/api/auth/login/route";
import { POST as logout } from "../app/api/auth/logout/route";

function loginRequest(body: unknown) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("AUTH_PASSWORD", "test-password");
  vi.stubEnv("NODE_ENV", "production");
  mocks.createSessionToken.mockResolvedValue("signed-session-token");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/auth/login", () => {
  it("rejects login when the server password is not configured", async () => {
    vi.stubEnv("AUTH_PASSWORD", "");

    const response = await login(loginRequest({ password: "test-password" }));

    expect(response.status).toBe(500);
    expect(mocks.createSessionToken).not.toHaveBeenCalled();
  });

  it("rejects an incorrect password", async () => {
    const response = await login(loginRequest({ password: "wrong-password" }));

    expect(response.status).toBe(401);
    expect(mocks.createSessionToken).not.toHaveBeenCalled();
  });

  it("returns a secure HTTP-only session cookie after successful login", async () => {
    const response = await login(loginRequest({ password: "test-password" }));

    expect(response.status).toBe(200);
    expect(response.cookies.get("baba_session")?.value).toBe(
      "signed-session-token",
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("Secure");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
  });

  it("returns a server error when the session token cannot be created", async () => {
    mocks.createSessionToken.mockResolvedValue(null);

    const response = await login(loginRequest({ password: "test-password" }));

    expect(response.status).toBe(500);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const response = await logout();

    expect(response.status).toBe(200);
    expect(response.cookies.get("baba_session")?.value).toBe("");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
