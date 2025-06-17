import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCalendarAssignmentSchema,
  insertEventSchema,
  insertTaskSchema,
  insertExpenseSchema,
  insertActionLogSchema,
  insertShareLinkSchema,
  insertTeenPermissionsSchema
} from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper function to get client IP
  const getClientIP = (req: any) => {
    return req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
  };

  // Mock authentication middleware (in production, use proper auth)
  const mockAuth = (req: any, res: any, next: any) => {
    // For demo purposes, alternate between users to show pending functionality
    // In a real app, this would be based on actual session/auth
    const userParam = req.query.user || req.headers['x-user'] || 'mom';
    if (userParam === 'dad') {
      req.user = { id: 2, username: "dad", role: "dad" };
    } else if (userParam === 'teen') {
      req.user = { id: 3, username: "teen", role: "teen" };
    } else {
      req.user = { id: 1, username: "mom", role: "mom" };
    }
    next();
  };

  // Calendar routes
  app.get("/api/calendar/assignments/:month", mockAuth, async (req, res) => {
    try {
      const { month } = req.params;
      const assignments = await storage.getCalendarAssignments(month);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch calendar assignments" });
    }
  });

  app.post("/api/calendar/assignments", mockAuth, async (req, res) => {
    try {
      const validatedData = insertCalendarAssignmentSchema.parse({
        ...req.body,
        createdBy: req.user.id,
      });
      
      // Check if assignment already exists for this date
      const existing = await storage.getCalendarAssignment(validatedData.date);
      if (existing) {
        // Update existing assignment
        const updated = await storage.updateCalendarAssignment(existing.id, {
          assignedTo: validatedData.assignedTo,
          createdBy: req.user.id,
          status: "pending"
        });
        
        // Log the action
        await storage.createActionLog({
          userId: req.user.id,
          action: "update_calendar_assignment",
          details: `Updated assignment for ${validatedData.date} to ${validatedData.assignedTo}`,
          ipAddress: getClientIP(req),
        });
        
        res.json(updated);
      } else {
        const assignment = await storage.createCalendarAssignment(validatedData);
        
        // Log the action
        await storage.createActionLog({
          userId: req.user.id,
          action: "create_calendar_assignment",
          details: `Assigned ${validatedData.date} to ${validatedData.assignedTo}`,
          ipAddress: getClientIP(req),
        });
        
        res.json(assignment);
      }
    } catch (error) {
      res.status(400).json({ message: "Invalid calendar assignment data" });
    }
  });

  app.put("/api/calendar/assignments/:id/status", mockAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const updated = await storage.updateCalendarAssignment(parseInt(id), { status });
      if (!updated) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Log the action
      await storage.createActionLog({
        userId: req.user.id,
        action: status === "confirmed" ? "accept_calendar_assignment" : "decline_calendar_assignment",
        details: `${status === "confirmed" ? "Accepted" : "Declined"} calendar assignment for ${updated.date}`,
        ipAddress: getClientIP(req),
      });
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update assignment status" });
    }
  });

  // Events routes
  app.get("/api/events/:date", mockAuth, async (req, res) => {
    try {
      const { date } = req.params;
      const events = await storage.getEvents(date);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post("/api/events", mockAuth, async (req, res) => {
    try {
      const validatedData = insertEventSchema.parse({
        ...req.body,
        createdBy: req.user.id,
      });
      
      const event = await storage.createEvent(validatedData);
      
      // Log the action
      await storage.createActionLog({
        userId: req.user.id,
        action: "create_event",
        details: `Created event "${validatedData.name}" for ${validatedData.date}`,
        ipAddress: getClientIP(req),
      });
      
      res.json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  app.put("/api/events/:id/status", mockAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const updated = await storage.updateEvent(parseInt(id), { status });
      if (!updated) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Log the action
      await storage.createActionLog({
        userId: req.user.id,
        action: status === "confirmed" ? "accept_event" : "decline_event",
        details: `${status === "confirmed" ? "Accepted" : "Declined"} event "${updated.name}"`,
        ipAddress: getClientIP(req),
      });
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update event status" });
    }
  });

  // Tasks routes
  app.get("/api/tasks", mockAuth, async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", mockAuth, async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        createdBy: req.user.id,
      });
      
      const task = await storage.createTask(validatedData);
      
      // Log the action
      await storage.createActionLog({
        userId: req.user.id,
        action: "create_task",
        details: `Created task "${validatedData.name}"`,
        ipAddress: getClientIP(req),
      });
      
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.put("/api/tasks/:id/status", mockAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const updated = await storage.updateTask(parseInt(id), { status });
      if (!updated) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Log the action
      await storage.createActionLog({
        userId: req.user.id,
        action: status === "confirmed" ? "accept_task" : "decline_task",
        details: `${status === "confirmed" ? "Accepted" : "Declined"} task "${updated.name}"`,
        ipAddress: getClientIP(req),
      });
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task status" });
    }
  });

  app.put("/api/tasks/:id/complete", mockAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { completed } = req.body;
      
      const updated = await storage.updateTask(parseInt(id), { completed });
      if (!updated) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Log the action
      await storage.createActionLog({
        userId: req.user.id,
        action: completed ? "complete_task" : "uncomplete_task",
        details: `${completed ? "Completed" : "Uncompleted"} task "${updated.name}"`,
        ipAddress: getClientIP(req),
      });
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task completion" });
    }
  });

  // Expenses routes
  app.get("/api/expenses", mockAuth, async (req, res) => {
    try {
      const { month } = req.query;
      const expenses = await storage.getExpenses(month as string);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", mockAuth, async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse({
        ...req.body,
        createdBy: req.user.id,
      });
      
      const expense = await storage.createExpense(validatedData);
      
      // Log the action
      await storage.createActionLog({
        userId: req.user.id,
        action: "create_expense",
        details: `Created expense "${validatedData.name}" for $${validatedData.amount}`,
        ipAddress: getClientIP(req),
      });
      
      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: "Invalid expense data" });
    }
  });

  app.put("/api/expenses/:id/status", mockAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const updated = await storage.updateExpense(parseInt(id), { status });
      if (!updated) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      // Log the action
      await storage.createActionLog({
        userId: req.user.id,
        action: status === "confirmed" ? "accept_expense" : "decline_expense",
        details: `${status === "confirmed" ? "Accepted" : "Declined"} expense "${updated.name}"`,
        ipAddress: getClientIP(req),
      });
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update expense status" });
    }
  });

  // Pending items routes
  app.get("/api/pending", mockAuth, async (req, res) => {
    try {
      const pendingItems = await storage.getPendingItems(req.user.id);
      res.json(pendingItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending items" });
    }
  });

  app.post("/api/accept-all", mockAuth, async (req, res) => {
    try {
      const { itemTypes } = req.body;
      await storage.acceptAllPendingItems(req.user.id, itemTypes);
      
      // Log the action
      await storage.createActionLog({
        userId: req.user.id,
        action: "accept_all_changes",
        details: `Accepted all pending changes for: ${itemTypes.join(", ")}`,
        ipAddress: getClientIP(req),
      });
      
      res.json({ message: "All pending items accepted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to accept all items" });
    }
  });

  // Share links routes
  app.post("/api/share-link", mockAuth, async (req, res) => {
    try {
      const linkId = nanoid(10);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry
      
      const shareLink = await storage.createShareLink({
        linkId,
        createdBy: req.user.id,
        message: req.body.message || "CoParent Connect Update: Changes have been made!",
        expiresAt,
      });
      
      // Log the action
      await storage.createActionLog({
        userId: req.user.id,
        action: "share_via_link",
        details: `Generated share link: ${linkId}`,
        ipAddress: getClientIP(req),
      });
      
      // In a real app, you'd use the actual domain
      const shareUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/share/${linkId}`;
      
      res.json({ ...shareLink, shareUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to create share link" });
    }
  });

  app.post("/api/notify-external", mockAuth, async (req, res) => {
    try {
      // Log the action
      await storage.createActionLog({
        userId: req.user.id,
        action: "notify_external",
        details: "Notified co-parent via external channel",
        ipAddress: getClientIP(req),
      });
      
      res.json({ message: "External notification logged" });
    } catch (error) {
      res.status(500).json({ message: "Failed to log external notification" });
    }
  });

  // Accept individual pending item
  app.post('/api/pending/accept-item', async (req, res) => {
    try {
      const { itemType, itemId } = req.body;
      const userId = (req as any).user?.id || 1; // Mock authentication
      
      await storage.acceptPendingItem(itemType, itemId, userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error accepting pending item:', error);
      res.status(500).json({ error: 'Failed to accept pending item' });
    }
  });

  // Accept all pending items
  app.post('/api/pending/accept-all', async (req, res) => {
    try {
      const { itemTypes } = req.body;
      const userId = (req as any).user?.id || 1; // Mock authentication
      
      await storage.acceptAllPendingItems(userId, itemTypes);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error accepting all pending items:', error);
      res.status(500).json({ success: false, message: 'Failed to accept pending items' });
    }
  });

  // Get change history for a specific entity
  app.get("/api/history/:entityType/:entityId", async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const logs = await storage.getEntityLogs(entityType, parseInt(entityId));
      res.json(logs);
    } catch (error) {
      console.error('Error fetching entity history:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  // Get user's request history
  app.get("/api/my-requests", async (req, res) => {
    try {
      const currentUser = req.headers['x-user'] as string || 'mom';
      const userId = currentUser === 'mom' ? 1 : (currentUser === 'dad' ? 2 : 3);
      
      const requests = await storage.getUserRequestHistory(userId);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching user requests:', error);
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
  });

  // Undo a specific change
  app.post("/api/undo/:logId", async (req, res) => {
    try {
      const { logId } = req.params;
      const currentUser = req.headers['x-user'] as string || 'mom';
      const userId = currentUser === 'mom' ? 1 : (currentUser === 'dad' ? 2 : 3);
      
      // Get the original log entry
      const logs = await storage.getActionLogs();
      const originalLog = logs.find(log => log.id === parseInt(logId));
      
      if (!originalLog || !originalLog.previousState) {
        return res.status(400).json({ error: 'Cannot undo this change' });
      }

      // Only allow undoing your own requests
      if (originalLog.requestedBy !== userId) {
        return res.status(403).json({ error: 'You can only undo your own requests' });
      }

      const previousState = JSON.parse(originalLog.previousState);
      
      // Restore the previous state based on entity type
      switch (originalLog.entityType) {
        case 'assignment':
          await storage.updateCalendarAssignment(originalLog.entityId!, previousState);
          break;
        case 'event':
          await storage.updateEvent(originalLog.entityId!, previousState);
          break;
        case 'task':
          await storage.updateTask(originalLog.entityId!, previousState);
          break;
        case 'expense':
          await storage.updateExpense(originalLog.entityId!, previousState);
          break;
      }

      // Log the undo action
      await storage.createActionLog({
        userId,
        action: 'undone',
        entityType: originalLog.entityType || 'unknown',
        entityId: originalLog.entityId || 0,
        details: `Undid change: ${originalLog.action}`,
        requestedBy: userId,
        ipAddress: null
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error undoing change:', error);
      res.status(500).json({ error: 'Failed to undo change' });
    }
  });

  // Teen permissions routes
  app.get("/api/teen-permissions/:teenUserId", mockAuth, async (req, res) => {
    try {
      const teenUserId = parseInt(req.params.teenUserId);
      const permissions = await storage.getTeenPermissions(teenUserId);
      
      if (!permissions) {
        // Create default read-only permissions for new teen
        const defaultPermissions = await storage.createTeenPermissions({
          teenUserId,
          canModifyAssignments: false,
          canAddEvents: false,
          canAddTasks: false,
          canAddExpenses: false,
          isReadOnly: true,
          modifiedBy: req.user.id
        });
        return res.json(defaultPermissions);
      }
      
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get teen permissions" });
    }
  });

  app.post("/api/teen-permissions", mockAuth, async (req, res) => {
    try {
      // Only parents can create/modify teen permissions
      if (req.user.role === "teen") {
        return res.status(403).json({ message: "Teens cannot modify their own permissions" });
      }

      const validatedData = insertTeenPermissionsSchema.parse({
        ...req.body,
        modifiedBy: req.user.id
      });

      const permissions = await storage.createTeenPermissions(validatedData);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to create teen permissions" });
    }
  });

  app.put("/api/teen-permissions/:teenUserId", mockAuth, async (req, res) => {
    try {
      const teenUserId = parseInt(req.params.teenUserId);
      
      // Only parents can modify teen permissions
      if (req.user.role === "teen") {
        return res.status(403).json({ message: "Teens cannot modify their own permissions" });
      }

      const permissions = await storage.updateTeenPermissions(
        teenUserId, 
        req.body, 
        req.user.id
      );
      
      if (!permissions) {
        return res.status(404).json({ message: "Teen permissions not found" });
      }

      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to update teen permissions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
