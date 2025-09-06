import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWeeklyProgressSchema, insertUserGoalsSchema } from "@shared/schema";
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function registerRoutes(app: Express): Promise<Server> {

  // Inicializar Supabase cliente
  const supabaseUrl = process.env.SUPABASE_URL || 'https://ddatgvruplfcutjwores.supabase.co';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYXRndnJ1cGxmY3V0andvcmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMzQ3NjcsImV4cCI6MjA3MjcxMDc2N30.gkE2EWLU7gvxonWptK_bbiRuAm1d6xIxLVeCYegA5es';
  const supabase = createClient(supabaseUrl, supabaseKey);

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

      const userId = tokenParts[1];

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

  // Rota para iniciar o timer
  app.post("/api/timer/start", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token não fornecido' });
      }

      const token = authHeader.substring(7);
      const tokenParts = token.split('_');

      if (tokenParts.length !== 3 || tokenParts[0] !== 'auth') {
        return res.status(401).json({ message: 'Token inválido' });
      }

      const userId = tokenParts[1];

      // Verificar se usuário existe
      const { data: user, error: userError } = await supabase
        .from('auth_users')
        .select('id')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (userError || !user) {
        return res.status(401).json({ message: 'Usuário não encontrado' });
      }

      // Verificar se já existe um timer ativo para este usuário
      const { data: existingTimer } = await supabase
        .from('timer')
        .select('id, start_time')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      let timerData;

      if (existingTimer && existingTimer.length > 0) {
        // Se já existe timer, retorna o existente
        timerData = existingTimer[0];
      } else {
        // Criar novo timer
        const startTime = new Date().toISOString();

        const { data: newTimer, error: timerError } = await supabase
          .from('timer')
          .insert({
            user_id: userId,
            start_time: startTime
          })
          .select()
          .single();

        if (timerError) {
          console.error('Erro ao criar timer:', timerError);
          return res.status(500).json({ message: 'Erro ao iniciar timer' });
        }

        timerData = newTimer;
      }

      res.json({
        message: 'Timer iniciado com sucesso',
        timer: {
          id: timerData.id,
          startTime: timerData.start_time,
          userId: userId
        }
      });

    } catch (error) {
      console.error('Erro ao iniciar timer:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Rota para obter dados do timer
  app.get("/api/timer", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token não fornecido' });
      }

      const token = authHeader.substring(7);
      const tokenParts = token.split('_');

      if (tokenParts.length !== 3 || tokenParts[0] !== 'auth') {
        return res.status(401).json({ message: 'Token inválido' });
      }

      const userId = tokenParts[1];

      // Buscar timer mais recente do usuário
      const { data: timer, error } = await supabase
        .from('timer')
        .select('id, start_time, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Erro ao buscar timer:', error);
        return res.status(500).json({ message: 'Erro ao buscar timer' });
      }

      if (!timer || timer.length === 0) {
        return res.json({ timer: null });
      }

      res.json({
        timer: {
          id: timer[0].id,
          startTime: timer[0].start_time,
          createdAt: timer[0].created_at
        }
      });

    } catch (error) {
      console.error('Erro ao buscar timer:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}