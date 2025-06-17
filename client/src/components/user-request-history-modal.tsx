import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, CheckSquare, XCircle, CheckCircle, RotateCcw, User } from "lucide-react";
import { format } from "date-fns";

interface UserRequestHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ActionLog {
  id: number;
  userId: number;
  action: string;
  entityType: string | null;
  entityId: number | null;
  details: string;
  previousState: string | null;
  requestedBy: number | null;
  approvedBy: number | null;
  timestamp: string;
}

// Convert technical actions to user-friendly descriptions
const getActionDescription = (log: ActionLog) => {
  const date = log.details.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  const formattedDate = date ? format(new Date(date), 'MMM d') : '';
  
  switch (log.action) {
    case "create_calendar_assignment":
      if (log.details.includes("to mom")) return `Night assigned to Mom${formattedDate ? ` (${formattedDate})` : ''}`;
      if (log.details.includes("to dad")) return `Night assigned to Dad${formattedDate ? ` (${formattedDate})` : ''}`;
      if (log.details.includes("to teen")) return `Night assigned to Teen${formattedDate ? ` (${formattedDate})` : ''}`;
      return `Night assigned${formattedDate ? ` (${formattedDate})` : ''}`;
    
    case "update_calendar_assignment":
      if (log.details.includes("to mom")) return `Night changed to Mom${formattedDate ? ` (${formattedDate})` : ''}`;
      if (log.details.includes("to dad")) return `Night changed to Dad${formattedDate ? ` (${formattedDate})` : ''}`;
      if (log.details.includes("to teen")) return `Night changed to Teen${formattedDate ? ` (${formattedDate})` : ''}`;
      return `Night changed${formattedDate ? ` (${formattedDate})` : ''}`;
    
    case "create_event":
      const eventName = log.details.match(/Created event "([^"]+)"/)?.[1];
      return `Event added${eventName ? `: ${eventName}` : ''}${formattedDate ? ` (${formattedDate})` : ''}`;
    
    case "update_event":
      const updatedEventName = log.details.match(/Updated event "([^"]+)"/)?.[1];
      return `Event updated${updatedEventName ? `: ${updatedEventName}` : ''}${formattedDate ? ` (${formattedDate})` : ''}`;
    
    case "cancel_event":
      const cancelledEventName = log.details.match(/Cancelled event "([^"]+)"/)?.[1];
      return `Event cancelled${cancelledEventName ? `: ${cancelledEventName}` : ''}${formattedDate ? ` (${formattedDate})` : ''}`;
    
    case "create_task":
      const taskName = log.details.match(/Created task "([^"]+)"/)?.[1];
      return `Task added${taskName ? `: ${taskName}` : ''}`;
    
    case "update_task":
      const updatedTaskName = log.details.match(/Updated task "([^"]+)"/)?.[1];
      return `Task updated${updatedTaskName ? `: ${updatedTaskName}` : ''}`;
    
    case "accept_pending_item":
      return "Approved a change";
    
    case "accept_all_pending":
      return "Approved all pending changes";
    
    case "undone":
      return "Undid a previous change";
    
    default:
      return log.details;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case "create_calendar_assignment":
    case "update_calendar_assignment": 
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "create_event":
    case "update_event": 
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "cancel_event": 
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "create_task":
    case "update_task": 
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "accept_pending_item":
    case "accept_all_pending": 
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
    case "undone": 
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    default: 
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
};

const getActionIcon = (action: string) => {
  switch (action) {
    case "create_calendar_assignment":
    case "update_calendar_assignment": 
      return <Calendar className="h-4 w-4" />;
    case "create_event":
    case "update_event": 
      return <Clock className="h-4 w-4" />;
    case "cancel_event": 
      return <XCircle className="h-4 w-4" />;
    case "create_task":
    case "update_task": 
      return <CheckSquare className="h-4 w-4" />;
    case "accept_pending_item":
    case "accept_all_pending": 
      return <CheckCircle className="h-4 w-4" />;
    case "undone": 
      return <RotateCcw className="h-4 w-4" />;
    default: 
      return <User className="h-4 w-4" />;
  }
};

export default function UserRequestHistoryModal({
  open,
  onOpenChange
}: UserRequestHistoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [undoingLogId, setUndoingLogId] = useState<number | null>(null);

  const currentUser = localStorage.getItem('currentUser') || 'mom';

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['my-requests', currentUser],
    queryFn: () => fetch('/api/my-requests', {
      headers: { 'x-user': currentUser }
    }).then(res => res.json()),
    enabled: open,
  });

  const undoMutation = useMutation({
    mutationFn: async (logId: number) => {
      const response = await fetch(`/api/undo/${logId}`, {
        method: 'POST',
        headers: { 'x-user': currentUser }
      });
      if (!response.ok) throw new Error('Failed to undo change');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Change undone",
        description: "Your action has been reversed."
      });
      queryClient.invalidateQueries({ queryKey: ['my-requests', currentUser] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['pending'] });
      setUndoingLogId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Unable to undo",
        description: error.message || "This change cannot be reversed.",
        variant: "destructive"
      });
      setUndoingLogId(null);
    }
  });

  const canUndo = (request: ActionLog) => {
    return request.action !== 'undone' && 
           !requests.some((r: ActionLog) => r.action === 'undone' && r.details.includes(request.action));
  };

  const handleUndo = async (logId: number) => {
    setUndoingLogId(logId);
    undoMutation.mutate(logId);
  };

  const getRequestStatus = (request: ActionLog) => {
    const hasBeenUndone = requests.some((r: ActionLog) => 
      r.action === 'undone' && r.details.includes(request.action)
    );
    
    if (hasBeenUndone) return "Undone";
    if (request.approvedBy) return "Approved";
    if (request.requestedBy && !request.approvedBy) return "Pending";
    return "Completed";
  };

  // Group requests by date
  const groupedRequests = requests.reduce((acc: any, request: ActionLog) => {
    const date = format(new Date(request.timestamp), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(request);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedRequests).sort((a, b) => b.localeCompare(a));

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Your Activity History</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your history...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Your Activity History</DialogTitle>
          <p className="text-sm text-muted-foreground">
            All your actions and their current status
          </p>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No activity yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your actions will appear here as you use the app
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((date) => (
                <div key={date}>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3 sticky top-0 bg-background">
                    {format(new Date(date), 'EEEE, MMMM d')}
                  </h3>
                  <div className="space-y-3">
                    {groupedRequests[date].map((request: ActionLog) => (
                      <div key={request.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                        <div className={`p-2 rounded-full ${getActionColor(request.action)}`}>
                          {getActionIcon(request.action)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm">
                              {getActionDescription(request)}
                            </p>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {getRequestStatus(request)}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(request.timestamp), 'h:mm a')}
                          </p>
                          
                          {canUndo(request) && (
                            <Button
                              variant="ghost" 
                              size="sm"
                              className="mt-2 h-auto p-1 text-xs hover:bg-orange-50 hover:text-orange-600"
                              onClick={() => handleUndo(request.id)}
                              disabled={undoingLogId === request.id}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              {undoingLogId === request.id ? 'Undoing...' : 'Undo'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {date !== sortedDates[sortedDates.length - 1] && <Separator className="mt-6" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}