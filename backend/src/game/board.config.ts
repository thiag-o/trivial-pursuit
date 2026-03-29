import { Injectable } from '@nestjs/common';
import { Category, TileType } from '../common/enums';
import { Tile } from '../common/interfaces';

const TOTAL_TILES = 73;
const HUB_POSITION = 0;
const CIRCULAR_START = 1;
const CIRCULAR_END = 72;

const HQ_POSITIONS: Record<number, Category> = {
  5: Category.GEOGRAPHY,
  10: Category.ENTERTAINMENT,
  15: Category.HISTORY,
  20: Category.ART,
  25: Category.SCIENCE,
  30: Category.SPORTS,
};

const ROLL_AGAIN_POSITIONS = new Set([
  3, 9, 14, 19, 24, 29, 35, 41, 47, 53, 59, 65,
]);

const CATEGORY_CYCLE: Category[] = [
  Category.GEOGRAPHY,
  Category.ENTERTAINMENT,
  Category.HISTORY,
  Category.ART,
  Category.SCIENCE,
  Category.SPORTS,
];

function buildTiles(): Tile[] {
  const tiles: Tile[] = [];

  tiles.push({ position: 0, type: TileType.HUB, category: null });

  for (let i = CIRCULAR_START; i <= CIRCULAR_END; i++) {
    if (HQ_POSITIONS[i] !== undefined) {
      tiles.push({ position: i, type: TileType.HQ, category: HQ_POSITIONS[i] });
    } else if (ROLL_AGAIN_POSITIONS.has(i)) {
      tiles.push({ position: i, type: TileType.ROLL_AGAIN, category: null });
    } else {
      const category = CATEGORY_CYCLE[(i - 1) % CATEGORY_CYCLE.length];
      tiles.push({ position: i, type: TileType.CATEGORY, category });
    }
  }

  return tiles;
}

@Injectable()
export class BoardConfig {
  private readonly tiles: Tile[] = buildTiles();

  getTile(position: number): Tile {
    return this.tiles[position];
  }

  getValidDestinations(from: number, diceValue: number): number[] {
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

    // Deduplicate (e.g., rolling 36 on a 72-tile ring)
    return [...new Set(destinations)];
  }

  isValidPosition(position: number): boolean {
    return (
      Number.isInteger(position) && position >= 0 && position < TOTAL_TILES
    );
  }
}
