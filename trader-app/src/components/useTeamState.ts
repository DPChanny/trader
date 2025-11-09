import { useState } from "preact/hooks";
import type { PlayerProps } from "./player";

export function useTeamState(
  requiredPositions: string[],
  initialPoints: number = 0
) {
  const [players, setPlayers] = useState<(PlayerProps | null)[]>(
    requiredPositions.map(() => null)
  );
  const [points, setPoints] = useState<number>(initialPoints);

  const addPlayer = (playerData: PlayerProps, slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= requiredPositions.length) {
      console.error("Invalid slot index");
      return;
    }

    setPlayers((prev) => {
      const newPlayers = [...prev];
      newPlayers[slotIndex] = playerData;
      return newPlayers;
    });
  };

  const removePlayer = (slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= requiredPositions.length) {
      console.error("Invalid slot index");
      return;
    }

    setPlayers((prev) => {
      const newPlayers = [...prev];
      newPlayers[slotIndex] = null;
      return newPlayers;
    });
  };

  const playerCount = players.filter((p) => p !== null).length;

  return {
    players,
    points,
    setPoints,
    addPlayer,
    removePlayer,
    playerCount,
  };
}
