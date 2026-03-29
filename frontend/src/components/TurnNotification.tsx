import { useEffect, useState } from 'react';

interface TurnNotificationProps {
  message: string | null;
  duration?: number;
}

export default function TurnNotification({
  message,
  duration = 1500,
}: TurnNotificationProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (message === null) return;

    const timer = setTimeout(() => setDismissed(true), duration);
    return () => clearTimeout(timer);
  }, [message, duration]);

  if (dismissed || message === null) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-gray-800/90 text-white rounded-lg shadow-lg px-6 py-3 text-lg font-semibold">
        {message}
      </div>
    </div>
  );
}
