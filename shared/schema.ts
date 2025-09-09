import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  profileImage: text("profile_image"),
  startDate: timestamp("start_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const weeklyProgress = pgTable("weekly_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  weekStart: timestamp("week_start").notNull(),
  dayCompleted: boolean("day_completed").array().notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  bestStreak: integer("best_streak").default(0).notNull(),
});

export const userGoals = pgTable("user_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  targetDays: integer("target_days").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const timers = pgTable("timers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull(),
  start_date: timestamp("start_date").notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  startDate: true,
  createdAt: true,
});

export const insertWeeklyProgressSchema = createInsertSchema(weeklyProgress).omit({
  id: true,
});

export const insertUserGoalsSchema = createInsertSchema(userGoals).omit({
  id: true,
  createdAt: true,
});

export const quizContextualizacao = pgTable("quiz_contextualizacao", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  userFullName: text("user_full_name").notNull(),
  genero: varchar("genero", { length: 50 }),
  frequencia: varchar("frequencia", { length: 100 }),
  idade: varchar("idade", { length: 50 }),
  motivacao: text("motivacao"),
  gatilhos: text("gatilhos"),
  religiao: varchar("religiao", { length: 100 }),
  completed: boolean("completed").default(false).notNull(),
  currentStep: integer("current_step").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertQuizContextualizacaoSchema = createInsertSchema(quizContextualizacao).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type QuizContextualizacao = typeof quizContextualizacao.$inferSelect;
export type InsertQuizContextualizacao = z.infer<typeof insertQuizContextualizacaoSchema>;

export const insertTimerSchema = createInsertSchema(timers).omit({
  id: true,
  created_at: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type WeeklyProgress = typeof weeklyProgress.$inferSelect;
export type InsertWeeklyProgress = z.infer<typeof insertWeeklyProgressSchema>;
export type UserGoals = typeof userGoals.$inferSelect;
export type InsertUserGoals = z.infer<typeof insertUserGoalsSchema>;
export type Timer = typeof timers.$inferSelect;
export type InsertTimer = z.infer<typeof insertTimerSchema>;

// Tabela para armazenar seleções de humor/estado do usuário no AI Assistant
export const moodSelections = pgTable("mood_selections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  mood: varchar("mood", { length: 50 }).notNull(), // "medo", "estavel", "feliz"
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela para armazenar objetivos do usuário (migração do localStorage)
export const userObjectives = pgTable("user_objectives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  texto: text("texto").notNull(),
  concluido: boolean("concluido").default(false).notNull(),
  periodo: integer("periodo").default(6).notNull(), // período em meses
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela para armazenar sugestões de atividades geradas pela IA
export const aiSuggestions = pgTable("ai_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  mood: varchar("mood", { length: 50 }).notNull(),
  motivation: text("motivation"),
  objectives: text("objectives"), // JSON string com objetivos do usuário
  suggestedActivities: text("suggested_activities").notNull(), // JSON string com atividades sugeridas
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela para armazenar tarefas/atividades diárias individuais
export const dailyTasks = pgTable("daily_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  suggestionId: varchar("suggestion_id").references(() => aiSuggestions.id),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  categoria: varchar("categoria", { length: 100 }), // "meditacao", "exercicio", "hobby", etc.
  prioridade: integer("prioridade").default(1).notNull(), // 1-5, sendo 5 alta prioridade
  concluida: boolean("concluida").default(false).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela para acompanhar progresso geral do usuário com as tarefas
export const taskProgress = pgTable("task_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").defaultNow().notNull(),
  totalTasks: integer("total_tasks").default(0).notNull(),
  completedTasks: integer("completed_tasks").default(0).notNull(),
  progressPercentage: integer("progress_percentage").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schemas de inserção para as novas tabelas
export const insertMoodSelectionSchema = createInsertSchema(moodSelections).omit({
  id: true,
  createdAt: true,
  date: true,
}).extend({
  userId: z.string(),
  mood: z.string(),
  date: z.union([z.string(), z.date()]).optional(),
});

export const insertUserObjectiveSchema = createInsertSchema(userObjectives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiSuggestionSchema = createInsertSchema(aiSuggestions).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.string().datetime().optional().or(z.date().optional()),
});

export const insertDailyTaskSchema = createInsertSchema(dailyTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.string().datetime().optional().or(z.date().optional()),
});

export const insertTaskProgressSchema = createInsertSchema(taskProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.string().datetime().optional().or(z.date().optional()),
});

// Tipos TypeScript para as novas tabelas
export type MoodSelection = typeof moodSelections.$inferSelect;
export type InsertMoodSelection = z.infer<typeof insertMoodSelectionSchema>;
export type UserObjective = typeof userObjectives.$inferSelect;
export type InsertUserObjective = z.infer<typeof insertUserObjectiveSchema>;
export type AiSuggestion = typeof aiSuggestions.$inferSelect;
export type InsertAiSuggestion = z.infer<typeof insertAiSuggestionSchema>;
export type DailyTask = typeof dailyTasks.$inferSelect;
export type InsertDailyTask = z.infer<typeof insertDailyTaskSchema>;
export type TaskProgress = typeof taskProgress.$inferSelect;
export type InsertTaskProgress = z.infer<typeof insertTaskProgressSchema>;
