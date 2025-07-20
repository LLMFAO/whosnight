import { 
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
  type InsertShareLink,
  type TeenPermissions,
  type InsertTeenPermissions
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  
  // Calendar Assignments
  getCalendarAssignments(month: string): Promise<CalendarAssignment[]>;
  getCalendarAssignment(date: string): Promise<CalendarAssignment | undefined>;
  getCalendarAssignmentById(id: number): Promise<CalendarAssignment | undefined>;
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
  getEntityLogs(entityType: string, entityId: number): Promise<ActionLog[]>;
  getUserRequestHistory(userId: number): Promise<ActionLog[]>;
  
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
  acceptPendingItem(itemType: string, itemId: number, userId: number): Promise<void>;
  
  // Teen Permissions
  getTeenPermissions(teenUserId: number): Promise<TeenPermissions | undefined>;
  createTeenPermissions(permissions: InsertTeenPermissions): Promise<TeenPermissions>;
  updateTeenPermissions(teenUserId: number, updates: Partial<TeenPermissions>, modifiedBy: number): Promise<TeenPermissions | undefined>;
  isTeenAllowed(teenUserId: number, action: 'modifyAssignments' | 'addEvents' | 'addTasks'): Promise<boolean>;
}

// Temporary in-memory storage for testing
export class MockStorage implements IStorage {
  private users: User[] = [];
  private assignments: CalendarAssignment[] = [];
  private events: Event[] = [];
  private tasks: Task[] = [];
  private expenses: Expense[] = [];
  private logs: ActionLog[] = [];
  private shareLinks: ShareLink[] = [];
  private permissions: TeenPermissions[] = [];
  private nextId = 1;

  constructor() {
    this.initializeDefaultData();
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  private async initializeDefaultData() {
    try {
      // Create default users with hashed passwords (for testing, using bcrypt hash of "password123")
      await this.createUser({
        username: "mom",
        password: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password123
        name: "Mom",
        role: "mom"
      });
      
      await this.createUser({
        username: "dad",
        password: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password123
        name: "Dad",
        role: "dad"
      });
      
      const teenUser = await this.createUser({
        username: "teen",
        password: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password123
        name: "Teen",
        role: "teen"
      });
      
      // Create default read-only permissions for the teen
      await this.createTeenPermissions({
        teenUserId: teenUser.id,
        canModifyAssignments: false,
        canAddEvents: false,
        canAddTasks: false,
        canAddExpenses: false,
        isReadOnly: true,
        modifiedBy: 1 // Mom's ID
      });
    } catch (error) {
      console.log("Mock storage initialization error:", error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.nextId++,
      ...insertUser,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  // Minimal implementations for other methods (just return empty arrays/undefined for testing)
  async getCalendarAssignments(month: string): Promise<CalendarAssignment[]> { return []; }
  async getCalendarAssignment(date: string): Promise<CalendarAssignment | undefined> { return undefined; }
  async getCalendarAssignmentById(id: number): Promise<CalendarAssignment | undefined> { return undefined; }
  async createCalendarAssignment(assignment: InsertCalendarAssignment): Promise<CalendarAssignment> {
    const item: CalendarAssignment = { id: this.nextId++, ...assignment, createdAt: new Date(), updatedAt: new Date() };
    this.assignments.push(item);
    return item;
  }
  async updateCalendarAssignment(id: number, updates: Partial<CalendarAssignment>): Promise<CalendarAssignment | undefined> { return undefined; }
  async deleteCalendarAssignment(id: number): Promise<boolean> { return false; }
  
  async getEvents(date: string): Promise<Event[]> { return []; }
  async getEvent(id: number): Promise<Event | undefined> { return undefined; }
  async createEvent(event: InsertEvent): Promise<Event> {
    const item: Event = { id: this.nextId++, ...event, createdAt: new Date(), updatedAt: new Date() };
    this.events.push(item);
    return item;
  }
  async updateEvent(id: number, updates: Partial<Event>): Promise<Event | undefined> { return undefined; }
  async deleteEvent(id: number): Promise<boolean> { return false; }
  
  async getTasks(): Promise<Task[]> { return []; }
  async getTask(id: number): Promise<Task | undefined> { return undefined; }
  async createTask(task: InsertTask): Promise<Task> {
    const item: Task = { id: this.nextId++, ...task, createdAt: new Date(), updatedAt: new Date() };
    this.tasks.push(item);
    return item;
  }
  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> { return undefined; }
  async deleteTask(id: number): Promise<boolean> { return false; }
  
  async getExpenses(month?: string): Promise<Expense[]> { return []; }
  async getExpense(id: number): Promise<Expense | undefined> { return undefined; }
  async createExpense(expense: InsertExpense): Promise<Expense> {
    const item: Expense = { id: this.nextId++, ...expense, createdAt: new Date(), updatedAt: new Date() };
    this.expenses.push(item);
    return item;
  }
  async updateExpense(id: number, updates: Partial<Expense>): Promise<Expense | undefined> { return undefined; }
  async deleteExpense(id: number): Promise<boolean> { return false; }
  
  async createActionLog(log: InsertActionLog): Promise<ActionLog> {
    const item: ActionLog = { id: this.nextId++, ...log, timestamp: new Date() };
    this.logs.push(item);
    return item;
  }
  async getActionLogs(userId?: number): Promise<ActionLog[]> { return []; }
  async getEntityLogs(entityType: string, entityId: number): Promise<ActionLog[]> { return []; }
  async getUserRequestHistory(userId: number): Promise<ActionLog[]> { return []; }
  
  async createShareLink(shareLink: InsertShareLink): Promise<ShareLink> {
    const item: ShareLink = { id: this.nextId++, ...shareLink, createdAt: new Date() };
    this.shareLinks.push(item);
    return item;
  }
  async getShareLink(linkId: string): Promise<ShareLink | undefined> { return undefined; }
  
  async getPendingItems(userId: number): Promise<{ assignments: CalendarAssignment[]; events: Event[]; tasks: Task[]; expenses: Expense[]; }> {
    return { assignments: [], events: [], tasks: [], expenses: [] };
  }
  
  async acceptAllPendingItems(userId: number, itemTypes: string[]): Promise<void> {}
  async acceptPendingItem(itemType: string, itemId: number, userId: number): Promise<void> {}
  
  async getTeenPermissions(teenUserId: number): Promise<TeenPermissions | undefined> {
    return this.permissions.find(p => p.teenUserId === teenUserId);
  }
  
  async createTeenPermissions(permissions: InsertTeenPermissions): Promise<TeenPermissions> {
    const item: TeenPermissions = { 
      id: this.nextId++, 
      ...permissions, 
      createdAt: new Date(), 
      modifiedAt: new Date() 
    };
    this.permissions.push(item);
    return item;
  }
  
  async updateTeenPermissions(teenUserId: number, updates: Partial<TeenPermissions>, modifiedBy: number): Promise<TeenPermissions | undefined> {
    return undefined;
  }
  
  async isTeenAllowed(teenUserId: number, action: 'modifyAssignments' | 'addEvents' | 'addTasks'): Promise<boolean> {
    return false;
  }
}

export const storage = new MockStorage();