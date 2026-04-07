import { BOARD_TILES, SPOKES } from './board-data';
import type { TileDef, PlayerData } from './types';

const HUB_POSITION = 0;
const CIRCULAR_START = 1;
const CIRCULAR_END = 42;

// Reverse lookup: spoke tile position → { spokeIndex, tileIndex }
const SPOKE_TILE_MAP = new Map<number, { spokeIndex: number; tileIndex: number }>();
for (let s = 0; s < SPOKES.length; s++) {
  SPOKES[s].tiles.forEach((pos, idx) => {
    SPOKE_TILE_MAP.set(pos, { spokeIndex: s, tileIndex: idx });
  });
}

export function getValidDestinations(from: number, diceValue: number, canAccessHub = false): number[] {
  const D = diceValue;

  // ── Hub: can enter any spoke ─────────────────────────────────────────────
  if (from === HUB_POSITION) {
    return SPOKES.map((spoke) => (D <= 5 ? spoke.tiles[5 - D] : spoke.hq));
  }

  // ── Spoke tile: bidirectional along spoke ─────────────────────────────────
  const spokeInfo = SPOKE_TILE_MAP.get(from);
  if (spokeInfo !== undefined) {
    const { spokeIndex, tileIndex: idx } = spokeInfo;
    const spoke = SPOKES[spokeIndex];
    const destinations: number[] = [];

    // Toward hub (idx increases toward 4, then hub)
    if (idx + D <= 4) {
      destinations.push(spoke.tiles[idx + D]);
    } else if (idx + D === 5 && canAccessHub) {
      destinations.push(HUB_POSITION);
    } else if (idx + D > 5) {
      const k = idx + D - 5;
      const oppSpokeIndex = (spokeIndex + 3) % 6;
      destinations.push(SPOKES[oppSpokeIndex].tiles[5 - k]);
    }

    // Toward ring (idx decreases toward 0, then HQ)
    if (idx - D >= 0) {
      destinations.push(spoke.tiles[idx - D]);
    } else if (idx - D === -1) {
      destinations.push(spoke.hq); // exact landing on HQ
    } else {
      // Overshoot past HQ → continue on ring (BR-3a)
      const remaining = D - idx - 1;
      const hq = spoke.hq;
      const fwd = ((hq - CIRCULAR_START + remaining) % CIRCULAR_END) + CIRCULAR_START;
      const bwd = ((hq - CIRCULAR_START - remaining + CIRCULAR_END) % CIRCULAR_END) + CIRCULAR_START;
      destinations.push(fwd);
      if (bwd !== fwd) destinations.push(bwd);
    }

    return [...new Set(destinations)];
  }

  // ── Ring tile (regular or HQ): forward + backward, plus spoke entry if HQ ─
  const forward = ((from - CIRCULAR_START + D) % CIRCULAR_END) + CIRCULAR_START;
  const backward = ((from - CIRCULAR_START - D + CIRCULAR_END * Math.ceil(D / CIRCULAR_END)) % CIRCULAR_END) + CIRCULAR_START;

  const destinations: number[] = [forward];
  if (backward !== forward) destinations.push(backward);

  // If this ring tile is an HQ, player can also enter its spoke
  const startSpokeIdx = SPOKES.findIndex((s) => s.hq === from);
  if (startSpokeIdx >= 0) {
    if (D <= 5) {
      destinations.push(SPOKES[startSpokeIdx].tiles[D - 1]);
    } else if (D === 6 && canAccessHub) {
      destinations.push(HUB_POSITION);
    }
  }

  // In-path HQs: player passes through HQ without stopping → can enter spoke (BR-3b)
  for (const spoke of SPOKES) {
    const distFwd = (spoke.hq - from + CIRCULAR_END) % CIRCULAR_END;
    if (distFwd > 0 && distFwd < D) {
      const remaining = D - distFwd; // always 1..5
      destinations.push(spoke.tiles[remaining - 1]);
    }
    const distBwd = (from - spoke.hq + CIRCULAR_END) % CIRCULAR_END;
    if (distBwd > 0 && distBwd < D) {
      const remaining = D - distBwd;
      destinations.push(spoke.tiles[remaining - 1]);
    }
  }

  return [...new Set(destinations)];
}

export function getTileInfo(position: number): TileDef {
  return BOARD_TILES.find((t) => t.position === position)!;
}

export function isHumanTurn(currentPlayerNickname: string, humanNickname: string): boolean {
  return currentPlayerNickname === humanNickname;
}

export function getBotsToSkip(players: PlayerData[], currentPlayerIndex: number): string[] {
  const bots: string[] = [];
  let idx = (currentPlayerIndex + 1) % players.length;
  while (!players[idx].isHuman) {
    bots.push(players[idx].nickname);
    idx = (idx + 1) % players.length;
  }
  return bots;
}

export function filterHubIfMustLeave(destinations: number[], mustLeaveHub: boolean): number[] {
  return destinations.filter((d) => !(mustLeaveHub && d === 0));
}
