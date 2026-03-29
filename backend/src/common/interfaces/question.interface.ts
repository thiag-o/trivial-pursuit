import { Category } from '../enums';

export interface Answer {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  category: Category;
  question: string;
  answers: Answer[];
  correctAnswer: string;
}
