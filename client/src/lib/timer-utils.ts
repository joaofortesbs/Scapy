
import { supabase } from '@/integrations/supabase/client';

// Interface para o Timer
export interface Timer {
  id: number;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  status: 'rodando' | 'pausado' | 'finalizado';
  created_at: string;
  updated_at: string;
}

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

// Função para buscar o timer ativo do usuário
export async function getActiveTimer(userId: string): Promise<Timer | null> {
  try {
    const { data, error } = await supabase
      .from('timers')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'rodando')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar timer ativo:', error);
      return null;
    }

    return data as Timer;
  } catch (error) {
    console.error('Erro ao buscar timer ativo:', error);
    return null;
  }
}

// Função para iniciar um novo timer
export async function startNewTimer(userId: string): Promise<Timer | null> {
  try {
    // Primeiro, finalizar qualquer timer ativo existente
    await pauseActiveTimer(userId);

    // Criar novo timer
    const { data, error } = await supabase
      .from('timers')
      .insert([{
        user_id: userId,
        started_at: new Date().toISOString(),
        status: 'rodando'
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar novo timer:', error);
      return null;
    }

    return data as Timer;
  } catch (error) {
    console.error('Erro ao iniciar timer:', error);
    return null;
  }
}

// Função para pausar o timer ativo
export async function pauseActiveTimer(userId: string): Promise<Timer | null> {
  try {
    const activeTimer = await getActiveTimer(userId);
    if (!activeTimer) return null;

    const { data, error } = await supabase
      .from('timers')
      .update({
        ended_at: new Date().toISOString(),
        status: 'pausado'
      })
      .eq('id', activeTimer.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao pausar timer:', error);
      return null;
    }

    return data as Timer;
  } catch (error) {
    console.error('Erro ao pausar timer:', error);
    return null;
  }
}

// Função para finalizar o timer ativo
export async function finalizeActiveTimer(userId: string): Promise<Timer | null> {
  try {
    const activeTimer = await getActiveTimer(userId);
    if (!activeTimer) return null;

    const { data, error } = await supabase
      .from('timers')
      .update({
        ended_at: new Date().toISOString(),
        status: 'finalizado'
      })
      .eq('id', activeTimer.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao finalizar timer:', error);
      return null;
    }

    return data as Timer;
  } catch (error) {
    console.error('Erro ao finalizar timer:', error);
    return null;
  }
}

// Função para calcular o tempo decorrido baseado no timer
export function calculateTimerElapsed(timer: Timer): CalculatedTime {
  const startTime = new Date(timer.started_at);
  const endTime = timer.status === 'rodando' 
    ? new Date() 
    : new Date(timer.ended_at || timer.started_at);

  return calculateTimeDifference(startTime, endTime);
}

// Função para obter todos os timers do usuário
export async function getUserTimers(userId: string): Promise<Timer[]> {
  try {
    const { data, error } = await supabase
      .from('timers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar timers do usuário:', error);
      return [];
    }

    return (data as Timer[]) || [];
  } catch (error) {
    console.error('Erro ao buscar timers do usuário:', error);
    return [];
  }
}
