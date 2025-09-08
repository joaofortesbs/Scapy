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
