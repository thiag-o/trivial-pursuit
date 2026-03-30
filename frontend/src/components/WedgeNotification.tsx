import { useEffect } from 'react';
import type { Category } from '../game/types';
import { CATEGORY_COLORS, CATEGORY_NAMES } from '../game/constants';

interface WedgeNotificationProps {
  category: string | null;
  onDismiss: () => void;
}

export default function WedgeNotification({ category, onDismiss }: WedgeNotificationProps) {
  useEffect(() => {
    if (!category) return;
    const timer = setTimeout(onDismiss, 2000);
    return () => clearTimeout(timer);
  }, [category, onDismiss]);

  if (!category) return null;

  const color = CATEGORY_COLORS[category as Category] ?? '#6B7280';
  const name = CATEGORY_NAMES[category as Category] ?? category;

  return (
    <div
      className="fixed top-6 left-1/2 z-50 -translate-x-1/2 rounded-lg px-6 py-3 text-lg font-bold text-gray-900 shadow-lg"
      style={{ backgroundColor: color }}
    >
      Fatia de {name} conquistada! 🎉
    </div>
  );
}
