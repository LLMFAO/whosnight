import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, DollarSign, CheckSquare, Check, X, User } from "lucide-react";
import { formatDisplayDate } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DetailedNotificationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingItems: {
    assignments: any[];
    events: any[];
    tasks: any[];
    expenses: any[];
  };
}

export default function DetailedNotificationsModal({
  open,
  onOpenChange,
  pendingItems
}: DetailedNotificationsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const acceptItemMutation = useMutation({
    mutationFn: async ({ itemType, itemId }: { itemType: string; itemId: number }) => {
      const response = await fetch(`/api/pending/accept-item`, {
        method: "POST",
        body: JSON.stringify({ itemType, itemId }),
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("Failed to accept item");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
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
      const itemTypes = [];
      if (pendingItems.assignments.length > 0) itemTypes.push("assignments");
      if (pendingItems.events.length > 0) itemTypes.push("events");
      if (pendingItems.tasks.length > 0) itemTypes.push("tasks");
      if (pendingItems.expenses.length > 0) itemTypes.push("expenses");

      const response = await fetch(`/api/pending/accept-all`, {
        method: "POST",
        body: JSON.stringify({ itemTypes }),
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("Failed to accept all items");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
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
    pendingItems.tasks.length + 
    pendingItems.expenses.length;

  if (totalPendingCount === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                  <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">
                        {formatDisplayDate(new Date(assignment.date))}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>
                          Assigned to: <Badge className={assignment.assignedTo === "mom" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                            {assignment.assignedTo === "mom" ? "Mom" : "Dad"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Requested by: <span className={assignment.createdBy === 1 ? "text-red-600 font-medium" : assignment.createdBy === 2 ? "text-blue-600 font-medium" : "text-green-600 font-medium"}>
                            {assignment.createdBy === 1 ? "Mom" : assignment.createdBy === 2 ? "Dad" : "Teen"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptItem("assignment", assignment.id)}
                      disabled={acceptItemMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
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
                  Scheduled activities awaiting confirmation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingItems.events.map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{event.name}</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>
                          {formatDisplayDate(new Date(event.date))}
                          {event.time && ` at ${event.time}`}
                          {event.location && ` • ${event.location}`}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Requested by: <span className={event.createdBy === 1 ? "text-red-600 font-medium" : event.createdBy === 2 ? "text-blue-600 font-medium" : "text-green-600 font-medium"}>
                            {event.createdBy === 1 ? "Mom" : event.createdBy === 2 ? "Dad" : "Teen"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptItem("event", event.id)}
                      disabled={acceptItemMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
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
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{task.name}</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>
                          Assigned to: <Badge variant="outline">{task.assignedTo}</Badge>
                          {task.dueDate && ` • Due: ${formatDisplayDate(new Date(task.dueDate))}`}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Requested by: <span className={task.createdBy === 1 ? "text-red-600 font-medium" : task.createdBy === 2 ? "text-blue-600 font-medium" : "text-green-600 font-medium"}>
                            {task.createdBy === 1 ? "Mom" : task.createdBy === 2 ? "Dad" : "Teen"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptItem("task", task.id)}
                      disabled={acceptItemMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Expenses */}
          {pendingItems.expenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Expenses ({pendingItems.expenses.length})
                </CardTitle>
                <CardDescription>
                  Expense entries awaiting confirmation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingItems.expenses.map((expense: any) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{expense.name}</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>
                          ${expense.amount} • {expense.category} • Paid by: {expense.paidBy}
                          {expense.date && ` • ${formatDisplayDate(new Date(expense.date))}`}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Requested by: <span className={expense.createdBy === 1 ? "text-red-600 font-medium" : expense.createdBy === 2 ? "text-blue-600 font-medium" : "text-green-600 font-medium"}>
                            {expense.createdBy === 1 ? "Mom" : expense.createdBy === 2 ? "Dad" : "Teen"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptItem("expense", expense.id)}
                      disabled={acceptItemMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
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