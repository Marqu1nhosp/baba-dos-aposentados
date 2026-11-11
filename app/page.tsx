import { PlayerManager } from "@/components/players/PlayerManager";
import type { Player } from "@/components/players/PlayerProvider";
import { getPlayers } from "@/lib/players";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let players: Player[] = [];
  try {
    players = await getPlayers();
  } catch {
    players = [];
  }
  return <PlayerManager initialPlayers={players} />;
}
