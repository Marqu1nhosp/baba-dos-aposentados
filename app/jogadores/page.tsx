import { PlayerManager, type Player } from "@/components/players/PlayerManager";
import { getPlayers } from "@/lib/players";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  let players: Player[] = [];
  try {
    players = await getPlayers();
  } catch {
    players = [];
  }
  return <PlayerManager initialPlayers={players} manageOnly />;
}
