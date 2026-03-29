import type { BoardLayout, TileLayout } from './types';
import { RING_RADIUS, HUB_RADIUS, TILE_RADIUS } from './constants';

export function calculateBoardLayout(canvasSize: number): BoardLayout {
  const center = canvasSize / 2;
  const scale = canvasSize / 800;
  const ringRadius = RING_RADIUS * scale;
  const tileRadius = TILE_RADIUS * scale;
  const hubRadius = HUB_RADIUS * scale;

  const tiles: TileLayout[] = [];

  // Tile 0: hub at center
  tiles.push({ position: 0, x: center, y: center });

  // Tiles 1-72: evenly distributed on circle
  const angleStep = (2 * Math.PI) / 72;
  for (let i = 1; i <= 72; i++) {
    const angle = -Math.PI / 2 + (i - 1) * angleStep;
    tiles.push({
      position: i,
      x: center + ringRadius * Math.cos(angle),
      y: center + ringRadius * Math.sin(angle),
    });
  }

  return {
    centerX: center,
    centerY: center,
    ringRadius,
    tileRadius,
    hubRadius,
    tiles,
  };
}
