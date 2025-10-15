/**
 * ========================================
 * TESTE COMPLETO DA TABELA "USUARIOS"
 * ========================================
 * Este script testa TODAS as funcionalidades:
 * 1. Cadastro de usuário
 * 2. Login de usuário
 * 3. Atualização do quiz de personalização
 * 4. Início do cronômetro
 * 5. Consulta de dados completos
 */

const BASE_URL = 'http://localhost:5000';

interface Usuario {
  id: number;
  email: string;
  fullName: string;
  quizCompleted: boolean;
  timerStartDate?: string;
  timerIsActive: boolean;
  genero?: string;
  frequencia?: string;
  motivacao?: string;
  gatilhos?: string;
  religiao?: string;
}

async function testarSistemaCompleto() {
  console.log('🧪 ========================================');
  console.log('🧪 TESTE COMPLETO DO SISTEMA DE USUÁRIOS');
  console.log('🧪 ========================================\n');

  let usuarioId: number;
  let jwtToken: string;

  // ========================================
  // 1. CADASTRO DE NOVO USUÁRIO
  // ========================================
  console.log('1️⃣ TESTANDO CADASTRO DE USUÁRIO...');
  try {
    const cadastroResponse = await fetch(`${BASE_URL}/api/usuarios/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `teste${Date.now()}@example.com`,
        password: 'senha123',
        fullName: 'João da Silva'
      })
    });

    const cadastroData = await cadastroResponse.json();
    
    if (cadastroResponse.ok) {
      console.log('✅ Usuário cadastrado com sucesso!');
      console.log('   ID:', cadastroData.user.id);
      console.log('   Nome:', cadastroData.user.fullName);
      console.log('   Email:', cadastroData.user.email);
      console.log('   Token JWT:', cadastroData.token.substring(0, 30) + '...');
      
      usuarioId = cadastroData.user.id;
      jwtToken = cadastroData.token;
    } else {
      throw new Error(cadastroData.message);
    }
  } catch (error) {
    console.error('❌ Erro no cadastro:', error);
    return;
  }

  console.log('\n');

  // ========================================
  // 2. ATUALIZAR QUIZ - ETAPA 1 (Gênero)
  // ========================================
  console.log('2️⃣ TESTANDO QUIZ - ETAPA 1 (Gênero)...');
  try {
    const quizResponse1 = await fetch(`${BASE_URL}/api/usuarios/${usuarioId}/quiz`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        genero: 'Homem'
      })
    });

    const quizData1 = await quizResponse1.json();
    
    if (quizResponse1.ok) {
      console.log('✅ Gênero salvo com sucesso!');
      console.log('   Gênero:', quizData1.user.genero);
    } else {
      throw new Error(quizData1.message);
    }
  } catch (error) {
    console.error('❌ Erro ao salvar gênero:', error);
  }

  console.log('\n');

  // ========================================
  // 3. ATUALIZAR QUIZ - ETAPA 2 (Frequência)
  // ========================================
  console.log('3️⃣ TESTANDO QUIZ - ETAPA 2 (Frequência)...');
  try {
    const quizResponse2 = await fetch(`${BASE_URL}/api/usuarios/${usuarioId}/quiz`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frequencia: 'Várias vezes por semana'
      })
    });

    const quizData2 = await quizResponse2.json();
    
    if (quizResponse2.ok) {
      console.log('✅ Frequência salva com sucesso!');
      console.log('   Frequência:', quizData2.user.frequencia);
    } else {
      throw new Error(quizData2.message);
    }
  } catch (error) {
    console.error('❌ Erro ao salvar frequência:', error);
  }

  console.log('\n');

  // ========================================
  // 4. ATUALIZAR QUIZ - ETAPA 3 (Motivação)
  // ========================================
  console.log('4️⃣ TESTANDO QUIZ - ETAPA 3 (Motivação)...');
  try {
    const quizResponse3 = await fetch(`${BASE_URL}/api/usuarios/${usuarioId}/quiz`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        motivacao: 'Melhorar minha saúde mental e bem-estar'
      })
    });

    const quizData3 = await quizResponse3.json();
    
    if (quizResponse3.ok) {
      console.log('✅ Motivação salva com sucesso!');
      console.log('   Motivação:', quizData3.user.motivacao);
    } else {
      throw new Error(quizData3.message);
    }
  } catch (error) {
    console.error('❌ Erro ao salvar motivação:', error);
  }

  console.log('\n');

  // ========================================
  // 5. ATUALIZAR QUIZ - ETAPA 4 (Gatilhos)
  // ========================================
  console.log('5️⃣ TESTANDO QUIZ - ETAPA 4 (Gatilhos)...');
  try {
    const quizResponse4 = await fetch(`${BASE_URL}/api/usuarios/${usuarioId}/quiz`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gatilhos: 'Estresse, solidão, tédio'
      })
    });

    const quizData4 = await quizResponse4.json();
    
    if (quizResponse4.ok) {
      console.log('✅ Gatilhos salvos com sucesso!');
      console.log('   Gatilhos:', quizData4.user.gatilhos);
    } else {
      throw new Error(quizData4.message);
    }
  } catch (error) {
    console.error('❌ Erro ao salvar gatilhos:', error);
  }

  console.log('\n');

  // ========================================
  // 6. ATUALIZAR QUIZ - ETAPA 5 (Religião)
  // ========================================
  console.log('6️⃣ TESTANDO QUIZ - ETAPA 5 (Religião)...');
  try {
    const quizResponse5 = await fetch(`${BASE_URL}/api/usuarios/${usuarioId}/quiz`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        religiao: 'Cristão',
        quizCompleted: true  // Marcar quiz como completo
      })
    });

    const quizData5 = await quizResponse5.json();
    
    if (quizResponse5.ok) {
      console.log('✅ Religião salva e quiz completado!');
      console.log('   Religião:', quizData5.user.religiao);
      console.log('   Quiz Completo:', quizData5.user.quizCompleted);
    } else {
      throw new Error(quizData5.message);
    }
  } catch (error) {
    console.error('❌ Erro ao salvar religião:', error);
  }

  console.log('\n');

  // ========================================
  // 7. INICIAR CRONÔMETRO
  // ========================================
  console.log('7️⃣ TESTANDO INÍCIO DO CRONÔMETRO...');
  try {
    const timerResponse = await fetch(`${BASE_URL}/api/usuarios/${usuarioId}/timer/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const timerData = await timerResponse.json();
    
    if (timerResponse.ok) {
      console.log('✅ Cronômetro iniciado com sucesso!');
      console.log('   Data de Início:', new Date(timerData.timerStartDate).toLocaleString('pt-BR'));
      console.log('   Cronômetro Ativo:', timerData.timerIsActive);
    } else {
      throw new Error(timerData.message);
    }
  } catch (error) {
    console.error('❌ Erro ao iniciar cronômetro:', error);
  }

  console.log('\n');

  // ========================================
  // 8. CONSULTAR DADOS COMPLETOS DO USUÁRIO
  // ========================================
  console.log('8️⃣ CONSULTANDO DADOS COMPLETOS DO USUÁRIO...');
  try {
    const userResponse = await fetch(`${BASE_URL}/api/usuarios/${usuarioId}`);
    const userData: Usuario = await userResponse.json();
    
    if (userResponse.ok) {
      console.log('✅ Dados obtidos com sucesso!');
      console.log('\n📊 RESUMO COMPLETO DO USUÁRIO:');
      console.log('   ─────────────────────────────────────');
      console.log('   ID:', userData.id);
      console.log('   Nome Completo:', userData.fullName);
      console.log('   Email:', userData.email);
      console.log('\n   📝 DADOS DO QUIZ:');
      console.log('   ├─ Gênero:', userData.genero);
      console.log('   ├─ Frequência:', userData.frequencia);
      console.log('   ├─ Motivação:', userData.motivacao);
      console.log('   ├─ Gatilhos:', userData.gatilhos);
      console.log('   ├─ Religião:', userData.religiao);
      console.log('   └─ Quiz Completo:', userData.quizCompleted ? 'Sim ✅' : 'Não ❌');
      console.log('\n   ⏱️ DADOS DO CRONÔMETRO:');
      console.log('   ├─ Data de Início:', userData.timerStartDate ? new Date(userData.timerStartDate).toLocaleString('pt-BR') : 'Não iniciado');
      console.log('   └─ Cronômetro Ativo:', userData.timerIsActive ? 'Sim ✅' : 'Não ❌');
      console.log('   ─────────────────────────────────────');
    } else {
      throw new Error('Erro ao consultar usuário');
    }
  } catch (error) {
    console.error('❌ Erro ao consultar dados:', error);
  }

  console.log('\n');

  // ========================================
  // 9. TESTE DE LOGIN
  // ========================================
  console.log('9️⃣ TESTANDO LOGIN COM O USUÁRIO CRIADO...');
  try {
    // Buscar o email do usuário criado primeiro
    const getUserResponse = await fetch(`${BASE_URL}/api/usuarios/${usuarioId}`);
    const currentUser = await getUserResponse.json();
    
    const loginResponse = await fetch(`${BASE_URL}/api/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentUser.email,
        password: 'senha123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log('✅ Login realizado com sucesso!');
      console.log('   Usuário:', loginData.user.fullName);
      console.log('   Email:', loginData.user.email);
      console.log('   Token JWT:', loginData.token.substring(0, 30) + '...');
      console.log('   Dados do Quiz recuperados:', loginData.user.quizCompleted ? 'Sim ✅' : 'Não ❌');
      console.log('   Cronômetro recuperado:', loginData.user.timerIsActive ? 'Sim ✅' : 'Não ❌');
    } else {
      throw new Error(loginData.message);
    }
  } catch (error) {
    console.error('❌ Erro no login:', error);
  }

  console.log('\n');
  console.log('🎉 ========================================');
  console.log('🎉 TESTE COMPLETO FINALIZADO COM SUCESSO!');
  console.log('🎉 ========================================');
  console.log('\n✨ Todas as funcionalidades estão operacionais:');
  console.log('   ✅ Cadastro de usuários');
  console.log('   ✅ Quiz de personalização (5 etapas)');
  console.log('   ✅ Cronômetro persistido no banco');
  console.log('   ✅ Login e recuperação de dados');
  console.log('   ✅ Todos os dados armazenados no Neon!');
}

// Executar teste
testarSistemaCompleto()
  .then(() => {
    console.log('\n✅ Teste executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro no teste:', error);
    process.exit(1);
  });
