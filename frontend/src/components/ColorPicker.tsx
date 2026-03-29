import { PLAYER_COLOR_LIST, PLAYER_COLORS } from '../game/constants';
import type { PlayerColor } from '../game/types';

interface ColorPickerProps {
  onSelect: (color: PlayerColor) => void;
}

export default function ColorPicker({ onSelect }: ColorPickerProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-2xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-white mb-6">
          Escolha sua cor
        </h1>
        <div className="grid grid-cols-3 gap-4">
          {PLAYER_COLOR_LIST.map((color) => (
            <button
              key={color}
              onClick={() => onSelect(color)}
              className="w-full aspect-square rounded-xl border-2 border-transparent hover:border-white transition-colors cursor-pointer"
              style={{ backgroundColor: PLAYER_COLORS[color] }}
              aria-label={color}
            />
          ))}
        </div>
        <p className="text-gray-400 text-sm mt-6">
          Selecione a cor do seu token no tabuleiro.
        </p>
      </div>
    </div>
  );
}
