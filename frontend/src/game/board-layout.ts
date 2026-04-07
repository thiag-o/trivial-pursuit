import type { BoardLayout, SpokeDef, TileLayout } from './types';
import type { Category } from './types';
import { RING_RADIUS, HUB_RADIUS, TILE_RADIUS } from './constants';
import { HQ_POSITIONS, SPOKES } from './board-data';

export function calculateBoardLayout(canvasSize: number): BoardLayout {
  const center = canvasSize / 2;
  const scale = canvasSize / 800;
  const ringRadius = RING_RADIUS * scale;
  const tileRadius = TILE_RADIUS * scale;
  const hubRadius = HUB_RADIUS * scale;

  const tiles: TileLayout[] = [];

  // Tile 0: hub at center
  tiles.push({ position: 0, x: center, y: center });

  // Tiles 1–42: evenly distributed on circle, starting at top (-90°)
  const RING_SIZE = 42;
  const angleStep = (2 * Math.PI) / RING_SIZE;
  for (let i = 1; i <= RING_SIZE; i++) {
    const angle = -Math.PI / 2 + (i - 1) * angleStep;
    tiles.push({
      position: i,
      x: center + ringRadius * Math.cos(angle),
      y: center + ringRadius * Math.sin(angle),
    });
  }

  // Spoke tiles (positions 43–72): linearly interpolated between HQ and center
  for (const spoke of SPOKES) {
    const hqTile = tiles[spoke.hq];
    for (let t = 0; t < spoke.tiles.length; t++) {
      // frac: 1/6 (adjacent to HQ) … 5/6 (adjacent to hub)
      const frac = (t + 1) / (spoke.tiles.length + 1);
      tiles.push({
        position: spoke.tiles[t],
        x: hqTile.x + (center - hqTile.x) * frac,
        y: hqTile.y + (center - hqTile.y) * frac,
      });
    }
  }

  // Build spoke definitions for each HQ position
  const hqEntries = Object.entries(HQ_POSITIONS) as [string, Category][];
  hqEntries.sort((a, b) => Number(a[0]) - Number(b[0]));

  const spokes: SpokeDef[] = hqEntries.map(([posStr, category], idx) => {
    const hqPosition = Number(posStr);
    const hqTile = tiles[hqPosition];
    const spokeAngle = -Math.PI / 2 + (hqPosition - 1) * angleStep;
    const prevIdx = (idx - 1 + hqEntries.length) % hqEntries.length;
    const nextIdx = (idx + 1) % hqEntries.length;
    const prevHqPos = Number(hqEntries[prevIdx][0]);
    const nextHqPos = Number(hqEntries[nextIdx][0]);
    const prevAngle = -Math.PI / 2 + (prevHqPos - 1) * angleStep;
    const nextAngle = -Math.PI / 2 + (nextHqPos - 1) * angleStep;
    const sectorAngleStart = (spokeAngle + prevAngle) / 2;
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
