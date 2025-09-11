

import { useMemo, useState, useEffect } from 'react';
import { getCurrentAvatar, getNextAvatar, calculateProgressInDays } from '@/utils/avatar-system';

interface EvolutionaryAvatarProps {
  startDate?: string;
  size?: 'small' | 'medium' | 'large';
  showTitle?: boolean;
  showProgress?: boolean;
  className?: string;
}

export default function EvolutionaryAvatar({
  startDate,
  size = 'large',
  showTitle = true,
  showProgress = false,
  className = ''
}: EvolutionaryAvatarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for real-time progression
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const { currentAvatar, nextAvatar, progressInDays } = useMemo(() => {
    if (!startDate) {
      const fallbackAvatar = getCurrentAvatar(0);
      return {
        currentAvatar: fallbackAvatar,
        nextAvatar: getNextAvatar(0),
        progressInDays: 0
      };
    }

    const days = calculateProgressInDays(startDate);
    const current = getCurrentAvatar(days);
    const next = getNextAvatar(days);
    
    console.log(`🎯 [EvolutionaryAvatar] ${days} dias - Avatar atual: ${current.title}`);
    
    return {
      currentAvatar: current,
      nextAvatar: next,
      progressInDays: days
    };
  }, [startDate, currentTime]); // Add currentTime as dependency for real-time updates

  const sizeClasses = {
    small: 'w-20 h-20',
    medium: 'w-48 h-48',
    large: 'w-80 h-80'
  };

  const titleSizeClasses = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-2xl'
  };

  return (
    <div className={`text-center ${className}`}>
      {showTitle && (
        <div className="mb-4">
          <h2 className={`font-bold text-primary mb-2 ${titleSizeClasses[size]}`}>
            {currentAvatar.title}
          </h2>
          <p className="text-xs text-foreground/60">
            Seu avatar atual ({progressInDays} {progressInDays === 1 ? 'dia' : 'dias'})
          </p>
        </div>
      )}
      
      <div className="floating-avatar relative">
        <img
          src={currentAvatar.image}
          alt={currentAvatar.title}
          className={`${sizeClasses[size]} object-contain mx-auto transition-all duration-500 hover:scale-105 rounded-xl`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentAvatar.seed}&backgroundColor=000515`;
          }}
          data-testid={`evolutionary-avatar-${currentAvatar.seed}`}
        />
        
        {/* Badge de conquista para avatares desbloqueados */}
        {progressInDays >= currentAvatar.days && currentAvatar.days > 0 && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-white text-sm font-bold">✓</span>
          </div>
        )}

        {/* Indicador de progresso para próximo avatar */}
        {nextAvatar && showTitle && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="bg-background/90 backdrop-blur-sm rounded-full px-3 py-1 border border-border/30">
              <span className="text-xs text-foreground/70">
                Próximo em {nextAvatar.days - progressInDays} {nextAvatar.days - progressInDays === 1 ? 'dia' : 'dias'}
              </span>
            </div>
          </div>
        )}
      </div>

      {showProgress && nextAvatar && (
        <div className="mt-4 p-3 bg-background/20 rounded-lg border border-border/30">
          <p className="text-sm text-foreground/80 mb-2">
            Próximo avatar: <span className="font-semibold text-primary">{nextAvatar.title}</span>
          </p>
          <div className="flex items-center justify-between text-xs text-foreground/60">
            <span>{progressInDays} dias</span>
            <span>Faltam {nextAvatar.days - progressInDays} dias</span>
            <span>{nextAvatar.days} dias</span>
          </div>
          <div className="mt-2 h-2 bg-border/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500"
              style={{
                width: `${Math.min(100, (progressInDays / nextAvatar.days) * 100)}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

