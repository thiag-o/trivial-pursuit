import { GameStatus, TurnPhase } from '../enums';
import { Player } from './player.interface';

export interface GameState {
  gameId: string;
  players: Player[];
  currentPlayerIndex: number;
  status: GameStatus;
  turnPhase: TurnPhase;
  lastDiceRoll: number | null;
  activeQuestionId: string | null;
  winner: string | null;
  finalChallengeCategory: string | null;
}
