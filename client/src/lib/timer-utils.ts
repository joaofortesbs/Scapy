
// Timer utility functions for calculating time differences
// Uses the user's startDate from the users table as the baseline

// Interface para dados de tempo calculado
export interface CalculatedTime {
  totalMilliseconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Função para calcular a diferença de tempo
export function calculateTimeDifference(startDate: Date | string, endDate: Date | string = new Date()): CalculatedTime {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalMilliseconds = Math.max(0, end.getTime() - start.getTime());

  const days = Math.floor(totalMilliseconds / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMilliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((totalMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMilliseconds % (1000 * 60)) / 1000);

  return {
    totalMilliseconds,
    days,
    hours,
    minutes,
    seconds
  };
}

// Função para formatar o tempo em string
export function formatTimer(timeDiff: CalculatedTime): string {
  const { hours, minutes, seconds } = timeDiff;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Utility function to get days clean from start date
export function getDaysClean(startDate: Date | string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
