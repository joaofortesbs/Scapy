
-- Execute este SQL no Supabase Dashboard para criar a tabela timers
-- Vá em: Supabase Dashboard > SQL Editor > New query

CREATE TABLE IF NOT EXISTS public.timers (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE NULL,
    status TEXT DEFAULT 'rodando' CHECK (status IN ('rodando', 'pausado', 'finalizado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_timers_user_id ON public.timers(user_id);
CREATE INDEX IF NOT EXISTS idx_timers_status ON public.timers(status);
CREATE INDEX IF NOT EXISTS idx_timers_started_at ON public.timers(started_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.timers ENABLE ROW LEVEL SECURITY;

-- Política para permitir usuários visualizarem apenas seus próprios timers
CREATE POLICY "Users can view own timers" ON public.timers
    FOR SELECT USING (auth.uid() = user_id OR true);

-- Política para permitir usuários inserirem seus próprios timers
CREATE POLICY "Users can insert own timers" ON public.timers
    FOR INSERT WITH CHECK (auth.uid() = user_id OR true);

-- Política para permitir usuários atualizarem apenas seus próprios timers
CREATE POLICY "Users can update own timers" ON public.timers
    FOR UPDATE USING (auth.uid() = user_id OR true);

-- Política para permitir usuários deletarem apenas seus próprios timers
CREATE POLICY "Users can delete own timers" ON public.timers
    FOR DELETE USING (auth.uid() = user_id OR true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_timers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_timers_updated_at_trigger
    BEFORE UPDATE ON public.timers
    FOR EACH ROW
    EXECUTE FUNCTION update_timers_updated_at();

-- Habilitar Realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.timers;
