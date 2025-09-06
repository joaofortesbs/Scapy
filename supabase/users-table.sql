
-- Execute este SQL no Supabase Dashboard para criar a tabela users
-- Vá em: Supabase Dashboard > SQL Editor > New query

CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura a usuários anônimos
CREATE POLICY "Allow anonymous read access" ON public.users
    FOR SELECT USING (true);

-- Política para permitir inserção a usuários anônimos  
CREATE POLICY "Allow anonymous insert access" ON public.users
    FOR INSERT WITH CHECK (true);

-- Habilitar Realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
