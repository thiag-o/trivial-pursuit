import { useState, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getNickname } from '../services/auth';
import ColorPicker from '../components/ColorPicker';
import BoardCanvas from '../components/BoardCanvas';
import type { BoardCanvasHandle } from '../components/BoardCanvas';
import GameHUD from '../components/GameHUD';
import DiceRoller from '../components/DiceRoller';
import QuestionModal from '../components/QuestionModal';
import CategoryPickerModal from '../components/CategoryPickerModal';
import TurnNotification from '../components/TurnNotification';
import VictoryScreen from '../components/VictoryScreen';
import DefeatScreen from '../components/DefeatScreen';
import WedgeNotification from '../components/WedgeNotification';
import { rollDice, moveToPosition, fetchQuestion, submitAnswer } from '../services/game-api';
import { getValidDestinations, filterHubIfMustLeave } from '../game/turn-logic';
import type { PlayerColor, PlayerToken, GamePageState, PlayerData, BotTurnResult } from '../game/types';
import { PLAYER_COLOR_LIST } from '../game/constants';

interface LocationGameState {
  gameId: string;
  players: { nickname: string; position: number; isHuman: boolean }[];
  currentPlayerNickname: string;
}

function buildPlayerTokens(players: PlayerData[], selectedColor: PlayerColor): PlayerToken[] {
  const availableColors = PLAYER_COLOR_LIST.filter((c) => c !== selectedColor);
  let colorIndex = 0;
  return players.map((p) => {
    if (p.isHuman) {
      return { nickname: p.nickname, position: p.position, color: selectedColor, isHuman: true, wedges: p.wedges };
    }
    const color = availableColors[colorIndex % availableColors.length];
    colorIndex++;
    return { nickname: p.nickname, position: p.position, color, isHuman: false, wedges: p.wedges };
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function GamePage() {
  const location = useLocation();
  const locState = location.state as LocationGameState | null;
  const humanNickname = getNickname() ?? '';

  const [selectedColor, setSelectedColor] = useState<PlayerColor | null>(null);
  const boardRef = useRef<BoardCanvasHandle>(null);

  // Notification key forces TurnNotification to re-mount on repeated messages
  const [notifKey, setNotifKey] = useState(0);

  const [state, setState] = useState<GamePageState | null>(null);
  const navigate = useNavigate();

  if (!locState) {
    return <Navigate to="/start" replace />;
  }

  function handleColorSelect(color: PlayerColor) {
    setSelectedColor(color);

    const players: PlayerData[] = locState!.players.map((p) => ({
      ...p,
      wedges: [],
    }));

    setState({
      gameId: locState!.gameId,
      players,
      playerTokens: buildPlayerTokens(players, color),
      currentPlayerNickname: locState!.currentPlayerNickname ?? locState!.players[0]?.nickname ?? '',
      turnPhase: 'waitingRoll',
      lastDiceRoll: null,
      validDestinations: [],
      currentTile: null,
      question: null,
      answerResult: null,
      notification: null,
      showCategoryPicker: false,
      isLoading: false,
      mustLeaveHub: false,
      isFinalChallenge: false,
      gameOverState: null,
      earnedWedgeCategory: null,
    });
  }

  if (!selectedColor || !state) {
    return <ColorPicker onSelect={handleColorSelect} />;
  }

  // --- Handler: Roll Dice ---
  const handleRollDice = async (): Promise<number> => {
    try {
      const res = await rollDice();
      const currentPlayer = state.players.find((p) => p.nickname === state.currentPlayerNickname);
      const from = currentPlayer?.position ?? 0;
      const rawDests = getValidDestinations(from, res.value);
      const dests = filterHubIfMustLeave(rawDests, state.mustLeaveHub);

      setState((prev) =>
        prev
          ? {
              ...prev,
              lastDiceRoll: res.value,
              validDestinations: dests,
              turnPhase: 'waitingMove',
            }
          : prev,
      );
      return res.value;
    } catch {
      showNotification('Erro ao rolar o dado');
      throw new Error('roll failed');
    }
  };

  // --- Handler: Tile Click (destination selected) ---
  const handleTileClick = async (position: number) => {
    if (state.isLoading) return;
    if (!state.validDestinations.includes(position)) return;

    setState((prev) => (prev ? { ...prev, isLoading: true, validDestinations: [] } : prev));

    try {
      const res = await moveToPosition(position);

      // Update players from backend response
      const updatedPlayers = res.players;
      const updatedTokens = buildPlayerTokens(updatedPlayers, selectedColor);

      // Find previous position to animate from
      const prevPlayer = state.players.find((p) => p.nickname === state.currentPlayerNickname);
      const fromPos = prevPlayer?.position ?? 0;

      // Animate token movement BEFORE updating playerTokens state.
      // Updating playerTokens causes BoardCanvas to destroy/recreate the
      // PixiJS Graphics object being animated, crashing the ticker.
      await new Promise<void>((resolve) => {
        if (boardRef.current) {
          boardRef.current.animateToken(state.currentPlayerNickname, fromPos, position, resolve);
        } else {
          resolve();
        }
      });

      setState((prev) =>
        prev
          ? {
              ...prev,
              players: updatedPlayers,
              playerTokens: updatedTokens,
              currentPlayerNickname: res.currentPlayer,
              isLoading: true,
            }
          : prev,
      );

      // Check for Final Challenge (hub + 6 wedges)
      if (res.isFinalChallenge) {
        setState((prev) => (prev ? { ...prev, isFinalChallenge: true, mustLeaveHub: false, isLoading: false } : prev));
        await loadQuestion(res.finalCategory!, true);
        return;
      }

      // Evaluate tile type
      if (res.tileType === 'rollAgain') {
        setState((prev) =>
          prev
            ? {
                ...prev,
                turnPhase: 'waitingRoll',
                lastDiceRoll: null,
                mustLeaveHub: false,
                isLoading: false,
              }
            : prev,
        );
        showNotification('🎲 Role Novamente!');
      } else if (res.tileType === 'hub') {
        // Hub Central — show category picker
        setState((prev) => (prev ? { ...prev, showCategoryPicker: true, mustLeaveHub: false, isLoading: false } : prev));
      } else if ((res.tileType === 'category' || res.tileType === 'hq') && res.tileCategory) {
        // Fetch question for this category
        setState((prev) => (prev ? { ...prev, mustLeaveHub: false } : prev));
        await loadQuestion(res.tileCategory);
      }
    } catch {
      setState((prev) => (prev ? { ...prev, isLoading: false } : prev));
      showNotification('Erro ao mover');
    }
  };

  // --- Handler: Category select (hub) ---
  const handleCategorySelect = async (category: string) => {
    setState((prev) => (prev ? { ...prev, showCategoryPicker: false, isLoading: true } : prev));
    await loadQuestion(category);
  };

  // --- Load question helper ---
  const loadQuestion = async (category: string, isFinal = false) => {
    try {
      const q = await fetchQuestion(category);
      setState((prev) =>
        prev
          ? {
              ...prev,
              question: q,
              answerResult: null,
              turnPhase: isFinal ? 'waitingFinalAnswer' : 'waitingAnswer',
              isLoading: false,
            }
          : prev,
      );
    } catch {
      setState((prev) => (prev ? { ...prev, turnPhase: 'waitingRoll', isLoading: false } : prev));
      showNotification('Erro ao carregar pergunta');
    }
  };

  // --- Handler: Answer submitted ---
  const handleAnswer = async (answerId: string) => {
    if (!state.question) return;

    setState((prev) => (prev ? { ...prev, isLoading: true } : prev));

    try {
      const res = await submitAnswer(state.question.id, answerId);

      setState((prev) =>
        prev
          ? {
              ...prev,
              answerResult: {
                correct: res.correct,
                correctAnswer: res.correctAnswer,
              },
              isLoading: false,
            }
          : prev,
      );

      // Show feedback then proceed
      const feedbackDelay = res.correct ? 1500 : 2000;
      await sleep(feedbackDelay);

      // Update from backend game state
      const gs = res.gameState;
      const updatedPlayers = gs.players;
      const updatedTokens = buildPlayerTokens(updatedPlayers, selectedColor);

      // Check for human victory (Final Challenge correct)
      if (gs.status === 'finished' && gs.winner === humanNickname) {
        const winnerPlayer = updatedPlayers.find((p) => p.nickname === gs.winner);
        setState((prev) =>
          prev
            ? {
                ...prev,
                players: updatedPlayers,
                playerTokens: updatedTokens,
                question: null,
                answerResult: null,
                isFinalChallenge: false,
                gameOverState: {
                  type: 'victory',
                  winnerNickname: gs.winner!,
                  winnerWedges: winnerPlayer?.wedges ?? [],
                },
              }
            : prev,
        );
        return;
      }

      // Detect wedge change for notification
      const humanBefore = state.players.find((p) => p.nickname === humanNickname);
      const humanAfter = updatedPlayers.find((p) => p.nickname === humanNickname);
      let earnedWedge: string | null = null;
      if (humanBefore && humanAfter && humanAfter.wedges.length > humanBefore.wedges.length) {
        earnedWedge = humanAfter.wedges.find((w) => !humanBefore.wedges.includes(w)) ?? null;
      }

      if (res.correct) {
        // Same player continues
        setState((prev) =>
          prev
            ? {
                ...prev,
                players: updatedPlayers,
                playerTokens: updatedTokens,
                currentPlayerNickname: gs.currentPlayer,
                turnPhase: 'waitingRoll',
                lastDiceRoll: null,
                question: null,
                answerResult: null,
                isFinalChallenge: false,
                earnedWedgeCategory: earnedWedge,
              }
            : prev,
        );
      } else {
        // Wrong answer: backend already advanced to next human
        const wasFinalChallenge = state.isFinalChallenge;
        setState((prev) =>
          prev
            ? {
                ...prev,
                question: null,
                answerResult: null,
                isLoading: true,
                isFinalChallenge: false,
                mustLeaveHub: wasFinalChallenge ? true : prev.mustLeaveHub,
              }
            : prev,
        );

        await runBotTurnSequence(res.botTurns ?? [], updatedPlayers, gs.currentPlayer, updatedTokens, gs);
      }
    } catch {
      setState((prev) => (prev ? { ...prev, isLoading: false, question: null, answerResult: null } : prev));
      showNotification('Erro ao enviar resposta');
    }
  };

  // --- Bot turn animation sequence ---
  const runBotTurnSequence = async (
    botTurns: BotTurnResult[],
    updatedPlayers: PlayerData[],
    newCurrentPlayer: string,
    updatedTokens: PlayerToken[],
    gs: { status: string; winner: string | null },
  ) => {
    for (const turn of botTurns) {
      showNotification(`\ud83c\udfb2 ${turn.botNickname} tirou ${turn.diceValue}`);
      await sleep(500);

      // Animate token movement
      await new Promise<void>((resolve) => {
        if (boardRef.current) {
          boardRef.current.animateToken(turn.botNickname, turn.fromPosition, turn.toPosition, resolve);
        } else {
          resolve();
        }
      });

      // Update position in state for visual correctness on re-render
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          playerTokens: prev.playerTokens.map((t) => (t.nickname === turn.botNickname ? { ...t, position: turn.toPosition } : t)),
          players: prev.players.map((p) => (p.nickname === turn.botNickname ? { ...p, position: turn.toPosition } : p)),
        };
      });

      // Show result
      if (turn.answerCorrect === null) {
        showNotification(`\ud83c\udfb2 ${turn.botNickname} joga novamente!`);
        await sleep(300);
      } else if (turn.answerCorrect) {
        const wedgeMsg = turn.wedgeEarned ? ' \ud83c\udfc5' : '';
        showNotification(`\u2705 ${turn.botNickname} acertou!${wedgeMsg}`);
        await sleep(700);
      } else {
        showNotification(`\u274c ${turn.botNickname} errou!`);
        await sleep(500);
      }
    }

    // Check game over (bot won)
    if (gs.status === 'finished' && gs.winner && gs.winner !== humanNickname) {
      const winnerPlayer = updatedPlayers.find((p) => p.nickname === gs.winner);
      setState((prev) =>
        prev
          ? {
              ...prev,
              players: updatedPlayers,
              playerTokens: buildPlayerTokens(updatedPlayers, selectedColor),
              question: null,
              answerResult: null,
              isLoading: false,
              gameOverState: {
                type: 'defeat',
                winnerNickname: gs.winner!,
                winnerWedges: winnerPlayer?.wedges ?? [],
              },
            }
          : prev,
      );
      return;
    }

    showNotification('Sua vez!');
    await sleep(1000);

    setState((prev) =>
      prev
        ? {
            ...prev,
            players: updatedPlayers,
            playerTokens: buildPlayerTokens(updatedPlayers, selectedColor),
            currentPlayerNickname: newCurrentPlayer,
            turnPhase: 'waitingRoll',
            lastDiceRoll: null,
            isLoading: false,
            notification: null,
          }
        : prev,
    );
  };

  // --- Notification helper ---
  const showNotification = (message: string) => {
    setNotifKey((k) => k + 1);
    setState((prev) => (prev ? { ...prev, notification: message } : prev));
  };

  // Derived values
  const isHumanTurn = state.currentPlayerNickname === humanNickname;
  const diceVisible = state.turnPhase === 'waitingRoll' && isHumanTurn;
  const diceDisabled = state.isLoading;

  const playerWedges: Record<string, string[]> = {};
  for (const p of state.players) {
    playerWedges[p.nickname] = p.wedges;
  }

  return (
    <div className="flex h-screen bg-gray-900 p-4 gap-4">
      {/* Board area */}
      <div className="flex-[3] flex flex-col items-center justify-center gap-4">
        <BoardCanvas
          ref={boardRef}
          players={state.playerTokens}
          onTileClick={handleTileClick}
          validDestinations={state.validDestinations}
        />
        <DiceRoller onRoll={handleRollDice} disabled={diceDisabled} diceValue={state.lastDiceRoll} visible={diceVisible} />
      </div>

      {/* HUD */}
      <div className="flex-1 min-w-[240px]">
        <GameHUD
          players={state.playerTokens}
          currentPlayerNickname={state.currentPlayerNickname}
          humanNickname={humanNickname}
          turnPhase={state.turnPhase}
          diceValue={state.lastDiceRoll}
          playerWedges={playerWedges}
        />
      </div>

      {/* Modals & Notifications */}
      <QuestionModal
        question={state.question}
        category={state.question?.category ?? null}
        onAnswer={handleAnswer}
        answerResult={state.answerResult}
        isLoading={state.isLoading}
        isFinalChallenge={state.isFinalChallenge}
      />
      <CategoryPickerModal onSelect={handleCategorySelect} visible={state.showCategoryPicker} />
      <TurnNotification key={notifKey} message={state.notification} />
      {state.gameOverState?.type === 'victory' && (
        <VictoryScreen nickname={humanNickname} wedges={state.gameOverState.winnerWedges} onPlayAgain={() => navigate('/start')} />
      )}
      {state.gameOverState?.type === 'defeat' && (
        <DefeatScreen
          winnerNickname={state.gameOverState.winnerNickname}
          winnerWedges={state.gameOverState.winnerWedges}
          onPlayAgain={() => navigate('/start')}
        />
      )}
      <WedgeNotification
        category={state.earnedWedgeCategory}
        onDismiss={() => setState((prev) => (prev ? { ...prev, earnedWedgeCategory: null } : prev))}
      />
    </div>
  );
}
