
-- Execute este SQL no Supabase Dashboard para criar a tabela weekly_mood_tracking
-- Vá em: Supabase Dashboard > SQL Editor > New query

CREATE TABLE IF NOT EXISTS public.weekly_mood_tracking (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    week_start TIMESTAMP WITH TIME ZONE NOT NULL,
    monday_mood VARCHAR(50),
    tuesday_mood VARCHAR(50),
    wednesday_mood VARCHAR(50),
    thursday_mood VARCHAR(50),
    friday_mood VARCHAR(50),
    saturday_mood VARCHAR(50),
    sunday_mood VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_weekly_mood_tracking_user_id ON public.weekly_mood_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_mood_tracking_week_start ON public.weekly_mood_tracking(week_start);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_weekly_mood_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_weekly_mood_tracking_updated_at_trigger
    BEFORE UPDATE ON public.weekly_mood_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_weekly_mood_tracking_updated_at();

-- Adicionar comentários para documentação
COMMENT ON TABLE public.weekly_mood_tracking IS 'Armazena o humor selecionado para cada dia da semana';
COMMENT ON COLUMN public.weekly_mood_tracking.week_start IS 'Data de início da semana (domingo)';
COMMENT ON COLUMN public.weekly_mood_tracking.monday_mood IS 'Humor selecionado na segunda-feira';
COMMENT ON COLUMN public.weekly_mood_tracking.tuesday_mood IS 'Humor selecionado na terça-feira';
COMMENT ON COLUMN public.weekly_mood_tracking.wednesday_mood IS 'Humor selecionado na quarta-feira';
COMMENT ON COLUMN public.weekly_mood_tracking.thursday_mood IS 'Humor selecionado na quinta-feira';
COMMENT ON COLUMN public.weekly_mood_tracking.friday_mood IS 'Humor selecionado na sexta-feira';
COMMENT ON COLUMN public.weekly_mood_tracking.saturday_mood IS 'Humor selecionado no sábado';
COMMENT ON COLUMN public.weekly_mood_tracking.sunday_mood IS 'Humor selecionado no domingo';
