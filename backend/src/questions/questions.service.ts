import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category } from '../common/enums';
import { Question } from '../common/interfaces';
import { QuestionsStore } from './questions.store';

@Injectable()
export class QuestionsService {
  constructor(private readonly store: QuestionsStore) {}

  getByCategory(
    category: string,
    nickname: string,
    gameId: string,
  ): Omit<Question, 'correctAnswer'> {
    if (!this.isValidCategory(category)) {
      throw new BadRequestException(
        `Invalid category. Valid categories: ${this.getValidCategories().join(', ')}`,
      );
    }

    const cat = category as Category;
    const questions = this.store.getByCategory(cat);
    const usedIds = this.store.getUsedIds(gameId, nickname);

    let available = questions.filter((q) => !usedIds.has(q.id));

    if (available.length === 0) {
      this.store.resetCategoryPool(gameId, nickname, cat);
      available = this.store.getByCategory(cat);
    }

    const selected = available[Math.floor(Math.random() * available.length)];
    this.store.markAsUsed(gameId, nickname, selected.id);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { correctAnswer, ...questionWithoutAnswer } = selected;
    return questionWithoutAnswer;
  }

  checkAnswer(
    questionId: string,
    answerId: string,
  ): { correct: boolean; correctAnswer: string } {
    const question = this.store.getById(questionId);
    if (!question) {
      throw new NotFoundException(`Question not found: ${questionId}`);
    }

    return {
      correct: question.correctAnswer === answerId,
      correctAnswer: question.correctAnswer,
    };
  }

  getValidCategories(): string[] {
    return Object.values(Category);
  }

  private isValidCategory(category: string): boolean {
    return Object.values(Category).includes(category as Category);
  }
}
