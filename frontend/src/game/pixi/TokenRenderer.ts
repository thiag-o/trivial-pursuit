import { Application, Container, Graphics, Ticker } from 'pixi.js';
import type { PlayerToken, BoardLayout } from '../types';
import { PLAYER_COLORS, TOKEN_RADIUS } from '../constants';

const WEDGE_COLORS: Record<string, number> = {
  geography: 0x4fc3f7,
  entertainment: 0xf48fb1,
  history: 0xfff176,
  art: 0xce93d8,
  science: 0x81c784,
  sports: 0xffb74d,
};

const CATEGORY_ORDER = ['geography', 'entertainment', 'history', 'art', 'science', 'sports'];

export class TokenRenderer {
  private container: Container;
  private app: Application;
  private tokenGraphics: Map<string, Graphics> = new Map();

  constructor(app: Application) {
    this.app = app;
    this.container = new Container();
    this.app.stage.addChild(this.container);
  }

  renderTokens(players: PlayerToken[], layout: BoardLayout): void {
    this.container.removeChildren();
    this.tokenGraphics.clear();
    const scale = layout.ringRadius / 320;
    const hexRadius = TOKEN_RADIUS * scale;

    // Group players by position for overlap offset
    const groups = new Map<number, PlayerToken[]>();
    for (const p of players) {
      const arr = groups.get(p.position) ?? [];
      arr.push(p);
      groups.set(p.position, arr);
    }

    for (const [position, group] of groups) {
      const tileLayout = layout.tiles[position];
      if (!tileLayout) continue;

      const offsets = this.getOffsets(group.length, hexRadius);

      for (let i = 0; i < group.length; i++) {
        const player = group[i];
        const offset = offsets[i];

        const g = new Graphics();
        // Position the container at the tile location + offset
        // All drawing is done at local origin (0, 0) so animation works correctly
        g.x = tileLayout.x + offset.dx;
        g.y = tileLayout.y + offset.dy;

        this.drawHexToken(g, player, hexRadius, scale);

        this.container.addChild(g);
        this.tokenGraphics.set(player.nickname, g);
      }
    }
  }

  private drawHexToken(g: Graphics, player: PlayerToken, hexRadius: number, scale: number): void {
    const slices = CATEGORY_ORDER.length; // 6
    const anglePerSlice = (Math.PI * 2) / slices;
    const innerRadius = hexRadius * 0.25; // small center gap

    // Draw 6 wedge sectors at local origin (0, 0)
    for (let i = 0; i < slices; i++) {
      const category = CATEGORY_ORDER[i];
      const isEarned = player.wedges.includes(category);
      const fillColor = isEarned ? (WEDGE_COLORS[category] ?? 0x444444) : 0x222222;

      const startAngle = i * anglePerSlice - Math.PI / 2;
      const endAngle = startAngle + anglePerSlice;

      // Build wedge as polygon with arc approximation
      const pts: number[] = [innerRadius * Math.cos(startAngle), innerRadius * Math.sin(startAngle)];
      const steps = 8;
      for (let s = 0; s <= steps; s++) {
        const a = startAngle + (s / steps) * anglePerSlice;
        pts.push(hexRadius * Math.cos(a), hexRadius * Math.sin(a));
      }
      pts.push(innerRadius * Math.cos(endAngle), innerRadius * Math.sin(endAngle));

      g.poly(pts, false);
      g.fill({ color: fillColor });
    }

    // Draw thin dividers between wedges
    for (let i = 0; i < slices; i++) {
      const angle = i * anglePerSlice - Math.PI / 2;
      g.moveTo(innerRadius * Math.cos(angle), innerRadius * Math.sin(angle));
      g.lineTo(hexRadius * Math.cos(angle), hexRadius * Math.sin(angle));
      g.stroke({ color: 0x000000, width: 0.5 * scale });
    }

    // Outer hexagon border in player color
    const hexColor = PLAYER_COLORS[player.color];
    const color = parseInt(hexColor.replace('#', ''), 16);
    const hexPts: number[] = [];
    for (let i = 0; i < slices; i++) {
      const angle = i * anglePerSlice - Math.PI / 2;
      hexPts.push(hexRadius * Math.cos(angle), hexRadius * Math.sin(angle));
    }
    g.poly(hexPts, true);
    g.stroke({ color, width: 2 * scale });

    // Bright dot in center
    g.circle(0, 0, innerRadius * 0.8);
    g.fill({ color: color });
  }

  animateToken(nickname: string, fromPos: number, toPos: number, layout: BoardLayout, onComplete: () => void): void {
    const g = this.tokenGraphics.get(nickname);
    if (!g) {
      onComplete();
      return;
    }

    const fromTile = layout.tiles[fromPos];
    const toTile = layout.tiles[toPos];
    if (!fromTile || !toTile) {
      onComplete();
      return;
    }

    // Bring to front
    const parent = g.parent;
    if (parent) {
      parent.removeChild(g);
      parent.addChild(g);
    }

    // g.x / g.y are now the container position (correct starting position)
    const startX = g.x;
    const startY = g.y;
    const dx = toTile.x - fromTile.x;
    const dy = toTile.y - fromTile.y;
    const duration = 500;
    let elapsed = 0;

    const tickerFn = (ticker: Ticker) => {
      if (g.destroyed) {
        this.app.ticker.remove(tickerFn);
        onComplete();
        return;
      }

      elapsed += ticker.deltaMS;
      const t = Math.min(elapsed / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease-in-out

      g.x = startX + dx * ease;
      g.y = startY + dy * ease;

      if (t >= 1) {
        this.app.ticker.remove(tickerFn);
        onComplete();
      }
    };

    this.app.ticker.add(tickerFn);
  }

  updateTokenPositions(players: PlayerToken[], layout: BoardLayout): void {
    this.renderTokens(players, layout);
  }

  private getOffsets(count: number, radius: number): { dx: number; dy: number }[] {
    if (count === 1) return [{ dx: 0, dy: 0 }];

    const spacing = radius * 1.8;

    if (count === 2) {
      return [
        { dx: -spacing, dy: 0 },
        { dx: spacing, dy: 0 },
      ];
    }

    if (count === 3) {
      return [
        { dx: 0, dy: -spacing },
        { dx: -spacing, dy: spacing * 0.7 },
        { dx: spacing, dy: spacing * 0.7 },
      ];
    }

    // 4+ tokens: circular distribution
    const offsets: { dx: number; dy: number }[] = [];
    const angleStep = (2 * Math.PI) / count;
    for (let i = 0; i < count; i++) {
      const angle = angleStep * i - Math.PI / 2;
      offsets.push({
        dx: spacing * Math.cos(angle),
        dy: spacing * Math.sin(angle),
      });
    }
    return offsets;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
