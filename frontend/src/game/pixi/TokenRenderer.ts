import { Application, Container, Graphics, Ticker } from 'pixi.js';
import type { PlayerToken, BoardLayout } from '../types';
import { PLAYER_COLORS, TOKEN_RADIUS } from '../constants';

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
    const radius = TOKEN_RADIUS * scale;

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

      const offsets = this.getOffsets(group.length, radius);

      for (let i = 0; i < group.length; i++) {
        const player = group[i];
        const offset = offsets[i];
        const hexColor = PLAYER_COLORS[player.color];
        const color = parseInt(hexColor.replace('#', ''), 16);

        const g = new Graphics();
        const x = tileLayout.x + offset.dx;
        const y = tileLayout.y + offset.dy;

        g.circle(x, y, radius);
        g.fill({ color });

        // Human player: white border
        if (player.isHuman) {
          g.circle(x, y, radius);
          g.stroke({ color: 0xffffff, width: 2 * scale });
        }

        this.container.addChild(g);
        this.tokenGraphics.set(player.nickname, g);
      }
    }
  }

  animateToken(
    nickname: string,
    fromPos: number,
    toPos: number,
    layout: BoardLayout,
    onComplete: () => void,
  ): void {
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

    const startX = g.x;
    const startY = g.y;
    const dx = (toTile.x - fromTile.x);
    const dy = (toTile.y - fromTile.y);
    const duration = 500;
    let elapsed = 0;

    const tickerFn = (ticker: Ticker) => {
      elapsed += ticker.deltaMS;
      const t = Math.min(elapsed / duration, 1);

      g.x = startX + dx * t;
      g.y = startY + dy * t;

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

    const spacing = radius * 1.5;

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
