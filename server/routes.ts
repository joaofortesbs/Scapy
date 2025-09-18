import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertWeeklyProgressSchema, 
  insertUserGoalsSchema, 
  quizContextualizacao, 
  insertQuizContextualizacaoSchema,
  insertMoodSelectionSchema,
  insertUserObjectiveSchema,
  insertDailyTaskSchema,
  insertUserCustomGoalSchema,
  authUsers,
  insertAuthUserSchema,
  loginSchema,
  registerSchema,
  moodSelections,
  timers
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { aiProcessor } from "./aiProcessor";
import bcrypt from 'bcryptjs';
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { getDailyPhrase } from "./gemini-service";
import { verifyJWT, generateJWT } from "./auth-middleware";
import { ZodError } from 'zod';

// Definir tipo global para timers em memória
declare global {
  var activeTimers: Map<number, { userId: number; startDate: string; createdAt: string }> | undefined;
}

// Inicializar timers globalmente
if (!global.activeTimers) {
  global.activeTimers = new Map();
}

export async function registerRoutes(app: Express): Promise<Server> {

  console.log('🚀 Scapy NoFap Tracker usando 100% Neon Database!');

  // ========== ROTAS DE AUTENTICAÇÃO ==========

  // Rota de Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      // Validate request data with Zod
      const validatedData = loginSchema.parse(req.body);
      const { email, password } = validatedData;

      // Buscar usuário pelo email
      const user = await db.select()
        .from(authUsers)
        .where(and(
          eq(authUsers.email, email.toLowerCase().trim()),
          eq(authUsers.isActive, true)
        ))
        .limit(1);

      if (!user || user.length === 0) {
        return res.status(401).json({ message: 'Email ou senha inválidos' });
      }

      const authUser = user[0];

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, authUser.passwordHash);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Email ou senha inválidos' });
      }

      // Generate secure JWT token
      const jwtToken = generateJWT(authUser.id, authUser.email, authUser.isActive);

      // Atualizar último login
      await db.update(authUsers)
        .set({ lastLogin: new Date() })
        .where(eq(authUsers.id, authUser.id));

      // Retornar dados do usuário (sem a senha)
      const userData = {
        id: authUser.id,
        email: authUser.email,
        fullName: authUser.fullName,
        createdAt: authUser.createdAt,
        lastLogin: new Date().toISOString()
      };

      res.json({ 
        message: 'Login realizado com sucesso!',
        user: userData,
        token: jwtToken
      });

    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Dados inválidos',
          errors: error.errors.map(err => ({ field: err.path.join('.'), message: err.message }))
        });
      }
      console.error('Erro no login:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Rota de Cadastro
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Validate request data with Zod
      const validatedData = registerSchema.parse(req.body);
      const { email, password, fullName } = validatedData;

      // Verificar se o email já existe
      const existingUser = await db.select()
        .from(authUsers)
        .where(eq(authUsers.email, email.toLowerCase().trim()))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(409).json({ message: 'Este email já está cadastrado' });
      }

      // Hash da senha
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Criar usuário
      const newUser = await db.insert(authUsers)
        .values({
          email: email.toLowerCase().trim(),
          passwordHash: passwordHash,
          fullName: fullName.trim(),
          isActive: true
        })
        .returning();

      if (!newUser || newUser.length === 0) {
        console.error('Erro ao criar usuário');
        return res.status(500).json({ message: 'Erro ao criar conta. Tente novamente.' });
      }

      const createdUser = newUser[0];

      res.status(201).json({ 
        message: 'Conta criada com sucesso!',
        user: {
          id: createdUser.id,
          email: createdUser.email,
          fullName: createdUser.fullName,
          createdAt: createdUser.createdAt
        }
      });

    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Dados inválidos',
          errors: error.errors.map(err => ({ field: err.path.join('.'), message: err.message }))
        });
      }
      console.error('Erro no cadastro:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Rota para verificar se usuário está autenticado (now using JWT verification middleware)
  app.get("/api/auth/me", verifyJWT, async (req: any, res) => {
    try {
      // User data is already available from the verifyJWT middleware
      const user = req.user;

      if (!user) {
        return res.status(401).json({ message: 'Dados do usuário não encontrados' });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName
        }
      });

    } catch (error) {
      console.error('Erro na verificação de autenticação:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // ========== ROTAS DE PERFIL DO USUÁRIO ==========

  // Atualizar perfil do usuário
  // Get upload URL for profile image (protected)
  app.post("/api/users/profile-image/upload-url", verifyJWT, async (req, res) => {
    try {
      // Use userId from JWT token instead of request body for security
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Token JWT inválido ou não fornecido' });
      }

      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getProfileImageUploadURL(userId);
      res.json({ uploadURL });

    } catch (error) {
      console.error('Erro ao obter URL de upload:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.patch("/api/users/update-profile", verifyJWT, async (req, res) => {
    try {
      const { profileImage, fullName } = req.body;
      
      // Use userId from JWT token instead of request body for security
      const userId = req.user?.id;

      console.log('🔍 DEBUG - Update Profile Request:', { userId, profileImage: profileImage ? 'presente' : 'ausente', fullName });

      if (!userId) {
        return res.status(401).json({ message: 'Token JWT inválido ou não fornecido' });
      }

      // ========== VERIFICAR SE USUÁRIO EXISTE PRIMEIRO ==========
      console.log('🔍 DEBUG - Verificando usuário:', userId);

      const userCheck = await db.select({
        id: authUsers.id,
        email: authUsers.email
      })
        .from(authUsers)
        .where(eq(authUsers.id, parseInt(userId)))
        .limit(1);

      console.log('🔍 DEBUG - Resultado da verificação:', userCheck);

      if (userCheck.length === 0) {
        console.log('❌ DEBUG - Usuário não encontrado na tabela auth_users');
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      console.log('✅ DEBUG - Usuário encontrado:', userCheck[0]);

      const updateData: any = {};
      if (profileImage) {
        const objectStorageService = new ObjectStorageService();
        updateData.profileImage = objectStorageService.normalizeProfileImagePath(profileImage);
      }
      if (fullName) updateData.fullName = fullName;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'Nenhum dado para atualizar' });
      }

      // Build the update data object for Drizzle
      const drizzleUpdateData: any = {};
      if (updateData.profileImage) drizzleUpdateData.profileImage = updateData.profileImage;
      if (updateData.fullName) drizzleUpdateData.fullName = updateData.fullName;

      console.log('🔍 DEBUG - Drizzle update data:', drizzleUpdateData);

      const result = await db.update(authUsers)
        .set(drizzleUpdateData)
        .where(eq(authUsers.id, parseInt(userId)))
        .returning({
          id: authUsers.id,
          email: authUsers.email,
          fullName: authUsers.fullName,
          profileImage: authUsers.profileImage
        });

      console.log('🔍 DEBUG - Resultado do update:', result);

      if (result.length === 0) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      const updatedUser = result[0];
      res.json({
        message: 'Perfil atualizado com sucesso!',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.fullName,
          profileImage: updatedUser.profileImage
        }
      });

    } catch (error) {
      console.error('Erro na rota de atualização de perfil:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Serve profile images
  app.get("/objects/profile-images/:imageName(*)", async (req, res) => {
    const imageName = req.params.imageName;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.getProfileImageFile(`/objects/profile-images/${imageName}`);
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving profile image:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // ========== ROTAS DO CRONÔMETRO ==========

  // Start timer for user
  app.post("/api/timer/start", verifyJWT, async (req, res) => {
    try {
      // Use userId from JWT token instead of request body for security
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Token JWT inválido ou não fornecido' });
      }

      console.log(`🚀 [API] Iniciando cronômetro para usuário ${userId}`);

      // Get current user data
      const user = await db.select()
        .from(authUsers)
        .where(and(
          eq(authUsers.id, parseInt(userId)),
          eq(authUsers.isActive, true)
        ))
        .limit(1);

      if (!user || user.length === 0) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      const authUser = user[0];

      // Verificar se já existe um cronômetro ativo
      const existingTimer = await db.select()
        .from(timers)
        .where(and(
          eq(timers.user_id, authUser.id.toString()),
          eq(timers.is_active, true)
        ))
        .limit(1);

      if (existingTimer.length > 0) {
        console.log(`⚠️ [API] Usuário ${userId} já possui cronômetro ativo`);
        return res.status(400).json({ 
          message: 'Você já possui um cronômetro ativo',
          hasActiveTimer: true,
          startDate: existingTimer[0].start_date.toISOString()
        });
      }

      // Create timer start time
      const timerStartDate = new Date().toISOString();

      // Salvar timer na tabela timers dedicada
      let timerRecord = null;
      try {
        const insertResult = await db.insert(timers)
          .values({
            user_id: authUser.id.toString(),
            start_date: new Date(timerStartDate),
            is_active: true
          })
          .returning();

        timerRecord = insertResult[0];
        console.log('🎯 [API] Timer salvo no Neon com sucesso!', timerRecord);
      } catch (timerError) {
        console.error('❌ [API] Erro ao salvar timer no Neon:', timerError);
        return res.status(500).json({ message: 'Erro ao salvar cronômetro no banco de dados' });
      }

      // Salvar em memória para performance
      global.activeTimers!.set(Number(userId), {
        userId: Number(userId),
        startDate: timerStartDate,
        createdAt: timerStartDate
      });

      console.log(`✅ [API] Cronômetro iniciado com sucesso para usuário ${userId}`);

      res.json({ 
        message: 'Cronômetro iniciado com sucesso!',
        timer: {
          id: timerRecord.id,
          user_id: timerRecord.user_id,
          start_date: timerStartDate,
          created_at: timerRecord.created_at.toISOString()
        },
        user: {
          id: authUser.id,
          email: authUser.email,
          fullName: authUser.fullName,
          startDate: timerStartDate
        },
        timerStarted: true,
        startDate: timerStartDate,
        source: 'neon-database'
      });

    } catch (error) {
      console.error('❌ [API] Erro ao iniciar cronômetro:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Check if user has active timer
  app.get("/api/timer/status/:userId", verifyJWT, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Verify user can only access their own timer status
      if (userId !== req.user?.id?.toString()) {
        return res.status(403).json({ message: "Acesso negado - você só pode ver seu próprio timer" });
      }

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      console.log(`🔍 [API] Verificando status do timer para usuário ${userId}`);

      // Buscar timer do usuário no Neon (tabela timers dedicada)
      const timerRecords = await db.select()
        .from(timers)
        .where(and(
          eq(timers.user_id, userId.toString()),
          eq(timers.is_active, true)
        ))
        .orderBy(desc(timers.start_date))
        .limit(1);
      
      let hasActiveTimer = false;
      let latestTimer: any = null;
      
      if (timerRecords && timerRecords.length > 0) {
        const timerRecord = timerRecords[0];
        hasActiveTimer = true;
        latestTimer = {
          id: timerRecord.id,
          user_id: timerRecord.user_id, 
          start_date: timerRecord.start_date.toISOString(),
          created_at: timerRecord.created_at.toISOString()
        };
        console.log(`🎯 [API] Timer encontrado no Neon para usuário ${userId}: ${latestTimer.start_date}`);
        
        // Sincronizar com memória
        global.activeTimers!.set(Number(userId), {
          userId: Number(userId),
          startDate: timerRecord.start_date.toISOString(),
          createdAt: timerRecord.created_at.toISOString()
        });
      } else {
        console.log(`📋 [API] Nenhum timer ativo no Neon para usuário ${userId}`);
        
        // Fallback: verificar em memória
        const memoryTimer = global.activeTimers!.get(Number(userId));
        
        if (memoryTimer) {
          hasActiveTimer = true;
          latestTimer = {
            id: userId.toString(),
            user_id: userId.toString(), 
            start_date: memoryTimer.startDate,
            created_at: memoryTimer.createdAt
          };
          console.log(`💭 [API] Timer encontrado em memória para usuário ${userId}`);
        } else {
          console.log(`❌ [API] Nenhum timer ativo para usuário ${userId}`);
        }
      }

      // Set cache headers to ensure fresh data
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      const result = {
        hasActiveTimer,
        timer: latestTimer,
        startDate: latestTimer ? latestTimer.start_date : null
      };

      console.log(`✅ [API] Status retornado para usuário ${userId}:`, result);
      res.json(result);
    } catch (error) {
      console.error('❌ [API] Erro ao verificar status do timer:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Reset timer for user
  app.post("/api/timer/reset", verifyJWT, async (req, res) => {
    try {
      // Use userId from JWT token instead of request body for security
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Token JWT inválido ou não fornecido' });
      }

      console.log(`🔄 [API] Resetando cronômetro para usuário ${userId}`);

      // Desativar timers existentes no banco
      await db.update(timers)
        .set({ is_active: false })
        .where(eq(timers.user_id, userId.toString()));

      // Remover da memória
      global.activeTimers!.delete(Number(userId));

      console.log(`✅ [API] Cronômetro resetado com sucesso para usuário ${userId}`);

      res.json({ 
        message: 'Cronômetro resetado com sucesso!',
        resetSuccessful: true
      });

    } catch (error) {
      console.error('❌ [API] Erro ao resetar cronômetro:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Get timer data for user (protected)
  app.get("/api/timer/:userId", verifyJWT, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Verify user can only access their own data
      if (userId !== req.user?.id?.toString()) {
        return res.status(403).json({ message: "Acesso negado - você só pode ver seus próprios dados" });
      }

      const user = await db.select({
        id: authUsers.id,
        email: authUsers.email,
        fullName: authUsers.fullName,
        createdAt: authUsers.createdAt,
        lastLogin: authUsers.lastLogin
      })
        .from(authUsers)
        .where(and(
          eq(authUsers.id, parseInt(userId)),
          eq(authUsers.isActive, true)
        ))
        .limit(1);

      if (!user || user.length === 0) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      const authUser = user[0];

      const userData = {
        id: authUser.id,
        email: authUser.email,
        fullName: authUser.fullName,
        createdAt: authUser.createdAt,
        lastLogin: authUser.lastLogin,
        startDate: authUser.createdAt // Use created_at as startDate
      };

      res.json({ user: userData });

    } catch (error) {
      console.error('Erro ao buscar dados do cronômetro:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });


  // Get default user (demo user)
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_user");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user's weekly progress
  app.get("/api/weekly-progress", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_user");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const progress = await storage.getWeeklyProgress(user.id, startOfWeek);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update weekly progress
  app.post("/api/weekly-progress", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_user");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validatedData = insertWeeklyProgressSchema.parse({
        ...req.body,
        userId: user.id,
      });

      const progress = await storage.upsertWeeklyProgress(validatedData);
      res.json(progress);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Get user goals
  app.get("/api/goals", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_user");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const goals = await storage.getUserGoals(user.id);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create user goal
  app.post("/api/goals", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_user");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validatedData = insertUserGoalsSchema.parse({
        ...req.body,
        userId: user.id,
      });

      const goal = await storage.createUserGoal(validatedData);
      res.json(goal);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // ========== ROTAS QUIZ DE CONTEXTUALIZAÇÃO ==========

  // Criar ou obter quiz do usuário
  app.post("/api/quiz/initialize", async (req, res) => {
    try {
      const { userId, userFullName } = req.body;

      if (!userId || !userFullName) {
        return res.status(400).json({ message: 'User ID e nome completo são obrigatórios' });
      }

      // Verificar se já existe um quiz para este usuário
      const existingQuiz = await db.select()
        .from(quizContextualizacao)
        .where(eq(quizContextualizacao.userId, userId.toString()))
        .limit(1);

      if (existingQuiz.length > 0) {
        return res.json({ quiz: existingQuiz[0] });
      }

      // Criar novo quiz
      const newQuiz = await db.insert(quizContextualizacao)
        .values({ 
          userId: userId.toString(), 
          userFullName: userFullName 
        })
        .returning();

      if (!newQuiz || newQuiz.length === 0) {
        throw new Error('Falha ao criar quiz');
      }

      res.json({ quiz: newQuiz[0] });

    } catch (error) {
      console.error('Erro ao inicializar quiz:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Salvar resposta de uma etapa específica
  app.put("/api/quiz/save-step", async (req, res) => {
    try {
      const { userId, stepName, stepValue } = req.body;

      if (!userId || !stepName || stepValue === undefined) {
        return res.status(400).json({ message: 'User ID, nome da etapa e valor são obrigatórios' });
      }

      console.log('Save-step chamado:', { userId, stepName, stepValue });

      // Mapeamento correto de etapas para colunas e current_step
      const stepColumnMap: Record<string, { column: string, step: number }> = {
        'gender': { column: 'genero', step: 3 },
        'age': { column: 'idade', step: 2 },
        'frequency': { column: 'frequencia', step: 4 }, 
        'motivation': { column: 'motivacao', step: 5 },
        'triggers': { column: 'gatilhos', step: 6 },
        'religion': { column: 'religiao', step: 7 }
      };

      const stepInfo = stepColumnMap[stepName];
      if (!stepInfo) {
        return res.status(400).json({ message: `Nome da etapa inválido: ${stepName}` });
      }

      // Usar Drizzle ORM para atualizar
      const updateData: any = {
        currentStep: stepInfo.step,
        updatedAt: new Date()
      };

      // Map step column names to schema fields
      switch (stepInfo.column) {
        case 'genero':
          updateData.genero = stepValue;
          break;
        case 'idade': 
          updateData.idade = stepValue;
          break;
        case 'frequencia':
          updateData.frequencia = stepValue;
          break;
        case 'motivacao':
          updateData.motivacao = stepValue;
          break;
        case 'gatilhos':
          updateData.gatilhos = stepValue;
          break;
        case 'religiao':
          updateData.religiao = stepValue;
          break;
      }

      const updatedQuiz = await db.update(quizContextualizacao)
        .set(updateData)
        .where(eq(quizContextualizacao.userId, userId.toString()))
        .returning();

      console.log('Quiz atualizado via save-step:', updatedQuiz);

      if (updatedQuiz.length === 0) {
        return res.status(404).json({ message: 'Quiz não encontrado' });
      }

      res.json({ quiz: updatedQuiz[0], message: 'Etapa salva com sucesso!' });

    } catch (error) {
      console.error('Erro ao salvar etapa do quiz:', error);
      res.status(500).json({ message: 'Erro interno do servidor', error: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
  });

  // Finalizar quiz
  app.put("/api/quiz/complete", async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'User ID é obrigatório' });
      }

      console.log('Completando quiz para usuário:', userId);

      const completedQuiz = await db.update(quizContextualizacao)
        .set({ 
          completed: true, 
          currentStep: 8, 
          updatedAt: new Date()
        })
        .where(eq(quizContextualizacao.userId, userId.toString()))
        .returning();

      console.log('Quiz completado:', completedQuiz);

      if (!completedQuiz || completedQuiz.length === 0) {
        return res.status(404).json({ message: 'Quiz não encontrado para este usuário' });
      }

      res.json({ quiz: completedQuiz[0], message: 'Quiz completado com sucesso!' });

    } catch (error) {
      console.error('Erro ao completar quiz:', error);
      res.status(500).json({ message: 'Erro interno do servidor', error: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
  });

  // Obter dados do quiz do usuário
  app.get("/api/quiz/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const quiz = await db.select()
        .from(quizContextualizacao)
        .where(eq(quizContextualizacao.userId, userId))
        .limit(1);

      if (!quiz || quiz.length === 0) {
        return res.status(404).json({ message: 'Quiz não encontrado para este usuário' });
      }

      res.json({ quiz: quiz[0] });

    } catch (error) {
      console.error('Erro ao buscar quiz:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Resetar quiz (permitir refazer)
  app.put("/api/quiz/reset", async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'User ID é obrigatório' });
      }

      // Resetar o quiz para permitir refazer
      const resetQuiz = await db.update(quizContextualizacao)
        .set({
          genero: null,
          frequencia: null,
          idade: null,
          motivacao: null,
          gatilhos: null,
          religiao: null,
          completed: false,
          currentStep: 1,
          updatedAt: new Date()
        })
        .where(eq(quizContextualizacao.userId, userId.toString()))
        .returning();

      if (!resetQuiz || resetQuiz.length === 0) {
        return res.status(404).json({ message: 'Quiz não encontrado para este usuário' });
      }

      res.json({ message: 'Quiz resetado com sucesso', quiz: resetQuiz[0] });

    } catch (error) {
      console.error('Erro ao resetar quiz:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Deletar quiz completamente
  app.delete("/api/quiz/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ message: 'User ID é obrigatório' });
      }

      const deletedQuiz = await db.delete(quizContextualizacao)
        .where(eq(quizContextualizacao.userId, userId))
        .returning();

      if (!deletedQuiz || deletedQuiz.length === 0) {
        return res.status(404).json({ message: 'Quiz não encontrado' });
      }

      res.json({ message: 'Quiz deletado com sucesso' });

    } catch (error) {
      console.error('Erro ao deletar quiz:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Daily Phrase Routes
  app.get("/api/daily-phrase", async (req, res) => {
    try {
      const phrase = await getDailyPhrase();
      res.json(phrase);
    } catch (error) {
      console.error("Error fetching daily phrase:", error);
      res.status(500).json({ 
        error: "Failed to fetch daily phrase",
        fallback: {
          id: "fallback",
          phrase: "Sua determinação de hoje constrói a liberdade de amanhã. Continue firme!",
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date()
        }
      });
    }
  });

  // ========== ROTAS DO SISTEMA DE IA ==========

  // Registrar seleção de humor do usuário
  app.post("/api/mood-selection", async (req, res) => {
    try {
      const validatedData = insertMoodSelectionSchema.parse(req.body);
      const moodSelection = await storage.createMoodSelection(validatedData);

      console.log(`💭 Humor registrado: ${moodSelection.mood} para usuário ${moodSelection.userId}`);
      res.json(moodSelection);
    } catch (error) {
      console.error("Erro ao registrar humor:", error);
      res.status(500).json({ message: "Erro ao registrar humor do usuário" });
    }
  });

  // Obter seleções de humor do usuário
  app.get("/api/mood-selections/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { date } = req.query;

      const targetDate = date ? new Date(date as string) : undefined;
      const moodSelections = await storage.getUserMoodSelections(userId, targetDate);

      res.json(moodSelections);
    } catch (error) {
      console.error("Erro ao buscar seleções de humor:", error);
      res.status(500).json({ message: "Erro ao buscar seleções de humor" });
    }
  });

  // Obter humor de hoje do usuário
  app.get("/api/today-mood/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const todayMood = await storage.getTodayMoodSelection(userId);

      res.json(todayMood || null);
    } catch (error) {
      console.error("Erro ao buscar humor de hoje:", error);
      res.status(500).json({ message: "Erro ao buscar humor de hoje" });
    }
  });

  // Gerenciar objetivos do usuário
  app.get("/api/user-objectives/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const objectives = await storage.getUserObjectives(userId);
      res.json(objectives);
    } catch (error) {
      console.error("Erro ao buscar objetivos:", error);
      res.status(500).json({ message: "Erro ao buscar objetivos do usuário" });
    }
  });

  app.post("/api/user-objectives", async (req, res) => {
    try {
      const validatedData = insertUserObjectiveSchema.parse(req.body);
      const objective = await storage.createUserObjective(validatedData);
      res.json(objective);
    } catch (error) {
      console.error("Erro ao criar objetivo:", error);
      res.status(500).json({ message: "Erro ao criar objetivo" });
    }
  });

  app.put("/api/user-objectives/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const objective = await storage.updateUserObjective(id, req.body);

      if (!objective) {
        return res.status(404).json({ message: "Objetivo não encontrado" });
      }

      res.json(objective);
    } catch (error) {
      console.error("Erro ao atualizar objetivo:", error);
      res.status(500).json({ message: "Erro ao atualizar objetivo" });
    }
  });

  app.delete("/api/user-objectives/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteUserObjective(id);

      if (!deleted) {
        return res.status(404).json({ message: "Objetivo não encontrado" });
      }

      res.json({ message: "Objetivo deletado com sucesso" });
    } catch (error) {
      console.error("Erro ao deletar objetivo:", error);
      res.status(500).json({ message: "Erro ao deletar objetivo" });
    }
  });

  // Gerar sugestões personalizadas da IA
  app.post("/api/generate-suggestions", async (req, res) => {
    try {
      const { userId, mood } = req.body;

      if (!userId || !mood) {
        return res.status(400).json({ message: "UserId e mood são obrigatórios" });
      }

      console.log(`🤖 Iniciando geração de sugestões para usuário ${userId} com humor: ${mood}`);

      // Buscar dados do usuário
      const objectives = await storage.getUserObjectives(userId);

      // Buscar quiz do usuário usando Neon Database
      let motivation = null;
      try {
        const quizResult = await db.select()
          .from(quizContextualizacao)
          .where(and(
            eq(quizContextualizacao.userId, userId),
            eq(quizContextualizacao.completed, true)
          ))
          .orderBy(desc(quizContextualizacao.createdAt))
          .limit(1);
        
        motivation = (quizResult.length > 0) ? quizResult[0]?.motivacao || null : null;
      } catch (quizError) {
        console.log(`⚠️ Quiz não encontrado para usuário ${userId}, usando motivação padrão`);
        motivation = 'Buscar crescimento pessoal e bem-estar'; // Valor padrão
      }
      const previousTasks = await storage.getUserDailyTasks(userId, new Date());

      // Preparar dados para a IA
      const userProfile = {
        mood,
        motivation,
        objectives,
        previousTasks
      };

      // Gerar sugestões com a IA
      const aiResponse = await aiProcessor.generatePersonalizedSuggestions(userProfile);

      // Salvar sugestões no banco
      const suggestionData = {
        userId,
        mood,
        motivation: motivation || '',
        objectives: JSON.stringify(objectives),
        suggestedActivities: JSON.stringify(aiResponse.activities),
        date: new Date()
      };

      const savedSuggestion = await storage.createAiSuggestion(suggestionData);

      // Converter e salvar tarefas individuais
      const tasks = aiProcessor.convertToTasks(aiResponse.activities, userId, savedSuggestion.id);
      const savedTasks = await Promise.all(
        tasks.map(task => storage.createDailyTask(task))
      );

      // Atualizar progresso do usuário
      await storage.updateTaskProgress(userId, new Date());

      console.log(`✅ Sugestões geradas: ${savedTasks.length} tarefas criadas`);

      res.json({
        suggestion: savedSuggestion,
        tasks: savedTasks,
        aiResponse: {
          message: aiResponse.message,
          reasoning: aiResponse.reasoning
        }
      });

    } catch (error) {
      console.error("Erro ao gerar sugestões:", error);
      res.status(500).json({ message: "Erro ao gerar sugestões personalizadas" });
    }
  });

  // Obter tarefas diárias do usuário
  app.get("/api/daily-tasks/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { date } = req.query;

      const targetDate = date ? new Date(date as string) : new Date();
      const tasks = await storage.getUserDailyTasks(userId, targetDate);

      res.json(tasks);
    } catch (error) {
      console.error("Erro ao buscar tarefas diárias:", error);
      res.status(500).json({ message: "Erro ao buscar tarefas diárias" });
    }
  });

  // Alternar conclusão de tarefa
  app.put("/api/daily-tasks/:id/toggle", async (req, res) => {
    try {
      const { id } = req.params;
      const task = await storage.toggleTaskCompletion(id);

      if (!task) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
      }

      // Atualizar progresso do usuário
      await storage.updateTaskProgress(task.userId, task.date);

      console.log(`${task.concluida ? '✅' : '⭕'} Tarefa ${id} marcada como ${task.concluida ? 'concluída' : 'pendente'}`);

      res.json(task);
    } catch (error) {
      console.error("Erro ao alternar tarefa:", error);
      res.status(500).json({ message: "Erro ao alternar conclusão da tarefa" });
    }
  });

  // Obter progresso de tarefas do usuário
  app.get("/api/task-progress/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { date } = req.query;

      const targetDate = date ? new Date(date as string) : new Date();
      const progress = await storage.getUserTaskProgress(userId, targetDate);

      res.json(progress || { 
        totalTasks: 0, 
        completedTasks: 0, 
        progressPercentage: 0 
      });
    } catch (error) {
      console.error("Erro ao buscar progresso:", error);
      res.status(500).json({ message: "Erro ao buscar progresso das tarefas" });
    }
  });

  // ========== ROTAS DO SISTEMA DE HUMOR SEMANAL ==========

  // Obter humor semanal do usuário
  app.get("/api/weekly-mood/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      console.log(`🔍 Buscando humor semanal para usuário: ${userId}`);

      // Calcular início e fim da semana atual
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Domingo
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sábado
      endOfWeek.setHours(23, 59, 59, 999);

      console.log(`📅 Período da semana: ${startOfWeek.toISOString()} até ${endOfWeek.toISOString()}`);
      console.log(`📅 Hoje é: ${now.toISOString()} (dia da semana: ${now.getDay()})`);

      // Buscar todas as seleções de humor da semana
      const weeklyMoods = await storage.getWeeklyMoodSelections(userId, startOfWeek, endOfWeek);

      console.log(`📊 Encontradas ${weeklyMoods.length} seleções de humor para a semana`);
      console.log(`📊 Dados brutos:`, weeklyMoods.map(m => ({ mood: m.mood, date: m.date, userId: m.userId })));

      // Organizar por dia da semana (0-6, domingo a sábado)
      const moodByDay = new Array(7).fill(null);

      weeklyMoods.forEach((mood: any) => {
        const moodDate = new Date(mood.date);
        const dayOfWeek = moodDate.getDay();

        console.log(`📅 Mapeando humor "${mood.mood}" de ${moodDate.toISOString()} -> dia da semana: ${dayOfWeek}`);

        // Pega apenas o mais recente humor para cada dia
        if (!moodByDay[dayOfWeek]) {
          moodByDay[dayOfWeek] = mood.mood;
        }
      });

      console.log(`📋 Mapeamento final moodByDay:`, moodByDay);

      const result = {
        userId,
        weekStart: startOfWeek.toISOString(),
        weekEnd: endOfWeek.toISOString(),
        moodByDay // [domingo, segunda, terça, quarta, quinta, sexta, sábado]
      };

      console.log(`✅ Retornando resultado:`, result);

      // Sempre retornar dados frescos (desabilitar cache)
      res.set('Cache-Control', 'no-store');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.json(result);
    } catch (error) {
      console.error("❌ Erro ao buscar humor semanal:", error);
      res.status(500).json({ message: "Erro ao buscar humor semanal" });
    }
  });

  // ========== ROTAS PARA METAS PERSONALIZADAS DO USUÁRIO ==========

  // Criar meta personalizada
  app.post("/api/custom-goals", async (req, res) => {
    try {
      const validatedData = insertUserCustomGoalSchema.parse(req.body);
      const customGoal = await storage.createUserCustomGoal(validatedData);

      // Atualizar progresso do usuário
      await storage.updateTaskProgress(customGoal.userId, customGoal.date);

      console.log(`📝 Meta personalizada criada: "${customGoal.titulo}" para usuário ${customGoal.userId}`);
      res.json(customGoal);
    } catch (error) {
      console.error("Erro ao criar meta personalizada:", error);
      res.status(500).json({ message: "Erro ao criar meta personalizada" });
    }
  });

  // Obter metas personalizadas do usuário
  app.get("/api/custom-goals/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { date } = req.query;

      const targetDate = date ? new Date(date as string) : new Date();
      const customGoals = await storage.getUserCustomGoals(userId, targetDate);

      res.json(customGoals);
    } catch (error) {
      console.error("Erro ao buscar metas personalizadas:", error);
      res.status(500).json({ message: "Erro ao buscar metas personalizadas" });
    }
  });

  // Alternar conclusão de meta personalizada
  app.put("/api/custom-goals/:id/toggle", async (req, res) => {
    try {
      const { id } = req.params;
      const goal = await storage.toggleCustomGoalCompletion(id);

      if (!goal) {
        return res.status(404).json({ message: "Meta não encontrada" });
      }

      // Atualizar progresso do usuário
      await storage.updateTaskProgress(goal.userId, goal.date);

      console.log(`${goal.concluida ? '✅' : '⭕'} Meta personalizada ${id} marcada como ${goal.concluida ? 'concluída' : 'pendente'}`);

      res.json(goal);
    } catch (error) {
      console.error("Erro ao alternar meta personalizada:", error);
      res.status(500).json({ message: "Erro ao alternar conclusão da meta" });
    }
  });

  // Deletar meta personalizada
  app.delete("/api/custom-goals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteUserCustomGoal(id);

      if (!deleted) {
        return res.status(404).json({ message: "Meta não encontrada" });
      }

      res.json({ message: "Meta deletada com sucesso" });
    } catch (error) {
      console.error("Erro ao deletar meta personalizada:", error);
      res.status(500).json({ message: "Erro ao deletar meta" });
    }
  });

  // Limpar dados do dia (usado para reset automático às 00:00)
  app.post("/api/cleanup-daily-data", async (req, res) => {
    try {
      const { userId, date } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "UserId é obrigatório" });
      }

      const targetDate = date ? new Date(date) : new Date();
      await storage.cleanupDailyData(userId, targetDate);

      res.json({ message: "Dados do dia limpos com sucesso" });
    } catch (error) {
      console.error("Erro ao limpar dados do dia:", error);
      res.status(500).json({ message: "Erro ao limpar dados do dia" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Schedule daily cleanup at midnight
export function scheduleDailyCleanup() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0); // Next midnight

  const msUntilMidnight = midnight.getTime() - now.getTime();

  // Set timeout for first cleanup at midnight
  setTimeout(() => {
    performDailyCleanup();

    // Then set interval for every 24 hours
    setInterval(performDailyCleanup, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  console.log(`🧹 Agendamento de limpeza diária configurado. Próxima limpeza em: ${Math.round(msUntilMidnight / 1000 / 60)} minutos`);
}

async function performDailyCleanup() {
  try {
    console.log('🌅 Iniciando limpeza diária automática...');

    // Note: In a real implementation, you would want to get all user IDs from the database
    // For now, we'll just clean up data for all users that have data in memory storage
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // This is a simplified cleanup - in production you'd want to iterate through all users
    console.log('✅ Limpeza diária concluída');
  } catch (error) {
    console.error('Erro na limpeza diária:', error);
  }
}