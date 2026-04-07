import { Application, Container, Graphics, Ticker } from 'pixi.js';
import type { TileDef, BoardLayout } from '../types';
import { CATEGORY_COLORS, HQ_TILE_RADIUS, TILE_RADIUS } from '../constants';
import { HQ_POSITIONS, SPOKES } from '../board-data';

const CATEGORY_HEX: Record<string, number> = {
  geography: 0x4fc3f7,
  entertainment: 0xf48fb1,
  history: 0xfff176,
  art: 0xce93d8,
  science: 0x81c784,
  sports: 0xffb74d,
};

const CATEGORY_ORDER = ['geography', 'entertainment', 'history', 'art', 'science', 'sports'];

export class BoardRenderer {
  private container: Container;
  private app: Application;
  private tileGraphics: Map<number, Graphics> = new Map();
  private highlightContainer: Container;
  private onTileClickCallback: ((position: number) => void) | null = null;
  private highlightTicker: ((ticker: Ticker) => void) | null = null;

  constructor(app: Application) {
    this.app = app;
    this.container = new Container();
    this.highlightContainer = new Container();
    this.app.stage.addChild(this.container);
    this.app.stage.addChild(this.highlightContainer);
  }

  render(tiles: TileDef[], layout: BoardLayout): void {
    this.container.removeChildren();
    this.tileGraphics.clear();

    const scale = layout.ringRadius / 320;

    this.drawBackground(layout, scale);
    this.drawSectorFills(layout, scale);
    this.drawSpokes(layout, scale);
    this.drawHub(layout, scale);
    this.drawRingTiles(tiles, layout, scale);
    this.drawSpokeTiles(tiles, layout, scale);
  }

  // ── Background ────────────────────────────────────────────────────────────
  private drawBackground(layout: BoardLayout, scale: number): void {
    // Outer dark ring
    const bg = new Graphics();
    bg.circle(layout.centerX, layout.centerY, layout.ringRadius + 52 * scale);
    bg.fill({ color: 0x1a1209 });

    // Inner cream board surface
    bg.circle(layout.centerX, layout.centerY, layout.ringRadius + 38 * scale);
    bg.fill({ color: 0xf5f0dc });

    this.container.addChild(bg);
  }

  // ── Colored sector fan fills ───────────────────────────────────────────────
  private drawSectorFills(layout: BoardLayout, scale: number): void {
    if (!layout.spokes || layout.spokes.length === 0) return;

    const cx = layout.centerX;
    const cy = layout.centerY;
    const outerR = layout.ringRadius + 36 * scale;

    for (const spoke of layout.spokes) {
      const color = CATEGORY_HEX[spoke.category] ?? 0x888888;
      const sector = new Graphics();

      let angleStart = spoke.sectorAngleStart;
      let angleEnd = spoke.sectorAngleEnd;
      if (angleEnd <= angleStart) angleEnd += 2 * Math.PI;

      // Pie sector: center → arc → back
      const steps = 32;
      const pts: number[] = [cx, cy];
      for (let s = 0; s <= steps; s++) {
        const a = angleStart + (s / steps) * (angleEnd - angleStart);
        pts.push(cx + outerR * Math.cos(a), cy + outerR * Math.sin(a));
      }
      sector.poly(pts, true);
      sector.fill({ color, alpha: 0.12 });

      this.container.addChild(sector);
    }
  }

  // ── Colored spoke lines ────────────────────────────────────────────────────
  private drawSpokes(layout: BoardLayout, scale: number): void {
    if (!layout.spokes || layout.spokes.length === 0) {
      // Fallback: plain grey spokes to HQ positions
      const spokes = new Graphics();
      for (const pos of [7, 14, 21, 28, 35, 42]) {
        const tile = layout.tiles[pos];
        if (!tile) continue;
        spokes.moveTo(layout.centerX, layout.centerY);
        spokes.lineTo(tile.x, tile.y);
      }
      spokes.stroke({ color: 0x555555, width: 2 * scale });
      this.container.addChild(spokes);
      return;
    }

    for (const spoke of layout.spokes) {
      const color = CATEGORY_HEX[spoke.category] ?? 0x888888;
      const line = new Graphics();
      line.moveTo(spoke.fromX, spoke.fromY);
      line.lineTo(spoke.toX, spoke.toY);
      line.stroke({ color, width: 5 * scale });
      this.container.addChild(line);

      // Thinner white overlay for sheen
      const sheen = new Graphics();
      sheen.moveTo(spoke.fromX, spoke.fromY);
      sheen.lineTo(spoke.toX, spoke.toY);
      sheen.stroke({ color: 0xffffff, width: 1.5 * scale, alpha: 0.2 });
      this.container.addChild(sheen);
    }
  }

