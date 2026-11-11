"use client";

import { createContext, useContext, useState, type Dispatch, type SetStateAction } from "react";

export interface Player {
  id: string;
  name: string;
  rating: number;
}

interface PlayerContextValue {
  players: Player[] | undefined;
  setPlayers: Dispatch<SetStateAction<Player[] | undefined>>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [players, setPlayers] = useState<Player[]>();

  return (
    <PlayerContext.Provider value={{ players, setPlayers }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function useSharedPlayers() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("useSharedPlayers deve ser usado dentro de PlayerProvider.");
  }
  return context;
}
