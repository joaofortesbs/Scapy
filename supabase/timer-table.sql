
-- Execute este SQL no Supabase Dashboard para criar/atualizar a tabela timer
-- Vá em: Supabase Dashboard > SQL Editor > New query

-- Primeiro, vamos remover a tabela existente se ela existir
DROP TABLE IF EXISTS public.timer;

-- Criar a tabela timer com referência correta ao auth.users
CREATE TABLE public.timer (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.timer ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se existirem
DROP POLICY IF EXISTS "Users can view own timer" ON public.timer;
DROP POLICY IF EXISTS "Users can insert own timer" ON public.timer;
DROP POLICY IF EXISTS "Users can update own timer" ON public.timer;

-- Políticas de segurança corrigidas
CREATE POLICY "Users can view own timer" ON public.timer 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own timer" ON public.timer 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timer" ON public.timer 
  FOR UPDATE USING (auth.uid() = user_id);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_timer_user_id ON public.timer(user_id);
CREATE INDEX IF NOT EXISTS idx_timer_start_time ON public.timer(start_time DESC);

-- Conceder permissões necessárias
GRANT ALL ON public.timer TO authenticated;
GRANT ALL ON public.timer TO anon;
