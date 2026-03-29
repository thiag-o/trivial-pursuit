import type { PlayerToken } from '../game/types';
import { PLAYER_COLORS, CATEGORY_COLORS } from '../game/constants';
import type { Category } from '../game/types';

const CATEGORY_NAMES: Record<Category, string> = {
  geography: 'Geografia',
  entertainment: 'Entretenimento',
  history: 'História',
  art: 'Arte',
  science: 'Ciência',
  sports: 'Esportes',
};

interface GameHUDProps {
  players: PlayerToken[];
  currentPlayerNickname: string;
  humanNickname: string;
}

export default function GameHUD({
  players,
  currentPlayerNickname,
  humanNickname,
}: GameHUDProps) {
  return (
    <div className="flex flex-col gap-6 p-4 bg-gray-800 rounded-2xl h-full overflow-y-auto">
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
          Você
        </p>
        <p className="text-white font-bold text-lg">{humanNickname}</p>
      </div>

      <div>
        <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">
          Jogadores
        </p>
        <ul className="space-y-2">
          {players.map((p) => (
            <li key={p.nickname} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: PLAYER_COLORS[p.color] }}
              />
              <span
                className={`text-sm ${
                  p.nickname === currentPlayerNickname
                    ? 'text-white font-semibold'
                    : 'text-gray-300'
                }`}
              >
                {p.nickname}
                {p.nickname === currentPlayerNickname && ' ◀'}
                {p.isHuman && ' (você)'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">
          Categorias
        </p>
        <ul className="space-y-1">
          {(Object.keys(CATEGORY_COLORS) as Category[]).map((cat) => (
            <li key={cat} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[cat] }}
              />
              <span className="text-gray-300 text-xs">
                {CATEGORY_NAMES[cat]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
