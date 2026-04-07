import type { Category, TileDef } from './types';

const CATEGORY_CYCLE: Category[] = ['geography', 'entertainment', 'history', 'art', 'science', 'sports'];

export const HQ_POSITIONS: Record<number, Category> = {
  7: 'geography',
  14: 'entertainment',
  21: 'history',
  28: 'art',
  35: 'science',
  42: 'sports',
};

// Spoke definitions: tiles[0] adjacent to HQ, tiles[4] adjacent to hub
export const SPOKES: Array<{ hq: number; tiles: number[]; category: Category }> = [
  { hq: 7, tiles: [43, 44, 45, 46, 47], category: 'geography' },
  { hq: 14, tiles: [48, 49, 50, 51, 52], category: 'entertainment' },
  { hq: 21, tiles: [53, 54, 55, 56, 57], category: 'history' },
  { hq: 28, tiles: [58, 59, 60, 61, 62], category: 'art' },
  { hq: 35, tiles: [63, 64, 65, 66, 67], category: 'science' },
  { hq: 42, tiles: [68, 69, 70, 71, 72], category: 'sports' },
];

function buildTiles(): TileDef[] {
  const tiles: TileDef[] = [];

  tiles.push({ position: 0, type: 'hub', category: null });

  for (let i = 1; i <= 42; i++) {
    if (HQ_POSITIONS[i] !== undefined) {
      tiles.push({ position: i, type: 'hq', category: HQ_POSITIONS[i] });
    } else {
      const category = CATEGORY_CYCLE[(i - 1) % CATEGORY_CYCLE.length];
      tiles.push({ position: i, type: 'category', category });
    }
  }

  // Spoke tiles (positions 43–72) — rotating category pattern, not all same as HQ (BR-1)
  for (let s = 0; s < SPOKES.length; s++) {
    const spoke = SPOKES[s];
    spoke.tiles.forEach((pos, tileIndex) => {
      const category = CATEGORY_CYCLE[(s + tileIndex + 1) % CATEGORY_CYCLE.length];
      tiles.push({ position: pos, type: 'category', category });
    });
  }

  return tiles;
}

export const BOARD_TILES: TileDef[] = buildTiles();
