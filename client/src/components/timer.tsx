import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { User } from "@shared/schema";
import { formatTimer, calculateTimeDifference } from "@/lib/timer-utils";

interface TimerProps {
  user: User | null;
}

export default function Timer({ user }: TimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Safety check for user data
  if (!user || !user.lastRelapse) {
    return (
      <Card className="p-6 text-center">
        <CardContent>
          <p className="text-muted-foreground">Dados do usuário não disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  const timeDiff = calculateTimeDifference(user.lastRelapse, currentTime);
  const formattedTime = formatTimer(timeDiff);

  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground mb-0">
        Você está livre da pornografia há:
      </p>
      <div className="timer-display" data-testid="timer-display">
        <span data-testid="timer-hours">{String(timeDiff.hours).padStart(2, '0')}</span>:
        <span data-testid="timer-minutes">{String(timeDiff.minutes).padStart(2, '0')}</span>:
        <span data-testid="timer-seconds">{String(timeDiff.seconds).padStart(2, '0')}</span>
      </div>

      {timeDiff.days > 0 && (
        <div className="mt-4">
          <div className="text-sm font-semibold text-primary">
            {timeDiff.days} {timeDiff.days === 1 ? 'DIA' : 'DIAS'} LIMPO
          </div>
        </div>
      )}
    </div>
  );
}