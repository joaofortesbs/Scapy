-- Corrigir tabela quiz_contextualizacao
DROP TABLE IF EXISTS public.quiz_contextualizacao CASCADE;

CREATE TABLE IF NOT EXISTS public.quiz_contextualizacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL,
    user_full_name TEXT NOT NULL,
    
    -- Etapas do quiz
    genero VARCHAR(50),
    frequencia VARCHAR(100),
    idade VARCHAR(50),
    motivacao TEXT,
    gatilhos TEXT,
    religiao VARCHAR(100),
    
    -- Controles do sistema
    completed BOOLEAN DEFAULT false NOT NULL,
    current_step INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_quiz_contextualizacao_user_id ON public.quiz_contextualizacao(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_contextualizacao_completed ON public.quiz_contextualizacao(completed);

-- DESABILITAR RLS temporariamente para testes
ALTER TABLE public.quiz_contextualizacao DISABLE ROW LEVEL SECURITY;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_quiz_contextualizacao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_quiz_contextualizacao_updated_at_trigger ON public.quiz_contextualizacao;
CREATE TRIGGER update_quiz_contextualizacao_updated_at_trigger
    BEFORE UPDATE ON public.quiz_contextualizacao
    FOR EACH ROW
    EXECUTE FUNCTION update_quiz_contextualizacao_updated_at();
