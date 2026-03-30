import { useState, useRef, useCallback } from 'react';

interface DiceRollerProps {
  onRoll: () => Promise<number>;
  disabled: boolean;
  diceValue: number | null;
  visible: boolean;
}

export default function DiceRoller({ onRoll, disabled, diceValue, visible }: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleClick = useCallback(async () => {
    if (isRolling || disabled) return;

    setIsRolling(true);
    setDisplayValue(null);

    // Start cycling random numbers
    intervalRef.current = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
    }, 80);

    try {
      const result = await onRoll();

      // Stop cycling after 500ms minimum animation time
      setTimeout(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setDisplayValue(result);
        setIsRolling(false);
      }, 500);
    } catch {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setDisplayValue(null);
      setIsRolling(false);
    }
  }, [isRolling, disabled, onRoll]);

  if (!visible) return null;

  const shownValue = isRolling ? displayValue : (diceValue ?? displayValue);

  return (
    <div className="flex flex-col items-center gap-3">
      {shownValue !== null && <span className="text-5xl font-bold text-white">{shownValue}</span>}
      <button
        onClick={handleClick}
        disabled={isRolling || disabled}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
      >
        🎲 Rolar Dado
      </button>
    </div>
  );
}
