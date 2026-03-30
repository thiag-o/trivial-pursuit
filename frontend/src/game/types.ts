export type TileType = 'hub' | 'category' | 'hq' | 'rollAgain';

export type Category = 'geography' | 'entertainment' | 'history' | 'art' | 'science' | 'sports';

export interface TileDef {
  position: number;
  type: TileType;
  category: Category | null;
}

export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

export interface PlayerToken {
  nickname: string;
  position: number;
  color: PlayerColor;
  isHuman: boolean;
  wedges: string[];
}

export interface TileLayout {
  position: number;
  x: number;
  y: number;
}

export interface SpokeDef {
  hqPosition: number;
  category: Category;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  sectorAngleStart: number;
  sectorAngleEnd: number;
}

export interface BoardLayout {
  centerX: number;
  centerY: number;
  ringRadius: number;
  tileRadius: number;
  hubRadius: number;
  tiles: TileLayout[];
  spokes: SpokeDef[];
}

// --- Turn-related types (MVP-4) ---

export type TurnPhase = 'waitingRoll' | 'waitingMove' | 'waitingAnswer' | 'waitingFinalAnswer';

export interface PlayerData {
  nickname: string;
  position: number;
  wedges: string[];
  isHuman: boolean;
}

export interface QuestionData {
  id: string;
  category: Category;
  question: string;
  answers: { id: string; text: string }[];
}

export interface AnswerResult {
  correct: boolean;
  correctAnswer: string;
}

export interface GameOverState {
  type: 'victory' | 'defeat';
  winnerNickname: string;
  winnerWedges: string[];
}

export interface GamePageState {
  gameId: string;
  players: PlayerData[];
  playerTokens: PlayerToken[];
  currentPlayerNickname: string;
  turnPhase: TurnPhase;
  lastDiceRoll: number | null;
  validDestinations: number[];
  currentTile: TileDef | null;
  question: QuestionData | null;
  answerResult: AnswerResult | null;
  notification: string | null;
  showCategoryPicker: boolean;
  isLoading: boolean;
  mustLeaveHub: boolean;
  isFinalChallenge: boolean;
  gameOverState: GameOverState | null;
  earnedWedgeCategory: string | null;
}

export interface RollDiceResponse {
  value: number;
}

export interface MoveResponse {
  gameId: string;
  players: PlayerData[];
  currentPlayer: string;
  status: string;
  turnPhase: TurnPhase;
  lastDiceRoll: number | null;
  tileType: TileType;
  tileCategory: Category | null;
  isFinalChallenge: boolean;
  finalCategory: string | null;
}

export interface AnswerResponse {
  correct: boolean;
  correctAnswer: string;
  gameState: {
    gameId: string;
    players: PlayerData[];
    currentPlayer: string;
    turnPhase: TurnPhase;
    status: string;
    winner: string | null;
  };
  botTurns: BotTurnResult[];
}

export interface BotTurnResult {
  botNickname: string;
  diceValue: number;
  fromPosition: number;
  toPosition: number;
  tileType: TileType;
  tileCategory: Category | null;
  answerCorrect: boolean | null;
  wedgeEarned: string | null;
  isFinalChallenge: boolean;
}