  // ── Hub hexagon ────────────────────────────────────────────────────────────
  private drawHub(layout: BoardLayout, scale: number): void {
    const cx = layout.centerX;
    const cy = layout.centerY;
    const r = layout.hubRadius;

    // Draw 6 colored wedge sectors in the hub (one per category)
    const slices = 6;
    const anglePerSlice = (Math.PI * 2) / slices;

    for (let i = 0; i < slices; i++) {
      const category = CATEGORY_ORDER[i];
      const color = CATEGORY_HEX[category] ?? 0x888888;
      const startAngle = i * anglePerSlice - Math.PI / 2;

      const pts: number[] = [cx, cy];
      const steps = 12;
      for (let s = 0; s <= steps; s++) {
        const a = startAngle + (s / steps) * anglePerSlice;
        pts.push(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }

      const sector = new Graphics();
      sector.poly(pts, true);
      sector.fill({ color });
      this.container.addChild(sector);
    }

    // Hub hexagon border
    const border = new Graphics();
    const hexPts: number[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      hexPts.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    }
    border.poly(hexPts, true);
    border.stroke({ color: 0xffffff, width: 2.5 * scale });
    this.container.addChild(border);

    // Center dot
    const dot = new Graphics();
    dot.circle(cx, cy, 4 * scale);
    dot.fill({ color: 0xffffff });
    this.container.addChild(dot);
  }

  // ── Ring tiles ─────────────────────────────────────────────────────────────
  private drawRingTiles(tiles: TileDef[], layout: BoardLayout, scale: number): void {
    for (let i = 1; i <= 42; i++) {
      const tileDef = tiles.find((t) => t.position === i);
      const tilePos = layout.tiles.find((t) => t.position === i);
      if (!tileDef || !tilePos) continue;

      if (HQ_POSITIONS[i] !== undefined) {
        this.drawHQTile(i, tileDef, tilePos, scale);
      } else {
        this.drawCategoryTile(i, tileDef, tilePos, scale);
      }
    }
  }

  private drawSpokeTiles(tiles: TileDef[], layout: BoardLayout, scale: number): void {
    for (const spoke of SPOKES) {
      for (const pos of spoke.tiles) {
        const tileDef = tiles.find((t) => t.position === pos);
        const tilePos = layout.tiles.find((t) => t.position === pos);
        if (!tileDef || !tilePos) continue;
        this.drawCategoryTile(pos, tileDef, tilePos, scale);
      }
    }
  }

  private drawCategoryTile(index: number, tileDef: TileDef, tilePos: { x: number; y: number }, scale: number): void {
    const radius = TILE_RADIUS * scale;
    let fillColor = 0x888888;
    if (tileDef.category) {
      const hex = CATEGORY_COLORS[tileDef.category];
      fillColor = parseInt(hex.replace('#', ''), 16);
    }

    const g = new Graphics();
    // Tile shadow
    g.circle(tilePos.x + 1 * scale, tilePos.y + 1 * scale, radius);
    g.fill({ color: 0x000000, alpha: 0.3 });
    // Tile fill
    g.circle(tilePos.x, tilePos.y, radius);
    g.fill({ color: fillColor });
    // Tile inner highlight
    g.circle(tilePos.x, tilePos.y, radius);
    g.stroke({ color: 0xffffff, width: 0.8 * scale, alpha: 0.35 });

    this.container.addChild(g);
    this.tileGraphics.set(index, g);
  }

  private drawHQTile(index: number, tileDef: TileDef, tilePos: { x: number; y: number }, scale: number): void {
    const size = HQ_TILE_RADIUS * scale * 1.4; // larger square half-size
    const category = tileDef.category ?? (HQ_POSITIONS[index] as string);
    const fillColor = category ? (CATEGORY_HEX[category] ?? 0x888888) : 0x888888;

    // Build a diamond (rotated square) at tile position
    const pts = [
      tilePos.x,
      tilePos.y - size, // top
      tilePos.x + size,
      tilePos.y, // right
      tilePos.x,
      tilePos.y + size, // bottom
      tilePos.x - size,
      tilePos.y, // left
    ];

    const g = new Graphics();
    // Shadow
    const shadowPts = pts.map((v, idx) => v + (idx % 2 === 0 ? 1.5 * scale : 1.5 * scale));
    g.poly(shadowPts, true);
    g.fill({ color: 0x000000, alpha: 0.35 });

    // Fill
    g.poly(pts, true);
    g.fill({ color: fillColor });

    // Gold border
    g.poly(pts, true);
    g.stroke({ color: 0xffd700, width: 2.5 * scale });

    // Inner white border for contrast
    const innerSize = size * 0.7;
    const innerPts = [
      tilePos.x,
      tilePos.y - innerSize,
      tilePos.x + innerSize,
      tilePos.y,
      tilePos.x,
      tilePos.y + innerSize,
      tilePos.x - innerSize,
      tilePos.y,
    ];
    g.poly(innerPts, true);
    g.stroke({ color: 0xffffff, width: 1 * scale, alpha: 0.6 });

    // Star/wedge label in center using a small star shape
    this.drawStar(g, tilePos.x, tilePos.y, 5 * scale, 2.5 * scale, 5);

    this.container.addChild(g);
    this.tileGraphics.set(index, g);
  }

  /** Draw a simple star polygon at (cx, cy) with outer/inner radius and n points */
  private drawStar(g: Graphics, cx: number, cy: number, outerR: number, innerR: number, points: number): void {
    const pts: number[] = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      pts.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    }
    g.poly(pts, true);
    g.fill({ color: 0xffffff, alpha: 0.85 });
  }

