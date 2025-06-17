import { 
  users, 
  calendarAssignments, 
  events, 
  tasks, 
  expenses, 
  actionLogs, 
  shareLinks,
  teenPermissions,
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
import { db } from "./db";
import { eq, and, like, ne, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  isTeenAllowed(teenUserId: number, action: 'modifyAssignments' | 'addEvents' | 'addTasks' | 'addExpenses'): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    try {
      // Check if default users exist
      const existingMom = await this.getUserByUsername("mom");
      const existingDad = await this.getUserByUsername("dad");
      const existingTeen = await this.getUserByUsername("teen");
      
      if (!existingMom) {
        await this.createUser({
          username: "mom",
          password: "password123",
          name: "Mom",
          role: "mom"
        });
      }
      
      if (!existingDad) {
        await this.createUser({
          username: "dad",
          password: "password123", 
          name: "Dad",
          role: "dad"
        });
      }
      
      if (!existingTeen) {
        const teenUser = await this.createUser({
          username: "teen",
          password: "password123",
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
      }
    } catch (error) {
      console.log("Database initialization error (may be expected on first run):", error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Calendar Assignment methods
  async getCalendarAssignments(month: string): Promise<CalendarAssignment[]> {
    return await db
      .select()
      .from(calendarAssignments)
      .where(like(calendarAssignments.date, `${month}%`));
  }

  async getCalendarAssignment(date: string): Promise<CalendarAssignment | undefined> {
    const [assignment] = await db
      .select()
      .from(calendarAssignments)
      .where(eq(calendarAssignments.date, date));
    return assignment || undefined;
  }

  async getCalendarAssignmentById(id: number): Promise<CalendarAssignment | undefined> {
    const [assignment] = await db
      .select()
      .from(calendarAssignments)
      .where(eq(calendarAssignments.id, id));
    return assignment || undefined;
  }

  async createCalendarAssignment(insertAssignment: InsertCalendarAssignment): Promise<CalendarAssignment> {
    const [assignment] = await db
      .insert(calendarAssignments)
      .values(insertAssignment)
      .returning();
    return assignment;
  }

  async updateCalendarAssignment(id: number, updates: Partial<CalendarAssignment>): Promise<CalendarAssignment | undefined> {
    const [assignment] = await db
      .update(calendarAssignments)
      .set(updates)
      .where(eq(calendarAssignments.id, id))
      .returning();
    return assignment || undefined;
  }

  async deleteCalendarAssignment(id: number): Promise<boolean> {
    const result = await db
      .delete(calendarAssignments)
      .where(eq(calendarAssignments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Event methods
  async getEvents(date: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.date, date));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(insertEvent)
      .returning();
    return event;
  }

  async updateEvent(id: number, updates: Partial<Event>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, id))
      .returning();
    return event || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db
      .delete(events)
      .where(eq(events.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Task methods
  async getTasks(): Promise<Task[]> {
    return await db
      .select()
      .from(tasks);
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(eq(tasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Expense methods
  async getExpenses(month?: string): Promise<Expense[]> {
    if (month) {
      return await db
        .select()
        .from(expenses)
        .where(like(expenses.date, `${month}%`));
    }
    return await db
      .select()
      .from(expenses);
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id));
    return expense || undefined;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values(insertExpense)
      .returning();
    return expense;
  }

  async updateExpense(id: number, updates: Partial<Expense>): Promise<Expense | undefined> {
    const [expense] = await db
      .update(expenses)
      .set(updates)
      .where(eq(expenses.id, id))
      .returning();
    return expense || undefined;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const result = await db
      .delete(expenses)
      .where(eq(expenses.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Action Log methods
  async createActionLog(insertLog: InsertActionLog): Promise<ActionLog> {
    const [log] = await db
      .insert(actionLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async getActionLogs(userId?: number): Promise<ActionLog[]> {
    if (userId) {
      return await db
        .select()
        .from(actionLogs)
        .where(eq(actionLogs.userId, userId))
        .orderBy(actionLogs.timestamp);
    }
    return await db
      .select()
      .from(actionLogs)
      .orderBy(actionLogs.timestamp);
  }

  async getEntityLogs(entityType: string, entityId: number): Promise<ActionLog[]> {
    return await db
      .select()
      .from(actionLogs)
      .where(and(
        eq(actionLogs.entityType, entityType),
        eq(actionLogs.entityId, entityId)
      ))
      .orderBy(actionLogs.timestamp);
  }

  async getUserRequestHistory(userId: number): Promise<ActionLog[]> {
    return await db
      .select()
      .from(actionLogs)
      .where(eq(actionLogs.requestedBy, userId))
      .orderBy(actionLogs.timestamp);
  }

  // Share Link methods
  async createShareLink(insertShareLink: InsertShareLink): Promise<ShareLink> {
    const [shareLink] = await db
      .insert(shareLinks)
      .values(insertShareLink)
      .returning();
    return shareLink;
  }

  async getShareLink(linkId: string): Promise<ShareLink | undefined> {
    const [shareLink] = await db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.linkId, linkId));
    return shareLink || undefined;
  }

  // Bulk operations
  async getPendingItems(userId: number): Promise<{
    assignments: CalendarAssignment[];
    events: Event[];
    tasks: Task[];
    expenses: Expense[];
  }> {
    // For teens (userId 3), show nothing - they can't approve items
    // For parents (userId 1 or 2), show items that need their approval
    // Parents should see items created by other users (including the other parent and teens)
    // But parents should not see items they created themselves
    const isParent = userId === 1 || userId === 2;
    
    if (!isParent) {
      return {
        assignments: [],
        events: [],
        tasks: [],
        expenses: []
      };
    }

    // Get the other parent's ID (if mom is viewing, show dad's items and vice versa)
    // Also include teen's items (userId 3) regardless of which parent is viewing
    const otherParentId = userId === 1 ? 2 : 1;
    const teenId = 3;

    const pendingAssignments = await db
      .select()
      .from(calendarAssignments)
      .where(and(
        eq(calendarAssignments.status, "pending"),
        ne(calendarAssignments.createdBy, userId) // Don't show items created by current user
      ));

    const pendingEvents = await db
      .select()
      .from(events)
      .where(and(
        eq(events.status, "pending"),
        ne(events.createdBy, userId) // Don't show items created by current user
      ));

    // Also get cancelled events for approval
    const cancelledEvents = await db
      .select()
      .from(events)
      .where(and(
        eq(events.status, "cancelled"),
        ne(events.createdBy, userId) // Don't show items created by current user
      ));

    // Combine pending and cancelled events
    const allPendingEvents = [...pendingEvents, ...cancelledEvents];

    const pendingTasks = await db
      .select()
      .from(tasks)
      .where(and(
        eq(tasks.status, "pending"),
        ne(tasks.createdBy, userId) // Don't show items created by current user
      ));

    const pendingExpenses = await db
      .select()
      .from(expenses)
      .where(and(
        eq(expenses.status, "pending"),
        ne(expenses.createdBy, userId) // Don't show items created by current user
      ));

    return {
      assignments: pendingAssignments,
      events: allPendingEvents,
      tasks: pendingTasks,
      expenses: pendingExpenses
    };
  }

  async acceptAllPendingItems(userId: number, itemTypes: string[]): Promise<void> {
    for (const itemType of itemTypes) {
      switch (itemType) {
        case "assignments":
          await db
            .update(calendarAssignments)
            .set({ status: "confirmed" })
            .where(eq(calendarAssignments.status, "pending"));
          break;
        case "events":
          await db
            .update(events)
            .set({ status: "confirmed" })
            .where(eq(events.status, "pending"));
          break;
        case "tasks":
          await db
            .update(tasks)
            .set({ status: "confirmed" })
            .where(eq(tasks.status, "pending"));
          break;
        case "expenses":
          await db
            .update(expenses)
            .set({ status: "confirmed" })
            .where(eq(expenses.status, "pending"));
          break;
      }
    }

    // Log the action
    await this.createActionLog({
      userId,
      action: "accept_all_pending",
      details: `Accepted all pending items: ${itemTypes.join(", ")}`,
      ipAddress: null
    });
  }

  async acceptPendingItem(itemType: string, itemId: number, userId: number): Promise<void> {
    switch (itemType) {
      case "assignment":
        await db
          .update(calendarAssignments)
          .set({ status: "confirmed" })
          .where(eq(calendarAssignments.id, itemId));
        break;
      case "event":
        // Check if the event is cancelled (deletion request) or pending (creation request)
        const [eventToUpdate] = await db.select().from(events).where(eq(events.id, itemId));
        if (eventToUpdate?.status === "cancelled") {
          // Actually delete cancelled events when approved
          await db.delete(events).where(eq(events.id, itemId));
        } else {
          // Confirm pending events
          await db
            .update(events)
            .set({ status: "confirmed" })
            .where(eq(events.id, itemId));
        }
        break;
      case "task":
        await db
          .update(tasks)
          .set({ status: "confirmed" })
          .where(eq(tasks.id, itemId));
        break;
      case "expense":
        await db
          .update(expenses)
          .set({ status: "confirmed" })
          .where(eq(expenses.id, itemId));
        break;
    }

    // Log the action
    await this.createActionLog({
      userId,
      action: "accept_pending_item",
      details: `Accepted ${itemType} with ID ${itemId}`,
      ipAddress: null
    });
  }

  async getTeenPermissions(teenUserId: number): Promise<TeenPermissions | undefined> {
    const [permissions] = await db
      .select()
      .from(teenPermissions)
      .where(eq(teenPermissions.teenUserId, teenUserId));
    return permissions || undefined;
  }

  async createTeenPermissions(insertPermissions: InsertTeenPermissions): Promise<TeenPermissions> {
    const [permissions] = await db
      .insert(teenPermissions)
      .values(insertPermissions)
      .returning();
    return permissions;
  }

  async updateTeenPermissions(teenUserId: number, updates: Partial<TeenPermissions>, modifiedBy: number): Promise<TeenPermissions | undefined> {
    const [permissions] = await db
      .update(teenPermissions)
      .set({
        ...updates,
        modifiedBy,
        modifiedAt: new Date()
      })
      .where(eq(teenPermissions.teenUserId, teenUserId))
      .returning();
    return permissions || undefined;
  }

  async isTeenAllowed(teenUserId: number, action: 'modifyAssignments' | 'addEvents' | 'addTasks' | 'addExpenses'): Promise<boolean> {
    const permissions = await this.getTeenPermissions(teenUserId);
    if (!permissions) return false;
    
    // If read-only mode is enabled, deny all modifications
    if (permissions.isReadOnly) return false;
    
    switch (action) {
      case 'modifyAssignments':
        return permissions.canModifyAssignments ?? false;
      case 'addEvents':
        return permissions.canAddEvents ?? false;
      case 'addTasks':
        return permissions.canAddTasks ?? false;
      case 'addExpenses':
        return permissions.canAddExpenses ?? false;
      default:
        return false;
    }
  }
}

export const storage = new DatabaseStorage();