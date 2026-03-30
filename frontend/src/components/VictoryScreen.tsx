import type { Category } from '../game/types';
import { CATEGORY_COLORS, CATEGORY_NAMES } from '../game/constants';

interface VictoryScreenProps {
  nickname: string;
  wedges: string[];
  onPlayAgain: () => void;
}

export default function VictoryScreen({ nickname, wedges, onPlayAgain }: VictoryScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="flex flex-col items-center gap-6 rounded-2xl bg-gray-800 px-10 py-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-yellow-300">🏆 Parabéns, {nickname}! Você venceu!</h1>

        <div className="flex gap-3">
          {wedges.map((wedge) => {
            const color = CATEGORY_COLORS[wedge as Category] ?? '#6B7280';
            const name = CATEGORY_NAMES[wedge as Category] ?? wedge;
            return (
              <div
                key={wedge}
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: color }}
                title={name}
              />
            );
          })}
        </div>

        <button
          onClick={onPlayAgain}
          className="rounded-lg bg-yellow-500 px-6 py-3 text-lg font-bold text-gray-900 transition-colors hover:bg-yellow-400"
        >
          Jogar Novamente
        </button>
      </div>
    </div>
  );
}
