import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configuração unificada para desenvolvimento e produção
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('🔗 [DATABASE] Conectando ao Neon Database:', process.env.DATABASE_URL?.substring(0, 50) + '...');

// Pool de conexões otimizado para ambos os ambientes
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20,
  min: 2,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 600000,
  allowExitOnIdle: false
});

// Drizzle ORM com schema completo
export const db = drizzle({ 
  client: pool, 
  schema,
  logger: process.env.NODE_ENV === 'development'
});

// Teste de conectividade na inicialização
pool.on('connect', () => {
  console.log('✅ [DATABASE] Conexão estabelecida com sucesso');
});

pool.on('error', (err) => {
  console.error('❌ [DATABASE] Erro na conexão:', err);
});
