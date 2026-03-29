import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getNickname } from '../services/auth';
import ColorPicker from '../components/ColorPicker';
import BoardCanvas from '../components/BoardCanvas';
import GameHUD from '../components/GameHUD';
import type { PlayerColor, PlayerToken } from '../game/types';
import { PLAYER_COLOR_LIST } from '../game/constants';

interface GameStatePlayer {
  nickname: string;
  position: number;
  isHuman: boolean;
}

interface GameState {
  gameId: string;
  players: GameStatePlayer[];
  currentPlayerNickname: string;
}

export default function GamePage() {
  const location = useLocation();
  const gameState = location.state as GameState | null;
  const humanNickname = getNickname() ?? '';
  const [selectedColor, setSelectedColor] = useState<PlayerColor | null>(null);

  if (!gameState) {
    return <Navigate to="/start" replace />;
  }

  function handleColorSelect(color: PlayerColor) {
    setSelectedColor(color);
  }

  if (!selectedColor) {
    return <ColorPicker onSelect={handleColorSelect} />;
  }

  // Build PlayerToken[] with color assignments
  const availableColors = PLAYER_COLOR_LIST.filter((c) => c !== selectedColor);
  let colorIndex = 0;

  const players: PlayerToken[] = gameState.players.map((p) => {
    if (p.isHuman) {
      return { ...p, color: selectedColor, isHuman: true };
    }
    const color = availableColors[colorIndex % availableColors.length];
    colorIndex++;
    return { ...p, color, isHuman: false };
  });

  const currentPlayerNickname =
    gameState.currentPlayerNickname ?? gameState.players[0]?.nickname ?? '';

  return (
    <div className="flex h-screen bg-gray-900 p-4 gap-4">
      <div className="flex-[3] flex items-center justify-center">
        <BoardCanvas players={players} />
      </div>
      <div className="flex-1 min-w-[240px]">
        <GameHUD
          players={players}
          currentPlayerNickname={currentPlayerNickname}
          humanNickname={humanNickname}
        />
      </div>
    </div>
  );
}
