-- Garantir integridade da tabela quiz_contextualizacao
-- Execute no Supabase SQL Editor

-- Verificar se a tabela existe e tem a estrutura correta
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quiz_contextualizacao' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar dados existentes
SELECT 
    id,
    user_id,
    user_full_name,
    genero,
    frequencia,
    motivacao,
    gatilhos,
    religiao,
    completed,
    current_step,
    created_at,
    updated_at
FROM public.quiz_contextualizacao 
ORDER BY created_at DESC;

-- Verificar se há problemas de integridade
SELECT 
    qc.user_id,
    qc.user_full_name,
    au.full_name as auth_user_name,
    qc.completed
FROM public.quiz_contextualizacao qc
LEFT JOIN public.auth_users au ON qc.user_id::integer = au.id
ORDER BY qc.created_at DESC;
