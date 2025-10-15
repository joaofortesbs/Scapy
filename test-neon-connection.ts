import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configuração do WebSocket para Node.js
neonConfig.webSocketConstructor = ws;

async function testNeonConnection() {
  console.log('🔍 Testando conexão com o banco Neon...\n');
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL não configurada!');
    process.exit(1);
  }
  
  console.log(`📍 DATABASE_URL: ${DATABASE_URL.substring(0, 50)}...`);
  
  const pool = new Pool({ 
    connectionString: DATABASE_URL,
    max: 1
  });
  
  try {
    // 1. Teste de conexão básica
    console.log('\n1️⃣ Testando conexão básica...');
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log('   Hora do servidor:', result.rows[0].current_time);
    console.log('   Versão PostgreSQL:', result.rows[0].pg_version.split(',')[0]);
    
    // 2. Criar tabela de teste se não existir
    console.log('\n2️⃣ Criando tabela de teste...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS minha_tabela (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela "minha_tabela" criada/verificada com sucesso!');
    
    // 3. Limpar dados anteriores de teste
    console.log('\n3️⃣ Limpando dados de teste anteriores...');
    const deleteResult = await pool.query("DELETE FROM minha_tabela WHERE nome LIKE 'teste%'");
    console.log(`✅ ${deleteResult.rowCount} registros de teste removidos`);
    
    // 4. Inserir registro de teste
    console.log('\n4️⃣ Inserindo registro de teste...');
    const insertResult = await pool.query(
      "INSERT INTO minha_tabela (nome) VALUES ($1) RETURNING *",
      [`teste_${new Date().getTime()}`]
    );
    console.log('✅ Registro inserido com sucesso:');
    console.log('   ID:', insertResult.rows[0].id);
    console.log('   Nome:', insertResult.rows[0].nome);
    console.log('   Criado em:', insertResult.rows[0].created_at);
    
    // 5. Ler registros da tabela
    console.log('\n5️⃣ Lendo registros da tabela...');
    const selectResult = await pool.query('SELECT * FROM minha_tabela ORDER BY id DESC LIMIT 5');
    console.log(`✅ ${selectResult.rowCount} registro(s) encontrado(s):`);
    selectResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ID: ${row.id}, Nome: ${row.nome}`);
    });
    
    // 6. Verificar tabelas existentes
    console.log('\n6️⃣ Listando tabelas no banco de dados...');
    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    console.log(`✅ ${tablesResult.rowCount} tabela(s) encontrada(s):`);
    tablesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.tablename}`);
    });
    
    console.log('\n✨ Teste concluído com sucesso! O banco Neon está funcionando corretamente.');
    
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão fechada.');
  }
}

// Executar o teste
testNeonConnection()
  .then(() => {
    console.log('\n✅ Todos os testes passaram!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha nos testes:', error.message);
    process.exit(1);
  });
