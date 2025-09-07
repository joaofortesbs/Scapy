export interface TimeDifference {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export function formatTimer(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function calculateTimeDifference(startTime: Date, currentTime: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
} {
  const diffInMs = currentTime.getTime() - startTime.getTime();
  const totalSeconds = Math.floor(diffInMs / 1000);

  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds
  };
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `${totalSeconds} segundos`;
  } else if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  } else if (totalSeconds < 86400) {
    const hours = Math.floor(totalSeconds / 3600);
    return `${hours} hora${hours !== 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(totalSeconds / 86400);
    return `${days} dia${days !== 1 ? 's' : ''}`;
  }
}