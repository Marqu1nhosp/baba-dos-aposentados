import { describe, expect, it } from "vitest";
import { drawBalancedTeams, normalizePlayerSearch } from "../lib/player-utils";

describe("normalizePlayerSearch", () => {
  it("ignores accents, case, and surrounding whitespace", () => {
    expect(normalizePlayerSearch("  ÁLVARO  ")).toBe("alvaro");
  });
});

describe("drawBalancedTeams", () => {
  it("assigns every player once to teams with balanced ratings", () => {
    const players = [
      { id: "1", rating: 5 },
      { id: "2", rating: 5 },
      { id: "3", rating: 4 },
      { id: "4", rating: 4 },
      { id: "5", rating: 3 },
      { id: "6", rating: 3 },
      { id: "7", rating: 3 },
      { id: "8", rating: 3 },
      { id: "9", rating: 2 },
      { id: "10", rating: 2 },
      { id: "11", rating: 1 },
      { id: "12", rating: 1 },
    ];

    const teams = drawBalancedTeams(players, 6, () => 0);
    const assignedIds = teams.flat().map((player) => player.id);
    const teamStrengths = teams.map((team) =>
      team.reduce((total, player) => total + player.rating, 0),
    );

    expect(teams).toHaveLength(2);
    expect(teams.every((team) => team.length === 6)).toBe(true);
    expect(assignedIds).toHaveLength(players.length);
    expect(new Set(assignedIds).size).toBe(players.length);
    expect(Math.abs(teamStrengths[0] - teamStrengths[1])).toBeLessThanOrEqual(1);
    expect(players.map((player) => player.id)).toEqual(
      Array.from({ length: 12 }, (_, index) => String(index + 1)),
    );
  });
});
