import api from './api';
import type {
  RollDiceResponse,
  MoveResponse,
  QuestionData,
  AnswerResponse,
} from '../game/types';

export async function rollDice(): Promise<RollDiceResponse> {
  const { data } = await api.post<RollDiceResponse>('/game/roll-dice');
  return data;
}

export async function moveToPosition(
  targetPosition: number,
): Promise<MoveResponse> {
  const { data } = await api.post<MoveResponse>('/game/move', {
    targetPosition,
  });
  return data;
}

export async function fetchQuestion(
  category: string,
): Promise<QuestionData> {
  const { data } = await api.get<QuestionData>(`/questions/${category}`);
  return data;
}

export async function submitAnswer(
  questionId: string,
  answerId: string,
): Promise<AnswerResponse> {
  const { data } = await api.post<AnswerResponse>(
    `/questions/${questionId}/answer`,
    { answerId },
  );
  return data;
}
