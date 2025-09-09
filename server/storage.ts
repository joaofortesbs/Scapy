import {
  type User,
  type InsertUser,
  type WeeklyProgress,
  type InsertWeeklyProgress,
  type UserGoals,
  type InsertUserGoals,
  type MoodSelection,
  type InsertMoodSelection,
  type UserObjective,
  type InsertUserObjective,
  type AiSuggestion,
  type InsertAiSuggestion,
  type DailyTask,
  type InsertDailyTask,
  type TaskProgress,
  type InsertTaskProgress,
  UserCustomGoal,
  InsertUserCustomGoal,
  WeeklyMoodTracking,
  InsertWeeklyMoodTracking
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getWeeklyProgress(userId: string, weekStart: Date): Promise<WeeklyProgress | undefined>;
  upsertWeeklyProgress(progress: InsertWeeklyProgress): Promise<WeeklyProgress>;

  getUserGoals(userId: string): Promise<UserGoals[]>;
  createUserGoal(goal: InsertUserGoals): Promise<UserGoals>;
  updateUserGoal(id: string, goal: Partial<UserGoals>): Promise<UserGoals | undefined>;

  // Mood selections
  createMoodSelection(moodSelection: InsertMoodSelection): Promise<MoodSelection>;
  getUserMoodSelections(userId: string, date?: Date): Promise<MoodSelection[]>;
  getTodayMoodSelection(userId: string): Promise<MoodSelection | undefined>;

  // User objectives
  getUserObjectives(userId: string): Promise<UserObjective[]>;
  createUserObjective(objective: InsertUserObjective): Promise<UserObjective>;
  updateUserObjective(id: string, objective: Partial<UserObjective>): Promise<UserObjective | undefined>;
  deleteUserObjective(id: string): Promise<boolean>;

  // AI suggestions
  createAiSuggestion(suggestion: InsertAiSuggestion): Promise<AiSuggestion>;
  getUserAiSuggestions(userId: string, date?: Date): Promise<AiSuggestion[]>;
  getTodayAiSuggestion(userId: string): Promise<AiSuggestion | undefined>;

  // Daily tasks
  getUserDailyTasks(userId: string, date?: Date): Promise<DailyTask[]>;
  createDailyTask(task: InsertDailyTask): Promise<DailyTask>;
  updateDailyTask(id: string, task: Partial<DailyTask>): Promise<DailyTask | undefined>;
  deleteDailyTask(id: string): Promise<boolean>;
  toggleTaskCompletion(id: string): Promise<DailyTask | undefined>;

  // Task progress
  getUserTaskProgress(userId: string, date?: Date): Promise<TaskProgress | undefined>;
  updateTaskProgress(userId: string, date: Date): Promise<void>;

  // User Custom Goals management
  createUserCustomGoal(goal: InsertUserCustomGoal): Promise<UserCustomGoal>;
  getUserCustomGoals(userId: string, date?: Date): Promise<UserCustomGoal[]>;
  toggleCustomGoalCompletion(id: string): Promise<UserCustomGoal | undefined>;
  deleteUserCustomGoal(id: string): Promise<boolean>;

  // Data cleanup
  cleanupDailyData(userId: string, date: Date): Promise<void>;

  // Weekly mood tracking
  getWeeklyMoodTracking(userId: string, weekStart: Date): Promise<WeeklyMoodTracking | undefined>;
  updateWeeklyMoodTracking(userId: string, dayOfWeek: number, mood: string): Promise<WeeklyMoodTracking>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private weeklyProgress: Map<string, WeeklyProgress>;
  private userGoals: Map<string, UserGoals>;
  private moodSelections: Map<string, MoodSelection>;
  private userObjectives: Map<string, UserObjective>;
  private aiSuggestions: Map<string, AiSuggestion>;
  private dailyTasks: Map<string, DailyTask>;
  private taskProgress: Map<string, TaskProgress>;
  private userCustomGoals: Map<string, UserCustomGoal>; // Added for custom goals
  private weeklyMoodTracking: Map<string, WeeklyMoodTracking>; // Added for weekly mood tracking

  constructor() {
    this.users = new Map();
    this.weeklyProgress = new Map();
    this.userGoals = new Map();
    this.moodSelections = new Map();
    this.userObjectives = new Map();
    this.aiSuggestions = new Map();
    this.dailyTasks = new Map();
    this.taskProgress = new Map();
    this.userCustomGoals = new Map(); // Initialize custom goals map
    this.weeklyMoodTracking = new Map(); // Initialize weekly mood tracking map

    // Initialize with default user for demo
    this.initializeDefaultUser();
  }

  private async initializeDefaultUser() {
    const defaultUser = await this.createUser({
      username: "demo_user",
      password: "password123"
    });

    // Create initial weekly progress
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    await this.upsertWeeklyProgress({
      userId: defaultUser.id,
      weekStart: startOfWeek,
      dayCompleted: [false, true, true, true, false, false, false],
      currentStreak: 7,
      bestStreak: 21
    });

    // Create default goal
    await this.createUserGoal({
      userId: defaultUser.id,
      title: "30 Dias Limpo",
      targetDays: 30,
      isActive: true
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      fullName: insertUser.fullName || null,
      profileImage: insertUser.profileImage || null,
      startDate: new Date(),
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getWeeklyProgress(userId: string, weekStart: Date): Promise<WeeklyProgress | undefined> {
    const key = `${userId}-${weekStart.toISOString()}`;
    return this.weeklyProgress.get(key);
  }

  async upsertWeeklyProgress(progress: InsertWeeklyProgress): Promise<WeeklyProgress> {
    const key = `${progress.userId}-${progress.weekStart.toISOString()}`;
    const existing = this.weeklyProgress.get(key);

    const weeklyProgress: WeeklyProgress = {
      id: existing?.id || randomUUID(),
      ...progress,
      currentStreak: progress.currentStreak ?? 0,
      bestStreak: progress.bestStreak ?? 0,
    };

    this.weeklyProgress.set(key, weeklyProgress);
    return weeklyProgress;
  }

  async getUserGoals(userId: string): Promise<UserGoals[]> {
    return Array.from(this.userGoals.values()).filter(
      (goal) => goal.userId === userId && goal.isActive
    );
  }

  async createUserGoal(goal: InsertUserGoals): Promise<UserGoals> {
    const id = randomUUID();
    const userGoal: UserGoals = {
      ...goal,
      id,
      isActive: goal.isActive ?? true,
      createdAt: new Date(),
    };
    this.userGoals.set(id, userGoal);
    return userGoal;
  }

  async updateUserGoal(id: string, goal: Partial<UserGoals>): Promise<UserGoals | undefined> {
    const existing = this.userGoals.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...goal };
    this.userGoals.set(id, updated);
    return updated;
  }

  // Mood selections
  async createMoodSelection(moodSelection: InsertMoodSelection): Promise<MoodSelection> {
    const id = randomUUID();
    const now = new Date();
    const selection: MoodSelection = {
      ...moodSelection,
      id,
      date: moodSelection.date ? (typeof moodSelection.date === 'string' ? new Date(moodSelection.date) : moodSelection.date) : now,
      createdAt: now,
    };
    this.moodSelections.set(id, selection);
    return selection;
  }

  async getUserMoodSelections(userId: string, date?: Date): Promise<MoodSelection[]> {
    const selections = Array.from(this.moodSelections.values()).filter(
      (selection) => selection.userId === userId
    );

    if (date) {
      const targetDate = date.toISOString().split('T')[0];
      return selections.filter(
        (selection) => selection.date.toISOString().split('T')[0] === targetDate
      );
    }

    return selections;
  }

  async getTodayMoodSelection(userId: string): Promise<MoodSelection | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const todaySelections = await this.getUserMoodSelections(userId, new Date());
    return todaySelections[todaySelections.length - 1]; // Retorna a mais recente do dia
  }

  // User objectives
  async getUserObjectives(userId: string): Promise<UserObjective[] > {
    return Array.from(this.userObjectives.values()).filter(
      (objective) => objective.userId === userId
    );
  }

  async createUserObjective(objective: InsertUserObjective): Promise<UserObjective> {
    const id = randomUUID();
    const userObjective: UserObjective = {
      ...objective,
      id,
      concluido: objective.concluido ?? false,
      periodo: objective.periodo ?? 6,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userObjectives.set(id, userObjective);
    return userObjective;
  }

  async updateUserObjective(id: string, objective: Partial<UserObjective>): Promise<UserObjective | undefined> {
    const existing = this.userObjectives.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...objective, updatedAt: new Date() };
    this.userObjectives.set(id, updated);
    return updated;
  }

  async deleteUserObjective(id: string): Promise<boolean> {
    return this.userObjectives.delete(id);
  }

  // AI suggestions
  async createAiSuggestion(suggestion: InsertAiSuggestion): Promise<AiSuggestion> {
    const id = randomUUID();
    const now = new Date();
    const aiSuggestion: AiSuggestion = {
      ...suggestion,
      id,
      date: suggestion.date ? (typeof suggestion.date === 'string' ? new Date(suggestion.date) : suggestion.date) : now,
      motivation: suggestion.motivation || null,
      objectives: suggestion.objectives || null,
      createdAt: now,
    };
    this.aiSuggestions.set(id, aiSuggestion);
    return aiSuggestion;
  }

  async getUserAiSuggestions(userId: string, date?: Date): Promise<AiSuggestion[]> {
    const suggestions = Array.from(this.aiSuggestions.values()).filter(
      (suggestion) => suggestion.userId === userId
    );

    if (date) {
      const targetDate = date.toISOString().split('T')[0];
      return suggestions.filter(
        (suggestion) => suggestion.date.toISOString().split('T')[0] === targetDate
      );
    }

    return suggestions;
  }

  async getTodayAiSuggestion(userId: string): Promise<AiSuggestion | undefined> {
    const today = new Date();
    const todaySuggestions = await this.getUserAiSuggestions(userId, today);
    return todaySuggestions[todaySuggestions.length - 1]; // Retorna a mais recente do dia
  }

  // Daily tasks
  async getUserDailyTasks(userId: string, date?: Date): Promise<DailyTask[]> {
    const tasks = Array.from(this.dailyTasks.values()).filter(
      (task) => task.userId === userId
    );

    if (date) {
      const targetDate = date.toISOString().split('T')[0];
      return tasks.filter(
        (task) => task.date.toISOString().split('T')[0] === targetDate
      );
    }

    return tasks;
  }

  async createDailyTask(task: InsertDailyTask): Promise<DailyTask> {
    const id = randomUUID();
    const now = new Date();
    const dailyTask: DailyTask = {
      ...task,
      id,
      date: task.date ? (typeof task.date === 'string' ? new Date(task.date) : task.date) : now,
      suggestionId: task.suggestionId || null,
      descricao: task.descricao || null,
      categoria: task.categoria || null,
      prioridade: task.prioridade ?? 1,
      concluida: task.concluida ?? false,
      createdAt: now,
      updatedAt: now,
    };
    this.dailyTasks.set(id, dailyTask);
    return dailyTask;
  }

  async updateDailyTask(id: string, task: Partial<DailyTask>): Promise<DailyTask | undefined> {
    const existing = this.dailyTasks.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...task, updatedAt: new Date() };
    this.dailyTasks.set(id, updated);
    return updated;
  }

  async deleteDailyTask(id: string): Promise<boolean> {
    return this.dailyTasks.delete(id);
  }

  async toggleTaskCompletion(id: string): Promise<DailyTask | undefined> {
    const existing = this.dailyTasks.get(id);
    if (!existing) return undefined;

    const updated = {
      ...existing,
      concluida: !existing.concluida,
      updatedAt: new Date()
    };
    this.dailyTasks.set(id, updated);
    return updated;
  }

  // Task progress
  async getUserTaskProgress(userId: string, date?: Date): Promise<TaskProgress | undefined> {
    const targetDate = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    return Array.from(this.taskProgress.values()).find(
      (progress) =>
        progress.userId === userId &&
        progress.date.toISOString().split('T')[0] === targetDate
    );
  }

  async updateTaskProgress(userId: string, date: Date): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const tasks = Array.from(this.dailyTasks.values()).filter(
      task => task.userId === userId &&
      task.date >= startOfDay &&
      task.date <= endOfDay
    );

    // Include custom goals in the progress calculation
    const customGoals = Array.from(this.userCustomGoals.values()).filter(
      goal => goal.userId === userId &&
      goal.date >= startOfDay &&
      goal.date <= endOfDay
    );

    const totalTasks = tasks.length + customGoals.length;
    const completedTasks = tasks.filter(task => task.concluida).length +
                          customGoals.filter(goal => goal.concluida).length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const progressId = `${userId}-${date.toISOString().split('T')[0]}`;
    const progress: TaskProgress = {
      id: progressId,
      userId,
      date,
      totalTasks,
      completedTasks,
      progressPercentage,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.taskProgress.set(progressId, progress);
  }

  // User Custom Goals management
  async createUserCustomGoal(goal: InsertUserCustomGoal): Promise<UserCustomGoal> {
    const id = randomUUID();
    const now = new Date();
    const customGoal: UserCustomGoal = {
      ...goal,
      id,
      date: goal.date ? (typeof goal.date === 'string' ? new Date(goal.date) : goal.date) : now,
      createdAt: now,
      updatedAt: now,
    };
    this.userCustomGoals.set(id, customGoal);
    return customGoal;
  }

  async getUserCustomGoals(userId: string, date?: Date): Promise<UserCustomGoal[]> {
    const goals = Array.from(this.userCustomGoals.values()).filter(
      (goal) => goal.userId === userId
    );

    if (date) {
      const targetDate = date.toISOString().split('T')[0];
      return goals.filter(
        (goal) => goal.date.toISOString().split('T')[0] === targetDate
      );
    }

    return goals;
  }

  async toggleCustomGoalCompletion(id: string): Promise<UserCustomGoal | undefined> {
    const goal = this.userCustomGoals.get(id);
    if (!goal) return undefined;

    const updatedGoal = {
      ...goal,
      concluida: !goal.concluida,
      updatedAt: new Date()
    };
    this.userCustomGoals.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteUserCustomGoal(id: string): Promise<boolean> {
    return this.userCustomGoals.delete(id);
  }

  async cleanupDailyData(userId: string, date: Date): Promise<void> {
    const targetDate = date.toISOString().split('T')[0];

    // Remove daily tasks for the date
    for (const [id, task] of this.dailyTasks.entries()) {
      if (task.userId === userId && task.date.toISOString().split('T')[0] === targetDate) {
        this.dailyTasks.delete(id);
      }
    }

    // Remove custom goals for the date
    for (const [id, goal] of this.userCustomGoals.entries()) {
      if (goal.userId === userId && goal.date.toISOString().split('T')[0] === targetDate) {
        this.userCustomGoals.delete(id);
      }
    }

    // Remove mood selections for the date
    for (const [id, mood] of this.moodSelections.entries()) {
      if (mood.userId === userId && mood.date.toISOString().split('T')[0] === targetDate) {
        this.moodSelections.delete(id);
      }
    }

    console.log(`🧹 Dados do dia ${targetDate} limpos para usuário ${userId}`);
  }

  // Weekly mood tracking methods
  async getWeeklyMoodTracking(userId: string, weekStart: Date): Promise<WeeklyMoodTracking | undefined> {
    const key = `${userId}-${weekStart.toISOString()}`;
    return this.weeklyMoodTracking.get(key);
  }

  async updateWeeklyMoodTracking(userId: string, dayOfWeek: number, mood: string): Promise<WeeklyMoodTracking> {
    // Get start of current week (Sunday)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const key = `${userId}-${weekStart.toISOString()}`;
    let weeklyMood = this.weeklyMoodTracking.get(key);

    if (!weeklyMood) {
      weeklyMood = {
        id: randomUUID(),
        userId,
        weekStart,
        mondayMood: null,
        tuesdayMood: null,
        wednesdayMood: null,
        thursdayMood: null,
        fridayMood: null,
        saturdayMood: null,
        sundayMood: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    // Update the specific day mood (0=Sunday, 1=Monday, ..., 6=Saturday)
    switch (dayOfWeek) {
      case 0: weeklyMood.sundayMood = mood; break;
      case 1: weeklyMood.mondayMood = mood; break;
      case 2: weeklyMood.tuesdayMood = mood; break;
      case 3: weeklyMood.wednesdayMood = mood; break;
      case 4: weeklyMood.thursdayMood = mood; break;
      case 5: weeklyMood.fridayMood = mood; break;
      case 6: weeklyMood.saturdayMood = mood; break;
    }

    weeklyMood.updatedAt = new Date();
    this.weeklyMoodTracking.set(key, weeklyMood);
    
    console.log(`🎭 Humor da semana atualizado: ${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek]} = ${mood}`);
    
    return weeklyMood;
  }
}

export const storage = new MemStorage();