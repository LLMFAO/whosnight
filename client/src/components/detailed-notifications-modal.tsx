import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, DollarSign, CheckSquare, Check, X, User } from "lucide-react";
import { formatDisplayDate } from "@/lib/utils";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";

interface DetailedNotificationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingItems: {
    assignments: any[];
    events: any[];
    tasks: any[];
  };
}

export default function DetailedNotificationsModal({
  open,
  onOpenChange,
  pendingItems
}: DetailedNotificationsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch action logs to get cancellation reasons
  const { data: actionLogs = [], error: actionLogsError } = useQuery({
    queryKey: ["action_logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("action_logs").select("*");
      if (error) throw error;
      return data;
    },
    enabled: open && pendingItems.events.some((event: any) => event.status === 'cancelled'),
  });

  // Helper function to extract cancellation reason from action logs
  const getCancellationReason = (eventId: number) => {
    const cancelLog = actionLogs.find((log: any) => 
      log.action === 'cancel_event' && 
      log.entityType === 'event' && 
      log.entityId === eventId
    );
    if (cancelLog?.details) {
      const match = cancelLog.details.match(/: (.+)$/);
      return match ? match[1] : null;
    }
    return null;
  };

  const acceptItemMutation = useMutation({
    mutationFn: async ({ itemType, itemId }: { itemType: string; itemId: number }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Update the item status to "confirmed" in Supabase
      let tableName = "";
      switch (itemType) {
        case "assignment":
          tableName = "calendar_assignments";
          break;
        case "event":
          tableName = "events";
          break;
        case "task":
          tableName = "tasks";
          break;
        default:
          throw new Error(`Unknown item type: ${itemType}`);
      }

      const { error } = await supabase
        .from(tableName)
        .update({ status: "confirmed" })
        .eq("id", itemId);

      if (error) throw error;

      // Log the acceptance action
      const { error: logError } = await supabase
        .from("action_logs")
        .insert({
          userId: user.id,
          action: `accept_${itemType}`,
          entityType: itemType,
          entityId: itemId,
          details: `Accepted ${itemType} with ID ${itemId}`,
        });

      if (logError) console.warn("Failed to log acceptance:", logError);

      return { itemType, itemId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Item accepted",
        description: "The change has been confirmed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept the item. Please try again.",
        variant: "destructive",
      });
    }
  });

  const acceptAllMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const updates = [];

      // Update all pending assignments
      if (pendingItems.assignments.length > 0) {
        const assignmentIds = pendingItems.assignments.map((a: any) => a.id);
        updates.push(
          supabase
            .from("calendar_assignments")
            .update({ status: "confirmed" })
            .in("id", assignmentIds)
        );
      }

      // Update all pending events
      if (pendingItems.events.length > 0) {
        const eventIds = pendingItems.events.map((e: any) => e.id);
        updates.push(
          supabase
            .from("events")
            .update({ status: "confirmed" })
            .in("id", eventIds)
        );
      }

      // Update all pending tasks
      if (pendingItems.tasks.length > 0) {
        const taskIds = pendingItems.tasks.map((t: any) => t.id);
        updates.push(
          supabase
            .from("tasks")
            .update({ status: "confirmed" })
            .in("id", taskIds)
        );
      }

      // Execute all updates
      const results = await Promise.all(updates);
      
      // Check for errors
      for (const result of results) {
        if (result.error) throw result.error;
      }

      // Log the bulk acceptance
      const { error: logError } = await supabase
        .from("action_logs")
        .insert({
          userId: user.id,
          action: "accept_all_pending",
          entityType: "bulk",
          entityId: null,
          details: `Accepted all pending items: ${pendingItems.assignments.length} assignments, ${pendingItems.events.length} events, ${pendingItems.tasks.length} tasks`,
        });

      if (logError) console.warn("Failed to log bulk acceptance:", logError);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "All items accepted",
        description: "All pending changes have been confirmed.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept all items. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAcceptItem = (itemType: string, itemId: number) => {
    acceptItemMutation.mutate({ itemType, itemId });
  };

  const handleAcceptAll = () => {
    acceptAllMutation.mutate();
  };

  const totalPendingCount = 
    pendingItems.assignments.length + 
    pendingItems.events.length + 
    pendingItems.tasks.length;

  if (totalPendingCount === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            Pending Changes ({totalPendingCount})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Accept All Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleAcceptAll}
              disabled={acceptAllMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {acceptAllMutation.isPending ? "Accepting..." : `Accept All (${totalPendingCount})`}
            </Button>
          </div>

          {/* Calendar Assignments */}
          {pendingItems.assignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Calendar Assignments ({pendingItems.assignments.length})
                </CardTitle>
                <CardDescription>
                  Night assignments awaiting confirmation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingItems.assignments.map((assignment: any) => (
                  <div key={assignment.id} className="p-3 border rounded-lg">
                    <div className="space-y-3">
                      <div className="flex-1">
                        <div className="font-medium">
                          {formatDisplayDate(new Date(assignment.date))}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 mt-1">
                          <div>
                            Assigned to: <Badge className={assignment.assignedTo === "mom" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                              {assignment.assignedTo === "mom" ? "Mom" : "Dad"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Requested by: <span className={assignment.created_by === 1 ? "text-red-600 font-medium" : assignment.created_by === 2 ? "text-blue-600 font-medium" : "text-green-600 font-medium"}>
                              {assignment.created_by === 1 ? "Mom" : assignment.created_by === 2 ? "Dad" : "Teen"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptItem("assignment", assignment.id)}
                        disabled={acceptItemMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Events */}
          {pendingItems.events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Events ({pendingItems.events.length})
                </CardTitle>
                <CardDescription>
                  Event changes awaiting confirmation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingItems.events.map((event: any) => (
                  <div key={event.id} className={`p-3 border rounded-lg ${event.status === 'cancelled' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="space-y-3">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="font-medium">{event.name}</div>
                          {event.status === 'cancelled' && (
                            <Badge className="bg-red-100 text-red-700 text-xs w-fit">
                              CANCELLATION REQUEST
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1 mt-1">
                          <div>
                            {formatDisplayDate(new Date(event.date))}
                            {event.time && ` at ${event.time}`}
                            {event.location && ` • ${event.location}`}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Requested by: <span className={event.created_by === 1 ? "text-red-600 font-medium" : event.created_by === 2 ? "text-blue-600 font-medium" : "text-green-600 font-medium"}>
                              {event.created_by === 1 ? "Mom" : event.created_by === 2 ? "Dad" : "Teen"}
                            </span>
                          </div>
                        </div>
                        {event.status === 'cancelled' && (() => {
                          const reason = getCancellationReason(event.id);
                          return reason ? (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                              <strong>Reason:</strong> {reason}
                            </div>
                          ) : null;
                        })()}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptItem("event", event.id)}
                        disabled={acceptItemMutation.isPending}
                        className={`${event.status === 'cancelled' ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} w-full sm:w-auto`}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        {event.status === 'cancelled' ? 'Approve Cancellation' : 'Accept'}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tasks */}
          {pendingItems.tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  Tasks ({pendingItems.tasks.length})
                </CardTitle>
                <CardDescription>
                  To-do items awaiting confirmation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingItems.tasks.map((task: any) => (
                  <div key={task.id} className="p-3 border rounded-lg">
                    <div className="space-y-3">
                      <div className="flex-1">
                        <div className="font-medium">{task.name}</div>
                        <div className="text-sm text-muted-foreground space-y-1 mt-1">
                          <div>
                            Assigned to: <Badge variant="outline">{task.assignedTo}</Badge>
                            {task.dueDate && ` • Due: ${formatDisplayDate(new Date(task.dueDate))}`}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Requested by: <span className={task.created_by === 1 ? "text-red-600 font-medium" : task.created_by === 2 ? "text-blue-600 font-medium" : "text-green-600 font-medium"}>
                              {task.created_by === 1 ? "Mom" : task.created_by === 2 ? "Dad" : "Teen"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptItem("task", task.id)}
                        disabled={acceptItemMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}