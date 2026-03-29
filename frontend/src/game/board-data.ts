import type { Category, TileDef } from './types';

const CATEGORY_CYCLE: Category[] = [
  'geography',
  'entertainment',
  'history',
  'art',
  'science',
  'sports',
];

export const HQ_POSITIONS: Record<number, Category> = {
  5: 'geography',
  10: 'entertainment',
  15: 'history',
  20: 'art',
  25: 'science',
  30: 'sports',
};

export const ROLL_AGAIN_POSITIONS = new Set([
  3, 9, 14, 19, 24, 29, 35, 41, 47, 53, 59, 65,
]);

function buildTiles(): TileDef[] {
  const tiles: TileDef[] = [];

  tiles.push({ position: 0, type: 'hub', category: null });

  for (let i = 1; i <= 72; i++) {
    if (HQ_POSITIONS[i] !== undefined) {
      tiles.push({ position: i, type: 'hq', category: HQ_POSITIONS[i] });
    } else if (ROLL_AGAIN_POSITIONS.has(i)) {
      tiles.push({ position: i, type: 'rollAgain', category: null });
    } else {
      const category = CATEGORY_CYCLE[(i - 1) % CATEGORY_CYCLE.length];
      tiles.push({ position: i, type: 'category', category });
    }
  }

  return tiles;
}

export const BOARD_TILES: TileDef[] = buildTiles();
