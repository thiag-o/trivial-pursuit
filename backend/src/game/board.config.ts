import { Injectable } from '@nestjs/common';
import { Category, TileType } from '../common/enums';
import { Tile } from '../common/interfaces';

const TOTAL_TILES = 73;
const HUB_POSITION = 0;
const CIRCULAR_START = 1;
const CIRCULAR_END = 42;

const HQ_POSITIONS: Record<number, Category> = {
  7: Category.GEOGRAPHY,
  14: Category.ENTERTAINMENT,
  21: Category.HISTORY,
  28: Category.ART,
  35: Category.SCIENCE,
  42: Category.SPORTS,
};

const CATEGORY_CYCLE: Category[] = [
  Category.GEOGRAPHY,
  Category.ENTERTAINMENT,
  Category.HISTORY,
  Category.ART,
  Category.SCIENCE,
  Category.SPORTS,
];

// Spoke definitions: tiles[0] adjacent to HQ, tiles[4] adjacent to hub
const SPOKES = [
  { hq: 7, tiles: [43, 44, 45, 46, 47], category: Category.GEOGRAPHY },
  { hq: 14, tiles: [48, 49, 50, 51, 52], category: Category.ENTERTAINMENT },
  { hq: 21, tiles: [53, 54, 55, 56, 57], category: Category.HISTORY },
  { hq: 28, tiles: [58, 59, 60, 61, 62], category: Category.ART },
  { hq: 35, tiles: [63, 64, 65, 66, 67], category: Category.SCIENCE },
  { hq: 42, tiles: [68, 69, 70, 71, 72], category: Category.SPORTS },
];

// Reverse lookup: spoke tile position → { spokeIndex, tileIndex }
const SPOKE_TILE_MAP = new Map<
  number,
  { spokeIndex: number; tileIndex: number }
>();
for (let s = 0; s < SPOKES.length; s++) {
  SPOKES[s].tiles.forEach((pos, idx) => {
    SPOKE_TILE_MAP.set(pos, { spokeIndex: s, tileIndex: idx });
  });
}

function buildTiles(): Tile[] {
  const tiles: Tile[] = [];

  tiles.push({ position: 0, type: TileType.HUB, category: null });

  for (let i = CIRCULAR_START; i <= CIRCULAR_END; i++) {
    if (HQ_POSITIONS[i] !== undefined) {
      tiles.push({ position: i, type: TileType.HQ, category: HQ_POSITIONS[i] });
    } else {
      const category = CATEGORY_CYCLE[(i - 1) % CATEGORY_CYCLE.length];
      tiles.push({ position: i, type: TileType.CATEGORY, category });
    }
  }

  // Spoke tiles (positions 43–72) — rotating category pattern, not all same as HQ
  for (let s = 0; s < SPOKES.length; s++) {
    const spoke = SPOKES[s];
    spoke.tiles.forEach((pos, tileIndex) => {
      const category =
        CATEGORY_CYCLE[(s + tileIndex + 1) % CATEGORY_CYCLE.length];
      tiles.push({ position: pos, type: TileType.CATEGORY, category });
    });
  }

  return tiles;
}

@Injectable()
export class BoardConfig {
  private readonly tiles: Tile[] = buildTiles();

  getTile(position: number): Tile {
    return this.tiles.find((t) => t.position === position)!;
  }

  getValidDestinations(
    from: number,
    diceValue: number,
    canAccessHub = false,
  ): number[] {
    const D = diceValue;

    // ── Hub: can enter any spoke ───────────────────────────────────────────
    if (from === HUB_POSITION) {
      return SPOKES.map((spoke) => (D <= 5 ? spoke.tiles[5 - D] : spoke.hq));
    }

    // ── Spoke tile: bidirectional along spoke ──────────────────────────────
    const spokeInfo = SPOKE_TILE_MAP.get(from);
    if (spokeInfo !== undefined) {
      const { spokeIndex, tileIndex: idx } = spokeInfo;
      const spoke = SPOKES[spokeIndex];
      const destinations: number[] = [];

      // Toward hub (idx increases)
      if (idx + D <= 4) {
        destinations.push(spoke.tiles[idx + D]);
      } else if (idx + D === 5 && canAccessHub) {
        destinations.push(HUB_POSITION);
      } else if (idx + D > 5) {
        const k = idx + D - 5;
        const oppSpokeIndex = (spokeIndex + 3) % 6;
        destinations.push(SPOKES[oppSpokeIndex].tiles[5 - k]);
      }

      // Toward ring (idx decreases)
      if (idx - D >= 0) {
        destinations.push(spoke.tiles[idx - D]);
      } else if (idx - D === -1) {
        destinations.push(spoke.hq); // exact landing on HQ
      } else {
        // Overshoot past HQ → continue on ring (BR-3a)
        const remaining = D - idx - 1;
        const hq = spoke.hq;
        const fwd =
          ((hq - CIRCULAR_START + remaining) % CIRCULAR_END) + CIRCULAR_START;
        const bwd =
          ((hq - CIRCULAR_START - remaining + CIRCULAR_END) % CIRCULAR_END) +
          CIRCULAR_START;
        destinations.push(fwd);
        if (bwd !== fwd) destinations.push(bwd);
      }

      return [...new Set(destinations)];
    }

    // ── Ring tile (regular or HQ): forward + backward, plus spoke entry if HQ ─
    const forward =
      ((from - CIRCULAR_START + D) % CIRCULAR_END) + CIRCULAR_START;
    const backward =
      ((from -
        CIRCULAR_START -
        D +
        CIRCULAR_END * Math.ceil(D / CIRCULAR_END)) %
        CIRCULAR_END) +
      CIRCULAR_START;

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

    // In-path HQs: player passes through an HQ without stopping → can enter spoke (BR-3b)
    for (const spoke of SPOKES) {
      const distFwd = (spoke.hq - from + CIRCULAR_END) % CIRCULAR_END;
      if (distFwd > 0 && distFwd < D) {
        const remaining = D - distFwd; // always 1..5 (D≤6, distFwd≥1)
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

  isValidPosition(position: number): boolean {
    return (
      Number.isInteger(position) && position >= 0 && position < TOTAL_TILES
    );
  }
}
