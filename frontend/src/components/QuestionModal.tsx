import { useState } from 'react';
import type { QuestionData, AnswerResult, Category } from '../game/types';
import { CATEGORY_COLORS, CATEGORY_NAMES } from '../game/constants';

interface QuestionModalProps {
  question: QuestionData | null;
  category: string | null;
  onAnswer: (answerId: string) => void;
  answerResult: AnswerResult | null;
  isLoading: boolean;
}

export default function QuestionModal({
  question,
  category,
  onAnswer,
  answerResult,
  isLoading,
}: QuestionModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!question) return null;

  const cat = (category ?? question.category) as Category;
  const categoryColor = CATEGORY_COLORS[cat] ?? '#6B7280';
  const categoryName = CATEGORY_NAMES[cat] ?? category;
  const buttonsDisabled = isLoading || answerResult !== null;

  const handleClick = (answerId: string) => {
    if (buttonsDisabled) return;
    setSelectedId(answerId);
    onAnswer(answerId);
  };

  const getButtonStyle = (answerId: string) => {
    if (!answerResult) {
      return 'bg-gray-700 hover:bg-gray-600';
    }

    if (answerId === answerResult.correctAnswer) {
      return 'bg-green-600';
    }

    if (answerId === selectedId && !answerResult.correct) {
      return 'bg-red-600';
    }

    return 'bg-gray-700 opacity-60';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg rounded-2xl bg-gray-800 overflow-hidden shadow-2xl">
        {/* Category header */}
        <div
          className="px-6 py-3 text-center font-bold text-gray-900"
          style={{ backgroundColor: categoryColor }}
        >
          {categoryName}
        </div>

        {/* Question body */}
        <div className="px-6 py-5">
          <p className="text-white text-lg mb-6">{question.question}</p>

          {/* Answer buttons */}
          <div className="flex flex-col gap-3">
            {question.answers.map((answer) => (
              <button
                key={answer.id}
                onClick={() => handleClick(answer.id)}
                disabled={buttonsDisabled}
                className={`w-full text-left px-4 py-3 rounded-lg text-white transition-colors disabled:cursor-not-allowed ${getButtonStyle(answer.id)}`}
              >
                {answer.text}
              </button>
            ))}
          </div>

          {/* Feedback text */}
          {answerResult && (
            <p
              className={`mt-4 text-center font-bold text-lg ${
                answerResult.correct ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {answerResult.correct ? 'Correto!' : 'Incorreto!'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
