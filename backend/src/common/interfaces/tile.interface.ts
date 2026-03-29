import { Category, TileType } from '../enums';

export interface Tile {
  position: number;
  type: TileType;
  category: Category | null;
}
