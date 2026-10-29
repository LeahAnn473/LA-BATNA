import { useCallback, useEffect, useState } from 'react';

export default function useCountdown(total) {
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const reset = useCallback(
    (value = total) => {
      setRemaining(value);
      setRunning(false);
    },
    [total]
  );

  return {
    remaining,
    running,
    elapsed: total - remaining,
    finished: remaining === 0,
    start: () => setRunning(true),
    pause: () => setRunning(false),
    reset,
  };
}

export function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}