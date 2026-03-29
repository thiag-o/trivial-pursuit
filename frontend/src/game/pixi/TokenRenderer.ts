import { Application, Container, Graphics } from 'pixi.js';
import type { PlayerToken, BoardLayout } from '../types';
import { PLAYER_COLORS, TOKEN_RADIUS } from '../constants';

export class TokenRenderer {
  private container: Container;
  private app: Application;

  constructor(app: Application) {
    this.app = app;
    this.container = new Container();
    this.app.stage.addChild(this.container);
  }

  renderTokens(players: PlayerToken[], layout: BoardLayout): void {
    this.container.removeChildren();
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
      }
    }
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
