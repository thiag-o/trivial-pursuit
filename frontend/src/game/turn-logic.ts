import { BOARD_TILES } from './board-data';
import type { TileDef, PlayerData } from './types';

const HUB_POSITION = 0;
const CIRCULAR_START = 1;
const CIRCULAR_END = 72;

export function getValidDestinations(
  from: number,
  diceValue: number,
): number[] {
  if (from === HUB_POSITION) {
    const dest = HUB_POSITION + diceValue;
    return dest <= CIRCULAR_END ? [dest] : [dest - CIRCULAR_END];
  }

  const forward = from + diceValue;
  const backward = from - diceValue;

  const destinations: number[] = [];

  if (forward <= CIRCULAR_END) {
    destinations.push(forward);
  } else {
    destinations.push(forward - CIRCULAR_END + CIRCULAR_START - 1);
  }

  if (backward >= CIRCULAR_START) {
    destinations.push(backward);
  } else {
    destinations.push(CIRCULAR_END + backward - CIRCULAR_START + 1);
  }

  return [...new Set(destinations)];
}

export function getTileInfo(position: number): TileDef {
  return BOARD_TILES[position];
}

export function isHumanTurn(
  currentPlayerNickname: string,
  humanNickname: string,
): boolean {
  return currentPlayerNickname === humanNickname;
}

export function getBotsToSkip(
  players: PlayerData[],
  currentPlayerIndex: number,
): string[] {
  const bots: string[] = [];
  let idx = (currentPlayerIndex + 1) % players.length;
  while (!players[idx].isHuman) {
    bots.push(players[idx].nickname);
    idx = (idx + 1) % players.length;
  }
  return bots;
}
