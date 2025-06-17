import { 
  users, 
  calendarAssignments, 
  events, 
  tasks, 
  expenses, 
  actionLogs, 
  shareLinks,
  type User, 
  type InsertUser,
  type CalendarAssignment,
  type InsertCalendarAssignment,
  type Event,
  type InsertEvent,
  type Task,
  type InsertTask,
  type Expense,
  type InsertExpense,
  type ActionLog,
  type InsertActionLog,
  type ShareLink,
  type InsertShareLink
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Calendar Assignments
  getCalendarAssignments(month: string): Promise<CalendarAssignment[]>;
  getCalendarAssignment(date: string): Promise<CalendarAssignment | undefined>;
  createCalendarAssignment(assignment: InsertCalendarAssignment): Promise<CalendarAssignment>;
  updateCalendarAssignment(id: number, updates: Partial<CalendarAssignment>): Promise<CalendarAssignment | undefined>;
  deleteCalendarAssignment(id: number): Promise<boolean>;
  
  // Events
  getEvents(date: string): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, updates: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // Tasks
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Expenses
  getExpenses(month?: string): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, updates: Partial<Expense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;
  
  // Action Logs
  createActionLog(log: InsertActionLog): Promise<ActionLog>;
  getActionLogs(userId?: number): Promise<ActionLog[]>;
  
  // Share Links
  createShareLink(shareLink: InsertShareLink): Promise<ShareLink>;
  getShareLink(linkId: string): Promise<ShareLink | undefined>;
  
  // Bulk Operations
  getPendingItems(userId: number): Promise<{
    assignments: CalendarAssignment[];
    events: Event[];
    tasks: Task[];
    expenses: Expense[];
  }>;
  
  acceptAllPendingItems(userId: number, itemTypes: string[]): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private calendarAssignments: Map<number, CalendarAssignment>;
  private events: Map<number, Event>;
  private tasks: Map<number, Task>;
  private expenses: Map<number, Expense>;
  private actionLogs: Map<number, ActionLog>;
  private shareLinks: Map<number, ShareLink>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.calendarAssignments = new Map();
    this.events = new Map();
    this.tasks = new Map();
    this.expenses = new Map();
    this.actionLogs = new Map();
    this.shareLinks = new Map();
    this.currentId = 1;
    
    // Initialize with default users
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    await this.createUser({
      username: "mom",
      password: "password123",
      name: "Sarah Johnson",
      role: "mom"
    });
    
    await this.createUser({
      username: "dad",
      password: "password123",
      name: "Mike Johnson",
      role: "dad"
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Calendar Assignments
  async getCalendarAssignments(month: string): Promise<CalendarAssignment[]> {
    return Array.from(this.calendarAssignments.values()).filter(
      assignment => assignment.date.startsWith(month)
    );
  }

  async getCalendarAssignment(date: string): Promise<CalendarAssignment | undefined> {
    return Array.from(this.calendarAssignments.values()).find(
      assignment => assignment.date === date
    );
  }

  async createCalendarAssignment(insertAssignment: InsertCalendarAssignment): Promise<CalendarAssignment> {
    const id = this.currentId++;
    const assignment: CalendarAssignment = {
      ...insertAssignment,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.calendarAssignments.set(id, assignment);
    return assignment;
  }

  async updateCalendarAssignment(id: number, updates: Partial<CalendarAssignment>): Promise<CalendarAssignment | undefined> {
    const assignment = this.calendarAssignments.get(id);
    if (!assignment) return undefined;
    
    const updated = { ...assignment, ...updates };
    this.calendarAssignments.set(id, updated);
    return updated;
  }

  async deleteCalendarAssignment(id: number): Promise<boolean> {
    return this.calendarAssignments.delete(id);
  }

  // Events
  async getEvents(date: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      event => event.date === date
    );
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.currentId++;
    const event: Event = {
      ...insertEvent,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: number, updates: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updated = { ...event, ...updates };
    this.events.set(id, updated);
    return updated;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentId++;
    const task: Task = {
      ...insertTask,
      id,
      completed: false,
      status: "pending",
      createdAt: new Date(),
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updated = { ...task, ...updates };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Expenses
  async getExpenses(month?: string): Promise<Expense[]> {
    const allExpenses = Array.from(this.expenses.values());
    if (month) {
      return allExpenses.filter(expense => expense.date.startsWith(month));
    }
    return allExpenses.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.currentId++;
    const expense: Expense = {
      ...insertExpense,
      id,
      hasReceipt: false,
      status: "pending",
      createdAt: new Date(),
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: number, updates: Partial<Expense>): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;
    
    const updated = { ...expense, ...updates };
    this.expenses.set(id, updated);
    return updated;
  }

  async deleteExpense(id: number): Promise<boolean> {
    return this.expenses.delete(id);
  }

  // Action Logs
  async createActionLog(insertLog: InsertActionLog): Promise<ActionLog> {
    const id = this.currentId++;
    const log: ActionLog = {
      ...insertLog,
      id,
      timestamp: new Date(),
    };
    this.actionLogs.set(id, log);
    return log;
  }

  async getActionLogs(userId?: number): Promise<ActionLog[]> {
    const logs = Array.from(this.actionLogs.values());
    if (userId) {
      return logs.filter(log => log.userId === userId);
    }
    return logs.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Share Links
  async createShareLink(insertShareLink: InsertShareLink): Promise<ShareLink> {
    const id = this.currentId++;
    const shareLink: ShareLink = {
      ...insertShareLink,
      id,
      createdAt: new Date(),
    };
    this.shareLinks.set(id, shareLink);
    return shareLink;
  }

  async getShareLink(linkId: string): Promise<ShareLink | undefined> {
    return Array.from(this.shareLinks.values()).find(
      link => link.linkId === linkId && new Date() < new Date(link.expiresAt)
    );
  }

  // Bulk Operations
  async getPendingItems(userId: number): Promise<{
    assignments: CalendarAssignment[];
    events: Event[];
    tasks: Task[];
    expenses: Expense[];
  }> {
    return {
      assignments: Array.from(this.calendarAssignments.values()).filter(
        item => item.createdBy !== userId && item.status === "pending"
      ),
      events: Array.from(this.events.values()).filter(
        item => item.createdBy !== userId && item.status === "pending"
      ),
      tasks: Array.from(this.tasks.values()).filter(
        item => item.createdBy !== userId && item.status === "pending"
      ),
      expenses: Array.from(this.expenses.values()).filter(
        item => item.createdBy !== userId && item.status === "pending"
      ),
    };
  }

  async acceptAllPendingItems(userId: number, itemTypes: string[]): Promise<void> {
    if (itemTypes.includes("assignments")) {
      for (const [id, assignment] of this.calendarAssignments.entries()) {
        if (assignment.createdBy !== userId && assignment.status === "pending") {
          this.calendarAssignments.set(id, { ...assignment, status: "confirmed" });
        }
      }
    }
    
    if (itemTypes.includes("events")) {
      for (const [id, event] of this.events.entries()) {
        if (event.createdBy !== userId && event.status === "pending") {
          this.events.set(id, { ...event, status: "confirmed" });
        }
      }
    }
    
    if (itemTypes.includes("tasks")) {
      for (const [id, task] of this.tasks.entries()) {
        if (task.createdBy !== userId && task.status === "pending") {
          this.tasks.set(id, { ...task, status: "confirmed" });
        }
      }
    }
    
    if (itemTypes.includes("expenses")) {
      for (const [id, expense] of this.expenses.entries()) {
        if (expense.createdBy !== userId && expense.status === "pending") {
          this.expenses.set(id, { ...expense, status: "confirmed" });
        }
      }
    }
  }
}

export const storage = new MemStorage();
