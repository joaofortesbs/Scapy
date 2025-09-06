import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWeeklyProgressSchema, insertUserGoalsSchema } from "@shared/schema";
import { createClient } from '@supabase/supabase-js';

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Inicializar Supabase cliente
  const supabaseUrl = process.env.SUPABASE_URL || 'https://ddatgvruplfcutjwores.supabase.co';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYXRndnJ1cGxmY3V0andvcmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMzQ3NjcsImV4cCI6MjA3MjcxMDc2N30.gkE2EWLU7gvxonWptK_bbiRuAm1d6xIxLVeCYegA5es';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Rotas do Supabase para gerenciamento de usuários
  app.get("/api/supabase/users", async (req, res) => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        return res.status(500).json({ message: 'Erro ao buscar usuários', error: error.message });
      }

      res.json({ users });
    } catch (error) {
      console.error('Erro na requisição:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.post("/api/supabase/users", async (req, res) => {
    try {
      const { name } = req.body;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: 'Nome é obrigatório' });
      }

      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{ name: name.trim() }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar usuário:', error);
        return res.status(500).json({ message: 'Erro ao criar usuário', error: error.message });
      }

      res.status(201).json({ user: newUser, message: 'Usuário criado com sucesso!' });
    } catch (error) {
      console.error('Erro na requisição:', error);
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

  const httpServer = createServer(app);
  return httpServer;
}
