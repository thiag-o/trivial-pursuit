import type { PlayerToken, TurnPhase, Category } from '../game/types';
import { PLAYER_COLORS, CATEGORY_COLORS, CATEGORY_NAMES } from '../game/constants';

const ALL_CATEGORIES = Object.keys(CATEGORY_COLORS) as Category[];

function TurnPhaseBadge({
  turnPhase,
  diceValue,
}: {
  turnPhase?: TurnPhase;
  diceValue?: number | null;
}) {
  if (!turnPhase) return null;

  const config: Record<TurnPhase, { text: string; color: string }> = {
    waitingRoll: { text: '🎲 Rolar Dado', color: 'bg-blue-600' },
    waitingMove: {
      text: `📍 Escolher Destino${diceValue != null ? ` (${diceValue})` : ''}`,
      color: 'bg-yellow-600',
    },
    waitingAnswer: { text: '❓ Responder Pergunta', color: 'bg-purple-600' },
    waitingFinalAnswer: { text: '🏆 Desafio Final', color: 'bg-yellow-500' },
  };

  const { text, color } = config[turnPhase];

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-white text-xs font-semibold ${color}`}
    >
      {text}
    </span>
  );
}

function WedgeDots({ wedges }: { wedges: string[] }) {
  return (
    <div className="flex gap-1 mt-1">
      {ALL_CATEGORIES.map((cat) => {
        const hasWedge = wedges.includes(cat);
        return (
          <span
            key={cat}
            className="inline-block w-3 h-3 rounded-full flex-shrink-0"
            style={
              hasWedge
                ? { backgroundColor: CATEGORY_COLORS[cat] }
                : {
                    border: `2px solid ${CATEGORY_COLORS[cat]}`,
                    opacity: 0.4,
                  }
            }
            title={CATEGORY_NAMES[cat]}
          />
        );
      })}
    </div>
  );
}

interface GameHUDProps {
  players: PlayerToken[];
  currentPlayerNickname: string;
  humanNickname: string;
  turnPhase?: TurnPhase;
  diceValue?: number | null;
  playerWedges?: Record<string, string[]>;
}

export default function GameHUD({
  players,
  currentPlayerNickname,
  humanNickname,
  turnPhase,
  diceValue,
  playerWedges,
}: GameHUDProps) {
  return (
    <div className="flex flex-col gap-6 p-4 bg-gray-800 rounded-2xl h-full overflow-y-auto">
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
          Você
        </p>
        <p className="text-white font-bold text-lg">{humanNickname}</p>
      </div>

      {/* Turn phase badge */}
      {turnPhase && (
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">
            Fase
          </p>
          <TurnPhaseBadge turnPhase={turnPhase} diceValue={diceValue} />
        </div>
      )}

      {/* Progress hints */}
      {(() => {
        const humanWedges = playerWedges?.[humanNickname] ?? [];
        if (humanWedges.length === 5) {
          return (
            <p className="text-yellow-300 text-sm font-semibold">
              Falta 1 fatia! Conquiste e volte ao Hub Central.
            </p>
          );
        }
        if (humanWedges.length === 6) {
          return (
            <p className="text-yellow-300 text-sm font-semibold">
              Todas as fatias! Vá ao Hub Central para o Desafio Final.
            </p>
          );
        }
        return null;
      })()}

      <div>
        <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">
          Jogadores
        </p>
        <ul className="space-y-2">
          {players.map((p) => (
            <li key={p.nickname}>
              <div className="flex items-center gap-2">
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
              </div>
              {playerWedges?.[p.nickname] && (
                <div className="ml-5">
                  <WedgeDots wedges={playerWedges[p.nickname]} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">
          Categorias
        </p>
        <ul className="space-y-1">
          {ALL_CATEGORIES.map((cat) => (
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