  // ── Tile click / highlights ────────────────────────────────────────────────
  setOnTileClick(callback: (position: number) => void): void {
    this.onTileClickCallback = callback;
  }

  highlightTiles(positions: number[]): void {
    this.clearHighlights();

    const highlights: Graphics[] = [];

    for (const pos of positions) {
      const tileG = this.tileGraphics.get(pos);
      if (!tileG) continue;

      const bounds = tileG.getBounds();
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;
      const radius = Math.max(bounds.width, bounds.height) / 2 + 5;

      const overlay = new Graphics();
      overlay.circle(cx, cy, radius);
      overlay.fill({ color: 0xffffff, alpha: 0.45 });
      overlay.stroke({ color: 0xffffff, width: 2, alpha: 0.9 });
      overlay.eventMode = 'static';
      overlay.cursor = 'pointer';

      const capturedPos = pos;
      overlay.on('pointerdown', () => {
        if (this.onTileClickCallback) {
          this.onTileClickCallback(capturedPos);
        }
      });

      this.highlightContainer.addChild(overlay);
      highlights.push(overlay);
    }

    // Pulsing animation
    let elapsed = 0;
    const tickerFn = (ticker: Ticker) => {
      elapsed += ticker.deltaMS;
      const alpha = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin((elapsed / 1000) * Math.PI * 2));
      for (const h of highlights) {
        h.alpha = alpha;
      }
    };

    this.highlightTicker = tickerFn;
    this.app.ticker.add(tickerFn);
  }

  clearHighlights(): void {
    this.highlightContainer.removeChildren();
    if (this.highlightTicker) {
      this.app.ticker.remove(this.highlightTicker);
      this.highlightTicker = null;
    }
  }

  destroy(): void {
    this.clearHighlights();
    this.highlightContainer.destroy({ children: true });
    this.container.destroy({ children: true });
  }
}
