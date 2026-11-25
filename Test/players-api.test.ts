import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  createPlayer: vi.fn(),
  deletePlayer: vi.fn(),
  getPlayers: vi.fn(),
  isValidSessionToken: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    player: {
      create: mocks.createPlayer,
      delete: mocks.deletePlayer,
    },
  },
}));
vi.mock("@/lib/players", () => ({
  getPlayers: mocks.getPlayers,
  playerCacheTag: "players",
}));
vi.mock("@/lib/auth", () => ({
  isValidSessionToken: mocks.isValidSessionToken,
}));
vi.mock("next/cache", () => ({
  revalidateTag: mocks.revalidateTag,
}));
vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));

import { PATCH, DELETE } from "../app/api/players/[id]/route";
import { GET, POST } from "../app/api/players/route";

const existingPlayer = {
  id: "player-1",
  name: "Alex",
  rating: 4,
};

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/players", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.cookies.mockResolvedValue({
    get: () => ({ value: "valid-session" }),
  });
  mocks.isValidSessionToken.mockResolvedValue(true);
});

describe("GET /api/players", () => {
  it("returns the players from the data layer", async () => {
    mocks.getPlayers.mockResolvedValue([existingPlayer]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([existingPlayer]);
  });

  it("returns a server error when loading players fails", async () => {
    mocks.getPlayers.mockRejectedValue(new Error("database unavailable"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Não foi possível carregar os jogadores.",
    });
  });
});

describe("POST /api/players", () => {
  it("rejects requests without an authenticated session", async () => {
    mocks.isValidSessionToken.mockResolvedValue(false);

    const response = await POST(jsonRequest({ name: "Alex" }));

    expect(response.status).toBe(401);
    expect(mocks.createPlayer).not.toHaveBeenCalled();
  });

  it.each([
    { name: "A" },
    { name: "A".repeat(31) },
    { name: "Alex", rating: 0 },
    { name: "Alex", rating: 6 },
    { name: "Alex", rating: 3.5 },
  ])("rejects invalid player data: %o", async (body) => {
    const response = await POST(jsonRequest(body));

    expect(response.status).toBe(400);
    expect(mocks.createPlayer).not.toHaveBeenCalled();
  });

  it("trims the name and applies the default rating", async () => {
    mocks.createPlayer.mockResolvedValue(existingPlayer);

    const response = await POST(jsonRequest({ name: "  Alex  " }));

    expect(response.status).toBe(201);
    expect(mocks.createPlayer).toHaveBeenCalledWith({
      data: { name: "Alex", rating: 3 },
    });
    expect(mocks.revalidateTag).toHaveBeenCalledWith("players", { expire: 0 });
    await expect(response.json()).resolves.toEqual(existingPlayer);
  });

  it("returns a conflict-style validation error for duplicate names", async () => {
    mocks.createPlayer.mockRejectedValue({ code: "P2002" });

    const response = await POST(jsonRequest({ name: "Alex" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Já existe um jogador com esse nome.",
    });
  });

  it("returns a server error for unexpected database failures", async () => {
    mocks.createPlayer.mockRejectedValue(new Error("database unavailable"));

    const response = await POST(jsonRequest({ name: "Alex" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Não foi possível cadastrar o jogador.",
    });
  });
});

describe("PATCH /api/players/:id", () => {
  it("reports that rating updates are not supported", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/players/player-1"),
      { params: Promise.resolve({ id: "player-1" }) },
    );

    expect(response.status).toBe(405);
    expect(mocks.deletePlayer).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/players/:id", () => {
  const request = new Request("http://localhost/api/players/player-1", {
    method: "DELETE",
  });
  const context = { params: Promise.resolve({ id: "player-1" }) };

  it("rejects requests without an authenticated session", async () => {
    mocks.isValidSessionToken.mockResolvedValue(false);

    const response = await DELETE(request, context);

    expect(response.status).toBe(401);
    expect(mocks.deletePlayer).not.toHaveBeenCalled();
  });

  it("deletes the player and invalidates the player cache", async () => {
    mocks.deletePlayer.mockResolvedValue(existingPlayer);

    const response = await DELETE(request, context);

    expect(response.status).toBe(204);
    expect(mocks.deletePlayer).toHaveBeenCalledWith({
      where: { id: "player-1" },
    });
    expect(mocks.revalidateTag).toHaveBeenCalledWith("players", { expire: 0 });
  });

  it("returns not found when the player does not exist", async () => {
    mocks.deletePlayer.mockRejectedValue({ code: "P2025" });

    const response = await DELETE(request, context);

    expect(response.status).toBe(404);
  });

  it("returns a server error for unexpected database failures", async () => {
    mocks.deletePlayer.mockRejectedValue(new Error("database unavailable"));

    const response = await DELETE(request, context);

    expect(response.status).toBe(500);
  });
});
