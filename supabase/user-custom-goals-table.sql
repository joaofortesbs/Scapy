
-- Execute este SQL no Supabase Dashboard para criar a tabela user_custom_goals
-- Vá em: Supabase Dashboard > SQL Editor > New query

CREATE TABLE IF NOT EXISTS public.user_custom_goals (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(50) DEFAULT 'personal',
    prioridade INTEGER DEFAULT 3 NOT NULL,
    concluida BOOLEAN DEFAULT false NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_custom_goals_user_id ON public.user_custom_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_goals_date ON public.user_custom_goals(date);
CREATE INDEX IF NOT EXISTS idx_user_custom_goals_categoria ON public.user_custom_goals(categoria);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_custom_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_custom_goals_updated_at_trigger
    BEFORE UPDATE ON public.user_custom_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_user_custom_goals_updated_at();

-- Adicionar comentários para documentação
COMMENT ON TABLE public.user_custom_goals IS 'Armazena metas personalizadas criadas pelos usuários';
COMMENT ON COLUMN public.user_custom_goals.titulo IS 'Título da meta personalizada';
COMMENT ON COLUMN public.user_custom_goals.descricao IS 'Descrição detalhada da meta (opcional)';
COMMENT ON COLUMN public.user_custom_goals.categoria IS 'Categoria da meta (personal, exercicio, meditacao, etc.)';
COMMENT ON COLUMN public.user_custom_goals.prioridade IS 'Prioridade da meta (1-5)';
COMMENT ON COLUMN public.user_custom_goals.concluida IS 'Status de conclusão da meta';
COMMENT ON COLUMN public.user_custom_goals.date IS 'Data da meta (usado para agrupamento diário)';
