import { Injectable, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Category } from '../common/enums';
import { Question } from '../common/interfaces';

@Injectable()
export class QuestionsStore implements OnModuleInit {
  private questions: Question[] = [];
  private usedQuestions = new Map<string, Set<string>>();

  onModuleInit() {
    this.loadFromJson();
  }

  loadFromJson(): void {
    const filePath = join(__dirname, '..', 'questions', 'data', 'questions.json');
    const raw = readFileSync(filePath, 'utf-8');
    this.questions = JSON.parse(raw);
  }

  getByCategory(category: Category): Question[] {
    return this.questions.filter((q) => q.category === category);
  }

  getById(id: string): Question | undefined {
    return this.questions.find((q) => q.id === id);
  }

  markAsUsed(gameId: string, nickname: string, questionId: string): void {
    const key = `${gameId}:${nickname}`;
    if (!this.usedQuestions.has(key)) {
      this.usedQuestions.set(key, new Set());
    }
    this.usedQuestions.get(key)!.add(questionId);
  }

  getUsedIds(gameId: string, nickname: string): Set<string> {
    const key = `${gameId}:${nickname}`;
    return this.usedQuestions.get(key) ?? new Set();
  }

  resetCategoryPool(
    gameId: string,
    nickname: string,
    category: Category,
  ): void {
    const key = `${gameId}:${nickname}`;
    const usedSet = this.usedQuestions.get(key);
    if (!usedSet) return;

    const categoryIds = this.getByCategory(category).map((q) => q.id);
    for (const id of categoryIds) {
      usedSet.delete(id);
    }
  }
}
