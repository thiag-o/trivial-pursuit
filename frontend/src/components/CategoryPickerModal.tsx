import type { Category } from '../game/types';
import { CATEGORY_COLORS, CATEGORY_NAMES } from '../game/constants';

interface CategoryPickerModalProps {
  onSelect: (category: string) => void;
  visible: boolean;
}

const CATEGORIES = Object.keys(CATEGORY_COLORS) as Category[];

export default function CategoryPickerModal({
  onSelect,
  visible,
}: CategoryPickerModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-2xl bg-gray-800 p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Escolha uma Categoria
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className="px-4 py-3 rounded-xl font-semibold text-gray-900 transition-opacity hover:opacity-80 cursor-pointer"
              style={{ backgroundColor: CATEGORY_COLORS[cat] }}
            >
              {CATEGORY_NAMES[cat]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
