import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import type { PlayerToken, BoardLayout } from '../game/types';
import { usePixiApp } from '../game/pixi/usePixiApp';
import { BoardRenderer } from '../game/pixi/BoardRenderer';
import { TokenRenderer } from '../game/pixi/TokenRenderer';
import { BOARD_TILES } from '../game/board-data';
import { calculateBoardLayout } from '../game/board-layout';
import { CANVAS_SIZE } from '../game/constants';

interface BoardCanvasProps {
  players: PlayerToken[];
  onTileClick?: (position: number) => void;
  validDestinations?: number[];
}

export interface BoardCanvasHandle {
  animateToken: (
    nickname: string,
    fromPos: number,
    toPos: number,
    onComplete: () => void,
  ) => void;
}

const BoardCanvas = forwardRef<BoardCanvasHandle, BoardCanvasProps>(
  function BoardCanvas({ players, onTileClick, validDestinations }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { app, error } = usePixiApp(containerRef);
    const renderersRef = useRef<{
      board: BoardRenderer;
      tokens: TokenRenderer;
      layout: BoardLayout;
    } | null>(null);

    useEffect(() => {
      if (!app) return;

      const layout = calculateBoardLayout(CANVAS_SIZE);

      const board = new BoardRenderer(app);
      board.render(BOARD_TILES, layout);

      const tokens = new TokenRenderer(app);
      tokens.renderTokens(players, layout);

      renderersRef.current = { board, tokens, layout };

      return () => {
        renderersRef.current?.board.destroy();
        renderersRef.current?.tokens.destroy();
        renderersRef.current = null;
      };
    }, [app, players]);

    // Wire tile click callback
    useEffect(() => {
      if (!renderersRef.current) return;
      if (onTileClick) {
        renderersRef.current.board.setOnTileClick(onTileClick);
      }
    }, [onTileClick]);

    // Wire highlight tiles
    useEffect(() => {
      if (!renderersRef.current) return;
      if (validDestinations && validDestinations.length > 0) {
        renderersRef.current.board.highlightTiles(validDestinations);
      } else {
        renderersRef.current.board.clearHighlights();
      }
    }, [validDestinations]);

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      animateToken(
        nickname: string,
        fromPos: number,
        toPos: number,
        onComplete: () => void,
      ) {
        if (!renderersRef.current) {
          onComplete();
          return;
        }
        renderersRef.current.tokens.animateToken(
          nickname,
          fromPos,
          toPos,
          renderersRef.current.layout,
          onComplete,
        );
      },
    }));

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
  },
);

export default BoardCanvas;
