import { type User, type InsertUser, type WeeklyProgress, type InsertWeeklyProgress, type UserGoals, type InsertUserGoals } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private weeklyProgress: Map<string, WeeklyProgress>;
  private userGoals: Map<string, UserGoals>;

  constructor() {
    this.users = new Map();
    this.weeklyProgress = new Map();
    this.userGoals = new Map();
    
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
      createdAt: new Date(),
      isActive: goal.isActive ?? true,
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
}

export const storage = new MemStorage();
