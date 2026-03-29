export type TileType = 'hub' | 'category' | 'hq' | 'rollAgain';

export type Category =
  | 'geography'
  | 'entertainment'
  | 'history'
  | 'art'
  | 'science'
  | 'sports';

export interface TileDef {
  position: number;
  type: TileType;
  category: Category | null;
}

export type PlayerColor =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange';

export interface PlayerToken {
  nickname: string;
  position: number;
  color: PlayerColor;
  isHuman: boolean;
}

export interface TileLayout {
  position: number;
  x: number;
  y: number;
}

export interface BoardLayout {
  centerX: number;
  centerY: number;
  ringRadius: number;
  tileRadius: number;
  hubRadius: number;
  tiles: TileLayout[];
}
