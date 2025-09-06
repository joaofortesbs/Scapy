
-- Execute este SQL no Supabase Dashboard para criar a tabela timer
-- Vá em: Supabase Dashboard > SQL Editor > New query

CREATE TABLE IF NOT EXISTS public.timer (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.auth_users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.timer ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view own timer" ON public.timer 
  FOR SELECT USING (user_id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY "Users can insert own timer" ON public.timer 
  FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY "Users can update own timer" ON public.timer 
  FOR UPDATE USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_timer_user_id ON public.timer(user_id);
CREATE INDEX IF NOT EXISTS idx_timer_start_time ON public.timer(start_time DESC);
