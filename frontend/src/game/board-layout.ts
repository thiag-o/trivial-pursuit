import type { BoardLayout, SpokeDef, TileLayout } from './types';
import type { Category } from './types';
import { RING_RADIUS, HUB_RADIUS, TILE_RADIUS } from './constants';
import { HQ_POSITIONS } from './board-data';

export function calculateBoardLayout(canvasSize: number): BoardLayout {
  const center = canvasSize / 2;
  const scale = canvasSize / 800;
  const ringRadius = RING_RADIUS * scale;
  const tileRadius = TILE_RADIUS * scale;
  const hubRadius = HUB_RADIUS * scale;

  const tiles: TileLayout[] = [];

  // Tile 0: hub at center
  tiles.push({ position: 0, x: center, y: center });

  // Tiles 1-72: evenly distributed on circle, starting at top (-90°)
  const angleStep = (2 * Math.PI) / 72;
  for (let i = 1; i <= 72; i++) {
    const angle = -Math.PI / 2 + (i - 1) * angleStep;
    tiles.push({
      position: i,
      x: center + ringRadius * Math.cos(angle),
      y: center + ringRadius * Math.sin(angle),
    });
  }

  // Build spoke definitions for each HQ position
  const hqEntries = Object.entries(HQ_POSITIONS) as [string, Category][];
  // Sort by position so sectors are ordered
  hqEntries.sort((a, b) => Number(a[0]) - Number(b[0]));

  const spokes: SpokeDef[] = hqEntries.map(([posStr, category], idx) => {
    const hqPosition = Number(posStr);
    const hqTile = tiles[hqPosition];
    // Angle from center to HQ tile
    const spokeAngle = -Math.PI / 2 + (hqPosition - 1) * angleStep;
    // Sector spans from midpoint between previous spoke to midpoint between next spoke
    const prevIdx = (idx - 1 + hqEntries.length) % hqEntries.length;
    const nextIdx = (idx + 1) % hqEntries.length;
    const prevHqPos = Number(hqEntries[prevIdx][0]);
    const nextHqPos = Number(hqEntries[nextIdx][0]);
    const prevAngle = -Math.PI / 2 + (prevHqPos - 1) * angleStep;
    const nextAngle = -Math.PI / 2 + (nextHqPos - 1) * angleStep;
    const sectorAngleStart = (spokeAngle + prevAngle) / 2;
    // Wrap: next sector angle might be "less than" current if it wraps around circle
    let sectorAngleEnd = (spokeAngle + nextAngle) / 2;
    if (sectorAngleEnd <= sectorAngleStart) {
      sectorAngleEnd += 2 * Math.PI;
    }

    return {
      hqPosition,
      category,
      fromX: center,
      fromY: center,
      toX: hqTile?.x ?? center,
      toY: hqTile?.y ?? center,
      sectorAngleStart,
      sectorAngleEnd,
    };
  });

  return {
    centerX: center,
    centerY: center,
    ringRadius,
    tileRadius,
    hubRadius,
    tiles,
    spokes,
  };
}
