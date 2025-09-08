import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWeeklyProgressSchema, insertUserGoalsSchema, quizContextualizacao, insertQuizContextualizacaoSchema } from "@shared/schema";
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {

  // Inicializar Supabase cliente
  const supabaseUrl = process.env.SUPABASE_URL || 'https://ddatgvruplfcutjwores.supabase.co';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYXRndnJ1cGxmY3V0andvcmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMzQ3NjcsImV4cCI6MjA3MjcxMDc2N30.gkE2EWLU7gvxonWptK_bbiRuAm1d6xIxLVeCYegA5es';
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYXRndnJ1cGxmY3V0andvcmVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEzNDc2NywiZXhwIjoyMDcyNzEwNzY3fQ.MWY548tNrRJsr-uIxSwWz4Vd6q9YE58bf9XQrKvhAZE';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
  
  // Direct PostgreSQL connection for bypassing Supabase cache issues
  const sql = neon(process.env.DATABASE_URL!);

  // ========== ROTAS DE AUTENTICAÇÃO ==========

  // Rota de Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
      }

      // Buscar usuário pelo email
      const { data: user, error } = await supabase
        .from('auth_users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('is_active', true)
        .single();

      if (error || !user) {
        return res.status(401).json({ message: 'Email ou senha inválidos' });
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Email ou senha inválidos' });
      }

      // Atualizar último login
      await supabase
        .from('auth_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // Retornar dados do usuário (sem a senha)
      const userData = {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at,
        lastLogin: new Date().toISOString()
      };

      res.json({ 
        message: 'Login realizado com sucesso!',
        user: userData,
        token: `auth_${user.id}_${Date.now()}`
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Rota de Cadastro
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, fullName } = req.body;

      // Validações
      if (!email || !password || !fullName) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Email inválido' });
      }

      // Verificar se o email já existe
      const { data: existingUser } = await supabase
        .from('auth_users')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (existingUser) {
        return res.status(409).json({ message: 'Este email já está cadastrado' });
      }

      // Hash da senha
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Criar usuário
      const { data: newUser, error } = await supabase
        .from('auth_users')
        .insert([{
          email: email.toLowerCase().trim(),
          password_hash: passwordHash,
          full_name: fullName.trim(),
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar usuário:', error);
        return res.status(500).json({ message: 'Erro ao criar conta. Tente novamente.' });
      }

      res.status(201).json({ 
        message: 'Conta criada com sucesso!',
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.full_name,
          createdAt: newUser.created_at
        }
      });

    } catch (error) {
      console.error('Erro no cadastro:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Rota para verificar se usuário está autenticado
  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token não fornecido' });
      }

      const token = authHeader.substring(7);

      // Extrair ID do usuário do token (formato: auth_ID_timestamp)
      const tokenParts = token.split('_');
      if (tokenParts.length !== 3 || tokenParts[0] !== 'auth') {
        return res.status(401).json({ message: 'Token inválido' });
      }

      const userId = parseInt(tokenParts[1]);

      // Buscar usuário
      const { data: user, error } = await supabase
        .from('auth_users')
        .select('id, email, full_name, created_at, last_login, is_active')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        return res.status(401).json({ message: 'Usuário não encontrado' });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          createdAt: user.created_at,
          lastLogin: user.last_login
        }
      });

    } catch (error) {
      console.error('Erro na verificação de autenticação:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // ========== ROTAS DE PERFIL DO USUÁRIO ==========

  // Atualizar perfil do usuário
  // Get upload URL for profile image
  app.post("/api/users/profile-image/upload-url", async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'ID do usuário é obrigatório' });
      }

      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getProfileImageUploadURL(userId);
      res.json({ uploadURL });

    } catch (error) {
      console.error('Erro ao obter URL de upload:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.patch("/api/users/update-profile", async (req, res) => {
    try {
      const { userId, profileImage, fullName } = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'ID do usuário é obrigatório' });
      }

      const updateData: any = {};
      if (profileImage) {
        const objectStorageService = new ObjectStorageService();
        updateData.profileImage = objectStorageService.normalizeProfileImagePath(profileImage);
      }
      if (fullName) updateData.fullName = fullName;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'Nenhum dado para atualizar' });
      }

      // Build the update query dynamically
      let updateFields = [];
      let values = [];
      let placeholderIndex = 1;
      
      if (updateData.profileImage) {
        updateFields.push(`profile_image = $${placeholderIndex++}`);
        values.push(updateData.profileImage);
      }
      if (updateData.fullName) {
        updateFields.push(`full_name = $${placeholderIndex++}`);
        values.push(updateData.fullName);
      }
      
      values.push(userId); // Add userId as the last parameter
      
      const updateQuery = `
        UPDATE auth_users 
        SET ${updateFields.join(', ')}
        WHERE id = $${placeholderIndex}
        RETURNING id, email, full_name, profile_image
      `;
      
      const result = await sql(updateQuery, values);

      if (result.length === 0) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      const updatedUser = result[0];
      res.json({
        message: 'Perfil atualizado com sucesso!',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.full_name,
          profileImage: updatedUser.profile_image
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
  app.post("/api/timer/start", async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'ID do usuário é obrigatório' });
      }

      // Get current user data
      const { data: user, error: fetchError } = await supabase
        .from('auth_users')
        .select('*')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (fetchError || !user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Create timer start time
      const timerStartDate = new Date().toISOString();

      // Save timer using direct SQL to bypass Supabase cache issues
      try {
        const timerData = await sql`
          INSERT INTO timers (user_id, start_date, is_active)
          VALUES (${userId}, ${timerStartDate}, true)
          RETURNING *
        `;

        console.log('Timer salvo no banco:', timerData[0]);
      } catch (sqlError) {
        console.error('Erro ao salvar timer no banco:', sqlError);
        return res.status(500).json({ message: 'Erro ao salvar timer no banco de dados' });
      }

      // Return user data with timer start date
      const userData = {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        startDate: timerStartDate // Current time as start date
      };

      res.json({ 
        message: 'Cronômetro iniciado com sucesso!',
        user: userData,
        timerStarted: true
      });

    } catch (error) {
      console.error('Erro ao iniciar cronômetro:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Check if user has active timer
  app.get("/api/timer/status/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      // Check if user has an active timer using direct SQL to bypass Supabase cache
      try {
        const timerData = await sql`
          SELECT * FROM timers 
          WHERE user_id = ${userId} AND is_active = true 
          ORDER BY created_at DESC 
          LIMIT 1
        `;

        const hasActiveTimer = timerData.length > 0;
        const latestTimer = hasActiveTimer ? timerData[0] : null;

        res.json({
          hasActiveTimer,
          timer: latestTimer,
          startDate: latestTimer ? latestTimer.start_date : null
        });
      } catch (sqlError) {
        console.error('Erro ao verificar timer via SQL:', sqlError);
        return res.status(500).json({ message: 'Erro ao verificar timer' });
      }

    } catch (error) {
      console.error('Erro ao verificar status do timer:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Get timer data for user
  app.get("/api/timer/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const { data: user, error } = await supabase
        .from('auth_users')
        .select('id, email, full_name, created_at, last_login')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      const userData = {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        startDate: user.created_at // Use created_at as startDate
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
      const existingQuiz = await sql`
        SELECT * FROM quiz_contextualizacao 
        WHERE user_id = ${userId.toString()}
      `;

      if (existingQuiz.length > 0) {
        return res.json({ quiz: existingQuiz[0] });
      }

      // Criar novo quiz
      const newQuiz = await sql`
        INSERT INTO quiz_contextualizacao (user_id, user_full_name)
        VALUES (${userId.toString()}, ${userFullName})
        RETURNING *
      `;

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

      // Usar query SQL direta para atualizar
      const updateQuery = `
        UPDATE quiz_contextualizacao 
        SET ${stepInfo.column} = $1, current_step = $2, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $3::text
        RETURNING *
      `;

      const updatedQuiz = await sql(updateQuery, [stepValue, stepInfo.step, userId.toString()]);

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

      const completedQuiz = await sql`
        UPDATE quiz_contextualizacao 
        SET completed = true, current_step = 8, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId.toString()}
        RETURNING *
      `;

      console.log('Quiz completado:', completedQuiz);

      if (completedQuiz.length === 0) {
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

      const quiz = await sql`
        SELECT * FROM quiz_contextualizacao 
        WHERE user_id = ${userId}
      `;

      if (quiz.length === 0) {
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
      const resetQuiz = await sql`
        UPDATE quiz_contextualizacao 
        SET 
          genero = null,
          frequencia = null,
          idade = null,
          motivacao = null,
          gatilhos = null,
          religiao = null,
          completed = false,
          current_step = 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId.toString()}
        RETURNING *
      `;

      if (resetQuiz.length === 0) {
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

      const deletedQuiz = await sql`
        DELETE FROM quiz_contextualizacao 
        WHERE user_id = ${userId}
        RETURNING *
      `;

      if (deletedQuiz.length === 0) {
        return res.status(404).json({ message: 'Quiz não encontrado' });
      }

      res.json({ message: 'Quiz deletado com sucesso' });

    } catch (error) {
      console.error('Erro ao deletar quiz:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}