import { prisma } from "@/lib/prisma";
import { PlayerManager, type Player } from "@/components/players/PlayerManager";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  let players: Player[] = [];
  try {
    players = await prisma.player.findMany({ orderBy: { name: "asc" } });
  } catch {
    players = [];
  }
  return <PlayerManager initialPlayers={players} manageOnly />;
}
