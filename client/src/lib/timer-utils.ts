export interface TimeDifference {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export function calculateTimeDifference(startDate: Date | string, currentDate: Date): TimeDifference {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const diffInMs = currentDate.getTime() - start.getTime();
  const totalSeconds = Math.floor(diffInMs / 1000);
  
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;
  
  return {
    days: Math.max(0, days),
    hours: Math.max(0, hours),
    minutes: Math.max(0, minutes),
    seconds: Math.max(0, seconds),
    totalSeconds: Math.max(0, totalSeconds),
  };
}

export function formatTimer(timeDiff: TimeDifference): string {
  const { days, hours, minutes, seconds } = timeDiff;
  return `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getStartOfWeek(date: Date = new Date()): Date {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
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
