import { useState, useRef, useCallback } from 'react';

interface DiceRollerProps {
  onRoll: (fixedValue?: number) => Promise<number>;
  disabled: boolean;
  diceValue: number | null;
  visible: boolean;
}

export default function DiceRoller({ onRoll, disabled, diceValue, visible }: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [fixedInput, setFixedInput] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleClick = useCallback(async () => {
    if (isRolling || disabled) return;

    const parsed = parseInt(fixedInput, 10);
    const fixedValue = !isNaN(parsed) && parsed >= 1 && parsed <= 6 ? parsed : undefined;

    setIsRolling(true);
    setDisplayValue(null);

    intervalRef.current = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
    }, 80);

    try {
      const result = await onRoll(fixedValue);

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
  }, [isRolling, disabled, fixedInput, onRoll]);

  if (!visible) return null;

  const shownValue = isRolling ? displayValue : (diceValue ?? displayValue);

  return (
    <div className="flex flex-col items-center gap-3">
      {shownValue !== null && <span className="text-5xl font-bold text-white">{shownValue}</span>}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={6}
          value={fixedInput}
          onChange={(e) => setFixedInput(e.target.value)}
          placeholder="1–6"
          disabled={isRolling || disabled}
          className="w-16 px-2 py-3 text-center bg-gray-700 border border-gray-500 text-white rounded-lg disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          onClick={handleClick}
          disabled={isRolling || disabled}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          🎲 Rolar Dado
        </button>
      </div>
    </div>
  );
}
