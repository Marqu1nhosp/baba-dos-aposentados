import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const playerCacheTag = "players";

export const getPlayers = unstable_cache(
  () => prisma.player.findMany({ orderBy: { name: "asc" } }),
  ["players"],
  { tags: [playerCacheTag] },
);
