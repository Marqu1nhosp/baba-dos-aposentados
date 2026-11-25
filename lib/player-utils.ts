export function normalizePlayerSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function drawBalancedTeams<T extends { rating: number }>(
  players: readonly T[],
  teamSize: number,
  random: () => number = Math.random,
): T[][] {
  const shuffledByRating = [...players];

  for (let index = shuffledByRating.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [shuffledByRating[index], shuffledByRating[randomIndex]] = [
      shuffledByRating[randomIndex],
      shuffledByRating[index],
    ];
  }

  shuffledByRating.sort((a, b) => b.rating - a.rating);

  const teamCount = Math.ceil(players.length / teamSize);
  const remainingPlayers = players.length % teamSize;
  const teamCapacities = Array.from({ length: teamCount }, (_, index) =>
    remainingPlayers > 0 && index === teamCount - 1
      ? remainingPlayers
      : teamSize,
  );
  const teams: T[][] = Array.from({ length: teamCount }, () => []);
  const teamStrength = teams.map(() => 0);

  shuffledByRating.forEach((player) => {
    const availableTeams = teams
      .map((team, index) => ({ team, index }))
      .filter(({ team, index }) => team.length < teamCapacities[index]);

    const minimumPlayerCount = Math.min(
      ...availableTeams.map(({ team }) => team.length),
    );
    const teamsWithSpace = availableTeams.filter(
      ({ team }) => team.length === minimumPlayerCount,
    );
    const minimumStrength = Math.min(
      ...teamsWithSpace.map(({ index }) => teamStrength[index]),
    );
    const weakestTeams = teamsWithSpace.filter(
      ({ index }) => teamStrength[index] === minimumStrength,
    );
    const chosen = weakestTeams[Math.floor(random() * weakestTeams.length)];

    chosen.team.push(player);
    teamStrength[chosen.index] += player.rating;
  });

  return teams;
}
