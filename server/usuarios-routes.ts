import type { Express } from "express";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import bcrypt from 'bcryptjs';
import { 
  usuarios, 
  insertUsuarioSchema, 
  updateUsuarioQuizSchema,
  updateUsuarioTimerSchema
} from "@shared/schema";
import { generateJWT } from "./auth-middleware";
import { ZodError } from 'zod';

/**
 * ========================================
 * ROTAS DA TABELA CONSOLIDADA "USUARIOS"
 * ========================================
 * Esta tabela contém TODOS os dados do usuário:
 * - Cadastro (id, nome, email)
 * - Quiz de personalização (gênero, frequência, motivação, gatilhos, religião)
 * - Cronômetro (timer_start_date)
 */

export function registerUsuariosRoutes(app: Express) {

  // ========================================
  // 🔐 CADASTRO DE NOVO USUÁRIO
  // ========================================
  app.post("/api/usuarios/register", async (req, res) => {
    try {
      const { email, password, fullName } = req.body;

      // Validar dados
      if (!email || !password || !fullName) {
        return res.status(400).json({ 
          message: 'Todos os campos são obrigatórios' 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          message: 'A senha deve ter pelo menos 6 caracteres' 
        });
      }

      // Verificar se email já existe
      const existingUser = await db.select()
        .from(usuarios)
        .where(eq(usuarios.email, email.toLowerCase().trim()))
        .limit(1);

      if (existingUser && existingUser.length > 0) {
        return res.status(409).json({ 
          message: 'Este email já está cadastrado' 
        });
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(password, 10);

      // Criar novo usuário na tabela consolidada
      const newUser = await db.insert(usuarios)
        .values({
          email: email.toLowerCase().trim(),
          passwordHash: passwordHash,
          nomeCompleto: fullName,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      const user = newUser[0];

      // Gerar token JWT
      const jwtToken = generateJWT(user.id, user.email, user.isActive);

      console.log('✅ [USUARIOS] Novo usuário cadastrado:', user.id, user.email);

      // Retornar dados do usuário
      res.status(201).json({
        message: 'Usuário cadastrado com sucesso!',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.nomeCompleto,
          quizCompleted: user.quizCompleted,
          timerIsActive: user.timerIsActive
        },
        token: jwtToken,
        isNewUser: true
      });

    } catch (error) {
      console.error('❌ [USUARIOS] Erro no cadastro:', error);
      res.status(500).json({ 
        message: 'Erro ao cadastrar usuário' 
      });
    }
  });

  // ========================================
  // 🔓 LOGIN DE USUÁRIO
  // ========================================
  app.post("/api/usuarios/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          message: 'Email e senha são obrigatórios' 
        });
      }

      // Buscar usuário
      const user = await db.select()
        .from(usuarios)
        .where(and(
          eq(usuarios.email, email.toLowerCase().trim()),
          eq(usuarios.isActive, true)
        ))
        .limit(1);

      if (!user || user.length === 0) {
        return res.status(401).json({ 
          message: 'Email ou senha inválidos' 
        });
      }

      const usuario = user[0];

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, usuario.passwordHash);

      if (!isPasswordValid) {
        return res.status(401).json({ 
          message: 'Email ou senha inválidos' 
        });
      }

      // Atualizar último login
      await db.update(usuarios)
        .set({ 
          lastLogin: new Date(),
          updatedAt: new Date()
        })
        .where(eq(usuarios.id, usuario.id));

      // Gerar token JWT
      const jwtToken = generateJWT(usuario.id, usuario.email, usuario.isActive);

      console.log('✅ [USUARIOS] Login realizado:', usuario.id, usuario.email);

      // Retornar dados completos do usuário incluindo cronômetro
      res.json({
        message: 'Login realizado com sucesso!',
        user: {
          id: usuario.id,
          email: usuario.email,
          fullName: usuario.nomeCompleto,
          quizCompleted: usuario.quizCompleted,
          timerStartDate: usuario.timerStartDate,
          timerIsActive: usuario.timerIsActive,
          // Dados do quiz (se já preenchidos)
          genero: usuario.genero,
          frequencia: usuario.frequencia,
          motivacao: usuario.motivacao,
          gatilhos: usuario.gatilhos,
          religiao: usuario.religiao
        },
        token: jwtToken
      });

    } catch (error) {
      console.error('❌ [USUARIOS] Erro no login:', error);
      res.status(500).json({ 
        message: 'Erro ao fazer login' 
      });
    }
  });

  // ========================================
  // 📖 BUSCAR DADOS DO USUÁRIO
  // ========================================
  app.get("/api/usuarios/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      // Buscar usuário
      const user = await db.select()
        .from(usuarios)
        .where(and(
          eq(usuarios.id, userId),
          eq(usuarios.isActive, true)
        ))
        .limit(1);

      if (!user || user.length === 0) {
        return res.status(404).json({ 
          message: 'Usuário não encontrado' 
        });
      }

      const usuario = user[0];

      console.log('✅ [USUARIOS] Dados buscados:', userId);

      // Retornar dados completos do usuário
      res.json({
        user: {
          id: usuario.id,
          email: usuario.email,
          fullName: usuario.nomeCompleto,
          quizCompleted: usuario.quizCompleted,
          timerStartDate: usuario.timerStartDate,
          timerIsActive: usuario.timerIsActive,
          // Dados do quiz
          genero: usuario.genero,
          frequencia: usuario.frequencia,
          motivacao: usuario.motivacao,
          gatilhos: usuario.gatilhos,
          religiao: usuario.religiao
        }
      });

    } catch (error) {
      console.error('❌ [USUARIOS] Erro ao buscar usuário:', error);
      res.status(500).json({ 
        message: 'Erro ao buscar dados do usuário' 
      });
    }
  });

  // ========================================
  // 📝 ATUALIZAR DADOS DO QUIZ
  // ========================================
  app.put("/api/usuarios/:userId/quiz", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const quizData = updateUsuarioQuizSchema.parse(req.body);

      // Atualizar dados do quiz
      const updated = await db.update(usuarios)
        .set({
          ...quizData,
          updatedAt: new Date()
        })
        .where(eq(usuarios.id, userId))
        .returning();

      if (!updated || updated.length === 0) {
        return res.status(404).json({ 
          message: 'Usuário não encontrado' 
        });
      }

      console.log('✅ [USUARIOS] Quiz atualizado para usuário:', userId);

      res.json({
        message: 'Dados do quiz salvos com sucesso!',
        user: updated[0]
      });

    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Dados inválidos',
          errors: error.errors 
        });
      }
      console.error('❌ [USUARIOS] Erro ao atualizar quiz:', error);
      res.status(500).json({ 
        message: 'Erro ao salvar dados do quiz' 
      });
    }
  });

  // ========================================
  // ⏱️ INICIAR CRONÔMETRO
  // ========================================
  app.post("/api/usuarios/:userId/timer/start", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      // Verificar se usuário existe
      const user = await db.select()
        .from(usuarios)
        .where(eq(usuarios.id, userId))
        .limit(1);

      if (!user || user.length === 0) {
        return res.status(404).json({ 
          message: 'Usuário não encontrado' 
        });
      }

      const timerStartDate = new Date();

      // Atualizar cronômetro
      const updated = await db.update(usuarios)
        .set({
          timerStartDate: timerStartDate,
          timerIsActive: true,
          updatedAt: new Date()
        })
        .where(eq(usuarios.id, userId))
        .returning();

      console.log('✅ [USUARIOS] Cronômetro iniciado para usuário:', userId);

      res.json({
        message: 'Cronômetro iniciado com sucesso!',
        timerStartDate: timerStartDate.toISOString(),
        timerIsActive: true,
        user: updated[0]
      });

    } catch (error) {
      console.error('❌ [USUARIOS] Erro ao iniciar cronômetro:', error);
      res.status(500).json({ 
        message: 'Erro ao iniciar cronômetro' 
      });
    }
  });

  // ========================================
  // 🛑 PARAR CRONÔMETRO
  // ========================================
  app.post("/api/usuarios/:userId/timer/stop", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      // Atualizar cronômetro
      const updated = await db.update(usuarios)
        .set({
          timerIsActive: false,
          updatedAt: new Date()
        })
        .where(eq(usuarios.id, userId))
        .returning();

      if (!updated || updated.length === 0) {
        return res.status(404).json({ 
          message: 'Usuário não encontrado' 
        });
      }

      console.log('✅ [USUARIOS] Cronômetro pausado para usuário:', userId);

      res.json({
        message: 'Cronômetro pausado com sucesso!',
        timerIsActive: false,
        user: updated[0]
      });

    } catch (error) {
      console.error('❌ [USUARIOS] Erro ao parar cronômetro:', error);
      res.status(500).json({ 
        message: 'Erro ao parar cronômetro' 
      });
    }
  });

  // ========================================
  // 🔄 RESETAR CRONÔMETRO
  // ========================================
  app.post("/api/usuarios/:userId/timer/reset", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      const newStartDate = new Date();

      // Resetar cronômetro
      const updated = await db.update(usuarios)
        .set({
          timerStartDate: newStartDate,
          timerIsActive: true,
          updatedAt: new Date()
        })
        .where(eq(usuarios.id, userId))
        .returning();

      if (!updated || updated.length === 0) {
        return res.status(404).json({ 
          message: 'Usuário não encontrado' 
        });
      }

      console.log('✅ [USUARIOS] Cronômetro resetado para usuário:', userId);

      res.json({
        message: 'Cronômetro resetado com sucesso!',
        timerStartDate: newStartDate.toISOString(),
        timerIsActive: true,
        user: updated[0]
      });

    } catch (error) {
      console.error('❌ [USUARIOS] Erro ao resetar cronômetro:', error);
      res.status(500).json({ 
        message: 'Erro ao resetar cronômetro' 
      });
    }
  });

  console.log('✅ Rotas da tabela USUARIOS registradas com sucesso!');
}
