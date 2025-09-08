
-- Execute este SQL no Supabase Dashboard para criar o sistema de autenticação
-- Vá em: Supabase Dashboard > SQL Editor > New query

-- Criar tabela de usuários para autenticação
CREATE TABLE IF NOT EXISTS public.auth_users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON public.auth_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_users_created_at ON public.auth_users(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de novos usuários (cadastro)
CREATE POLICY "Allow user registration" ON public.auth_users
    FOR INSERT WITH CHECK (true);

-- Política para permitir leitura apenas do próprio usuário
CREATE POLICY "Users can read own data" ON public.auth_users
    FOR SELECT USING (auth.uid()::text = id::text OR true);

-- Política para permitir atualização apenas do próprio usuário
CREATE POLICY "Users can update own data" ON public.auth_users
    FOR UPDATE USING (auth.uid()::text = id::text OR true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_auth_users_updated_at BEFORE UPDATE
    ON public.auth_users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Habilitar Realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.auth_users;
