import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsStore } from './questions.store';
import { Category } from '../common/enums';
import { Question } from '../common/interfaces';

const mockQuestions: Question[] = [
  {
    id: 'q1',
    category: Category.GEOGRAPHY,
    question: 'Capital of France?',
    answers: [
      { id: 'a1', text: 'Paris' },
      { id: 'a2', text: 'London' },
    ],
    correctAnswer: 'a1',
  },
  {
    id: 'q2',
    category: Category.GEOGRAPHY,
    question: 'Largest ocean?',
    answers: [
      { id: 'a1', text: 'Pacific' },
      { id: 'a2', text: 'Atlantic' },
    ],
    correctAnswer: 'a1',
  },
  {
    id: 'q3',
    category: Category.HISTORY,
    question: 'Year of moon landing?',
    answers: [
      { id: 'a1', text: '1969' },
      { id: 'a2', text: '1970' },
    ],
    correctAnswer: 'a1',
  },
];

function createMockStore(): QuestionsStore {
  const store = new QuestionsStore();
  // Override loadFromJson to avoid filesystem dependency
  store['questions'] = [...mockQuestions];
  return store;
}

describe('QuestionsService', () => {
  let service: QuestionsService;
  let store: QuestionsStore;

  beforeEach(() => {
    store = createMockStore();
    service = new QuestionsService(store);
  });

  describe('getByCategory', () => {
    it('should return a question without correctAnswer', () => {
      const q = service.getByCategory('geography', 'Alice', 'game1');

      expect(q.id).toBeDefined();
      expect(q.category).toBe(Category.GEOGRAPHY);
      expect((q as any).correctAnswer).toBeUndefined();
    });

    it('should track used questions', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0); // always pick first
      const q1 = service.getByCategory('geography', 'Alice', 'game1');

      // Now q1 is used; next call should return q2
      const q2 = service.getByCategory('geography', 'Alice', 'game1');
      expect(q2.id).not.toBe(q1.id);

      jest.restoreAllMocks();
    });

    it('should reset pool when all questions used', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0);

      // Use both geography questions
      service.getByCategory('geography', 'Alice', 'game1');
      service.getByCategory('geography', 'Alice', 'game1');

      // Pool exhausted → reset → should return a question again
      const q = service.getByCategory('geography', 'Alice', 'game1');
      expect(q).toBeDefined();
      expect(q.category).toBe(Category.GEOGRAPHY);

      jest.restoreAllMocks();
    });

    it('should throw for invalid category', () => {
      expect(() =>
        service.getByCategory('invalid', 'Alice', 'game1'),
      ).toThrow(BadRequestException);
    });
  });

  describe('checkAnswer', () => {
    it('should return correct=true for right answer', () => {
      const result = service.checkAnswer('q1', 'a1');
      expect(result.correct).toBe(true);
      expect(result.correctAnswer).toBe('a1');
    });

    it('should return correct=false for wrong answer', () => {
      const result = service.checkAnswer('q1', 'a2');
      expect(result.correct).toBe(false);
      expect(result.correctAnswer).toBe('a1');
    });

    it('should throw for non-existent question', () => {
      expect(() => service.checkAnswer('nonexistent', 'a1')).toThrow(
        NotFoundException,
      );
    });
  });

  describe('getValidCategories', () => {
    it('should return all category values', () => {
      const cats = service.getValidCategories();
      expect(cats).toEqual(Object.values(Category));
    });
  });
});
