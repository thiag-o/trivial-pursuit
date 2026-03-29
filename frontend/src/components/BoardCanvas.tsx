import { useEffect, useRef } from 'react';
import type { PlayerToken } from '../game/types';
import { usePixiApp } from '../game/pixi/usePixiApp';
import { BoardRenderer } from '../game/pixi/BoardRenderer';
import { TokenRenderer } from '../game/pixi/TokenRenderer';
import { BOARD_TILES } from '../game/board-data';
import { calculateBoardLayout } from '../game/board-layout';
import { CANVAS_SIZE } from '../game/constants';

interface BoardCanvasProps {
  players: PlayerToken[];
}

export default function BoardCanvas({ players }: BoardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { app, error } = usePixiApp(containerRef);
  const renderersRef = useRef<{
    board: BoardRenderer;
    tokens: TokenRenderer;
  } | null>(null);

  useEffect(() => {
    if (!app) return;

    const layout = calculateBoardLayout(CANVAS_SIZE);

    const board = new BoardRenderer(app);
    board.render(BOARD_TILES, layout);

    const tokens = new TokenRenderer(app);
    tokens.renderTokens(players, layout);

    renderersRef.current = { board, tokens };

    return () => {
      renderersRef.current?.board.destroy();
      renderersRef.current?.tokens.destroy();
      renderersRef.current = null;
    };
  }, [app, players]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-red-400 p-8 text-center">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden"
      style={{ aspectRatio: '1' }}
    />
  );
}
