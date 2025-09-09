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
  type InsertTaskProgress
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
  updateTaskProgress(userId: string, date: Date): Promise<TaskProgress>;
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

  constructor() {
    this.users = new Map();
    this.weeklyProgress = new Map();
    this.userGoals = new Map();
    this.moodSelections = new Map();
    this.userObjectives = new Map();
    this.aiSuggestions = new Map();
    this.dailyTasks = new Map();
    this.taskProgress = new Map();
    
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
    const selection: MoodSelection = {
      ...moodSelection,
      id,
      date: moodSelection.date || new Date(),
      createdAt: new Date(),
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
  async getUserObjectives(userId: string): Promise<UserObjective[]> {
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
    const aiSuggestion: AiSuggestion = {
      ...suggestion,
      id,
      date: suggestion.date || new Date(),
      motivation: suggestion.motivation || null,
      objectives: suggestion.objectives || null,
      createdAt: new Date(),
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
    const dailyTask: DailyTask = {
      ...task,
      id,
      date: task.date || new Date(),
      suggestionId: task.suggestionId || null,
      descricao: task.descricao || null,
      categoria: task.categoria || null,
      prioridade: task.prioridade ?? 1,
      concluida: task.concluida ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
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

  async updateTaskProgress(userId: string, date: Date): Promise<TaskProgress> {
    const existingProgress = await this.getUserTaskProgress(userId, date);
    const todayTasks = await this.getUserDailyTasks(userId, date);
    
    const totalTasks = todayTasks.length;
    const completedTasks = todayTasks.filter(task => task.concluida).length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    if (existingProgress) {
      const updated = {
        ...existingProgress,
        totalTasks,
        completedTasks,
        progressPercentage,
        updatedAt: new Date(),
      };
      this.taskProgress.set(existingProgress.id, updated);
      return updated;
    } else {
      const id = randomUUID();
      const newProgress: TaskProgress = {
        id,
        userId,
        date,
        totalTasks,
        completedTasks,
        progressPercentage,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.taskProgress.set(id, newProgress);
      return newProgress;
    }
  }
}

export const storage = new MemStorage();
