import type { Category } from '../game/types';
import { CATEGORY_COLORS, CATEGORY_NAMES } from '../game/constants';

interface DefeatScreenProps {
  winnerNickname: string;
  winnerWedges: string[];
  onPlayAgain: () => void;
}

export default function DefeatScreen({
  winnerNickname,
  winnerWedges,
  onPlayAgain,
}: DefeatScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="flex flex-col items-center gap-6 rounded-2xl bg-gray-800 px-10 py-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-red-400">
          {winnerNickname} venceu a partida!
        </h1>

        <div className="flex gap-3">
          {winnerWedges.map((wedge) => {
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
          className="rounded-lg bg-gray-600 px-6 py-3 text-lg font-bold text-white transition-colors hover:bg-gray-500"
        >
          Jogar Novamente
        </button>
      </div>
    </div>
  );
}
