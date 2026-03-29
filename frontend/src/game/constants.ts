import type { Category, PlayerColor } from './types';

export const CATEGORY_COLORS: Record<Category, string> = {
  geography: '#4FC3F7',
  entertainment: '#F48FB1',
  history: '#FFF176',
  art: '#CE93D8',
  science: '#81C784',
  sports: '#FFB74D',
};

export const PLAYER_COLORS: Record<PlayerColor, string> = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#EAB308',
  purple: '#A855F7',
  orange: '#F97316',
};

export const PLAYER_COLOR_LIST: PlayerColor[] = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
];

export const CANVAS_SIZE = 800;
export const RING_RADIUS = 320;
export const HUB_RADIUS = 60;
export const TILE_RADIUS = 14;
export const HQ_TILE_RADIUS = 17;
export const TOKEN_RADIUS = 8;
