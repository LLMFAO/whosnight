import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: text("name"), // Optional: User-defined family name
  code: text("code").notNull().unique(), // Unique code for joining families
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // "mom", "dad", "teen", or "caretaker"
  familyId: integer("family_id").references(() => families.id), // Links to the families table
});

export const calendarAssignments = pgTable("calendar_assignments", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD format
  assignedTo: text("assigned_to"), // "mom", "dad", or null
  createdBy: integer("created_by").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "confirmed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD format
  name: text("name").notNull(),
  time: text("time"), // Optional time string
  location: text("location"),
  description: text("description"),
  children: text("children").array().default([]),
  createdBy: integer("created_by").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "confirmed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  dueDate: text("due_date"), // YYYY-MM-DD format
  assignedTo: text("assigned_to").notNull(), // "mom" or "dad"
  completed: boolean("completed").default(false).notNull(),
  createdBy: integer("created_by").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "confirmed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  paidBy: text("paid_by").notNull(), // "mom" or "dad"
  description: text("description"),
  hasReceipt: boolean("has_receipt").default(false).notNull(),
  createdBy: integer("created_by").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "confirmed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const actionLogs = pgTable("action_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(), // "created", "updated", "deleted", "approved", "rejected", "undone"
  entityType: text("entity_type"), // "assignment", "event", "task", "expense" - nullable for backward compatibility
  entityId: integer("entity_id"), // nullable for backward compatibility
  details: text("details").notNull(), // JSON string with change details
  previousState: text("previous_state"), // JSON string with previous state for undo
  requestedBy: integer("requested_by"), // Who originally requested this change
  approvedBy: integer("approved_by"), // Who approved this change
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const shareLinks = pgTable("share_links", {
  id: serial("id").primaryKey(),
  linkId: text("link_id").notNull().unique(),
  createdBy: integer("created_by").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const teenPermissions = pgTable("teen_permissions", {
  id: serial("id").primaryKey(),
  teenUserId: integer("teen_user_id").notNull(),
  canModifyAssignments: boolean("can_modify_assignments").default(false),
  canAddEvents: boolean("can_add_events").default(false),
  canAddTasks: boolean("can_add_tasks").default(false),
  canAddExpenses: boolean("can_add_expenses").default(false), // Added this line
  isReadOnly: boolean("is_read_only").default(true),
  modifiedBy: integer("modified_by").notNull(), // parent who set permissions
  modifiedAt: timestamp("modified_at").defaultNow().notNull(),
});

// Insert schemas
export const insertFamilySchema = createInsertSchema(families).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertCalendarAssignmentSchema = createInsertSchema(calendarAssignments).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  status: true,
  completed: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  status: true,
  hasReceipt: true,
});

export const insertActionLogSchema = createInsertSchema(actionLogs).omit({
  id: true,
  timestamp: true,
});

export const insertShareLinkSchema = createInsertSchema(shareLinks).omit({
  id: true,
  createdAt: true,
});

export const insertTeenPermissionsSchema = createInsertSchema(teenPermissions).omit({
  id: true,
  modifiedAt: true,
});

// Types
export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  // Add other updatable fields here, e.g., password, role, familyId
  // For password, you'd typically have a separate change password flow
  // For role and familyId, changes might be restricted to admin roles
});
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type CalendarAssignment = typeof calendarAssignments.$inferSelect;
export type InsertCalendarAssignment = z.infer<typeof insertCalendarAssignmentSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type ActionLog = typeof actionLogs.$inferSelect;
export type InsertActionLog = z.infer<typeof insertActionLogSchema>;

export type ShareLink = typeof shareLinks.$inferSelect;
export type InsertShareLink = z.infer<typeof insertShareLinkSchema>;

export type TeenPermissions = typeof teenPermissions.$inferSelect;
export type InsertTeenPermissions = z.infer<typeof insertTeenPermissionsSchema>;

export const insertMultipleCalendarAssignmentsSchema = z.array(insertCalendarAssignmentSchema);
export type InsertMultipleCalendarAssignments = z.infer<typeof insertMultipleCalendarAssignmentsSchema>;
