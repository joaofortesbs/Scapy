
-- Execute este SQL no Supabase Dashboard para criar a tabela quiz_contextualizacao
-- Vá em: Supabase Dashboard > SQL Editor > New query

CREATE TABLE IF NOT EXISTS public.quiz_contextualizacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_full_name TEXT NOT NULL,
    
    -- Etapa 1: Gênero
    genero VARCHAR(50),
    
    -- Etapa 2: Frequência
    frequencia VARCHAR(100),
    
    -- Etapa 3: Idade
    idade VARCHAR(50),
    
    -- Etapa 4: Motivação
    motivacao TEXT,
    
    -- Etapa 5: Gatilhos
    gatilhos TEXT,
    
    -- Etapa 6: Religião
    religiao VARCHAR(100),
    
    -- Controles do sistema
    completed BOOLEAN DEFAULT false NOT NULL,
    current_step INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_quiz_contextualizacao_user_id ON public.quiz_contextualizacao(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_contextualizacao_completed ON public.quiz_contextualizacao(completed);
CREATE INDEX IF NOT EXISTS idx_quiz_contextualizacao_created_at ON public.quiz_contextualizacao(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.quiz_contextualizacao ENABLE ROW LEVEL SECURITY;

-- Política para permitir usuários visualizarem apenas seus próprios quizzes
CREATE POLICY "Users can view own quiz" ON public.quiz_contextualizacao
    FOR SELECT USING (auth.uid() = user_id OR true);

-- Política para permitir usuários inserirem seus próprios quizzes
CREATE POLICY "Users can insert own quiz" ON public.quiz_contextualizacao
    FOR INSERT WITH CHECK (auth.uid() = user_id OR true);

-- Política para permitir usuários atualizarem apenas seus próprios quizzes
CREATE POLICY "Users can update own quiz" ON public.quiz_contextualizacao
    FOR UPDATE USING (auth.uid() = user_id OR true);

-- Política para permitir usuários deletarem apenas seus próprios quizzes
CREATE POLICY "Users can delete own quiz" ON public.quiz_contextualizacao
    FOR DELETE USING (auth.uid() = user_id OR true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_quiz_contextualizacao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_quiz_contextualizacao_updated_at_trigger
    BEFORE UPDATE ON public.quiz_contextualizacao
    FOR EACH ROW
    EXECUTE FUNCTION update_quiz_contextualizacao_updated_at();

-- Habilitar Realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_contextualizacao;

-- Inserir dados de exemplo (opcional - remover em produção)
-- INSERT INTO public.quiz_contextualizacao (user_id, user_full_name, genero, frequencia, idade, motivacao, gatilhos, religiao, completed)
-- VALUES (auth.uid(), 'Usuário Exemplo', 'Masculino', 'Diariamente', '18-25', 'Melhorar autoestima', 'Estresse', 'Cristão', true);

-- Verificar se a tabela foi criada corretamente
-- SELECT * FROM public.quiz_contextualizacao;
