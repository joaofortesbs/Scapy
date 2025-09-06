
import { createClient } from '@supabase/supabase-js';

// Verificar se as variáveis de ambiente existem
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL não está definida nas variáveis de ambiente');
}

if (!supabaseKey) {
  throw new Error('SUPABASE_ANON_KEY não está definida nas variáveis de ambiente');
}

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Função para inserir usuário
export async function insertUser(name) {
  try {
    console.log(`Tentando inserir usuário: ${name}`);
    
    const { data, error } = await supabase
      .from('users')
      .insert([{ name }])
      .select();

    if (error) {
      console.error('Erro ao inserir usuário:', error.message);
      throw error;
    }

    console.log('Usuário inserido com sucesso:', data[0]);
    return data[0];
  } catch (error) {
    console.error('Erro na função insertUser:', error);
    throw error;
  }
}

// Função para recuperar todos os usuários
export async function getUsers() {
  try {
    console.log('Buscando todos os usuários...');
    
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error('Erro ao buscar usuários:', error.message);
      throw error;
    }

    console.log('Usuários encontrados:', data);
    return data;
  } catch (error) {
    console.error('Erro na função getUsers:', error);
    throw error;
  }
}

// Configurar Realtime subscription
export function setupRealtimeSubscription() {
  console.log('Configurando subscription Realtime para tabela users...');
  
  const channel = supabase
    .channel('users-changes')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'users' 
      },
      (payload) => {
        console.log('Mudança detectada na tabela users:', payload);
      }
    )
    .subscribe((status) => {
      console.log('Status da subscription:', status);
    });

  return channel;
}

// Teste de conexão
export async function testConnection() {
  try {
    console.log('Testando conexão com Supabase...');
    
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('Erro na conexão:', error.message);
      return false;
    }

    console.log('Conexão com Supabase estabelecida com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao testar conexão:', error);
    return false;
  }
}
