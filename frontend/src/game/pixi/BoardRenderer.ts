import { Application, Container, Graphics } from 'pixi.js';
import type { TileDef, BoardLayout } from '../types';
import { CATEGORY_COLORS, HQ_TILE_RADIUS, TILE_RADIUS } from '../constants';
import { HQ_POSITIONS, ROLL_AGAIN_POSITIONS } from '../board-data';

export class BoardRenderer {
  private container: Container;
  private app: Application;

  constructor(app: Application) {
    this.app = app;
    this.container = new Container();
    this.app.stage.addChild(this.container);
  }

  render(tiles: TileDef[], layout: BoardLayout): void {
    this.container.removeChildren();

    const scale = layout.ringRadius / 320;

    this.drawBackground(layout, scale);
    this.drawSpokes(layout, scale);
    this.drawHub(layout, scale);
    this.drawRingTiles(tiles, layout, scale);
  }

  private drawBackground(layout: BoardLayout, scale: number): void {
    const bg = new Graphics();
    bg.circle(layout.centerX, layout.centerY, layout.ringRadius + 40 * scale);
    bg.fill({ color: 0x2d2d2d });
    this.container.addChild(bg);
  }

  private drawSpokes(layout: BoardLayout, scale: number): void {
    const spokes = new Graphics();
    const hqPositions = [5, 10, 15, 20, 25, 30];

    for (const pos of hqPositions) {
      const tile = layout.tiles[pos];
      if (!tile) continue;
      spokes.moveTo(layout.centerX, layout.centerY);
      spokes.lineTo(tile.x, tile.y);
    }
    spokes.stroke({ color: 0x555555, width: 2 * scale });
    this.container.addChild(spokes);
  }

  private drawHub(layout: BoardLayout, scale: number): void {
    const hub = new Graphics();
    const r = layout.hubRadius;
    const cx = layout.centerX;
    const cy = layout.centerY;

    // Hexagon vertices
    const points: number[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      points.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    }

    hub.poly(points, true);
    hub.fill({ color: 0xe0e0e0 });
    hub.stroke({ color: 0x333333, width: 2 * scale });
    this.container.addChild(hub);
  }

  private drawRingTiles(tiles: TileDef[], layout: BoardLayout, scale: number): void {
    for (let i = 1; i <= 72; i++) {
      const tileDef = tiles[i];
      const tilePos = layout.tiles[i];
      if (!tileDef || !tilePos) continue;

      const g = new Graphics();
      const isHQ = HQ_POSITIONS[i] !== undefined;
      const isRollAgain = ROLL_AGAIN_POSITIONS.has(i);
      const radius = (isHQ ? HQ_TILE_RADIUS : TILE_RADIUS) * scale;

      // Tile fill color
      let fillColor = 0x888888;
      if (tileDef.category) {
        const hex = CATEGORY_COLORS[tileDef.category];
        fillColor = parseInt(hex.replace('#', ''), 16);
      }

      g.circle(tilePos.x, tilePos.y, radius);
      g.fill({ color: fillColor });

      // HQ: gold border
      if (isHQ) {
        g.circle(tilePos.x, tilePos.y, radius);
        g.stroke({ color: 0xffd700, width: 2 * scale });
      }

      // Roll Again: inner ring indicator
      if (isRollAgain) {
        g.circle(tilePos.x, tilePos.y, radius * 0.55);
        g.stroke({ color: 0xffffff, width: 1.5 * scale, alpha: 0.7 });
      }

      this.container.addChild(g);
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
