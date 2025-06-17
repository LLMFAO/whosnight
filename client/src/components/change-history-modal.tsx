import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock, User, Undo2, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChangeHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  entityId: number;
  entityName?: string;
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

const getUserName = (userId: number) => {
  switch (userId) {
    case 1: return "Mom";
    case 2: return "Dad";
    case 3: return "Teen";
    default: return "Unknown";
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case "created": return "bg-green-100 text-green-800";
    case "updated": return "bg-blue-100 text-blue-800";  
    case "approved": return "bg-emerald-100 text-emerald-800";
    case "rejected": return "bg-red-100 text-red-800";
    case "undone": return "bg-orange-100 text-orange-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export default function ChangeHistoryModal({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName
}: ChangeHistoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [undoingLogId, setUndoingLogId] = useState<number | null>(null);

  // Get current user
  const currentUser = localStorage.getItem('currentUser') || 'mom';
  const currentUserId = currentUser === 'mom' ? 1 : (currentUser === 'dad' ? 2 : 3);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['entity-history', entityType, entityId],
    queryFn: () => fetch(`/api/history/${entityType}/${entityId}`, {
      headers: { 'x-user': currentUser }
    }).then(res => res.json()),
    enabled: open,
  });

  // Get current assignment status
  const { data: currentAssignment } = useQuery({
    queryKey: ['current-assignment', entityType, entityId],
    queryFn: async () => {
      if (entityType === 'calendar_assignment' && entityId > 0) {
        const response = await fetch(`/api/calendar/assignment/${entityId}`, {
          headers: { 'x-user': currentUser }
        });
        return response.ok ? response.json() : null;
      }
      return null;
    },
    enabled: open && entityType === 'calendar_assignment' && entityId > 0,
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
        title: "Change undone successfully",
        description: "The change has been reverted to its previous state."
      });
      queryClient.invalidateQueries({ queryKey: ['entity-history'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setUndoingLogId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to undo change",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
      setUndoingLogId(null);
    }
  });

  const handleUndo = (logId: number) => {
    setUndoingLogId(logId);
    undoMutation.mutate(logId);
  };

  const canUndo = (log: ActionLog) => {
    return log.requestedBy === currentUserId && 
           log.previousState && 
           log.action !== 'undone' &&
           !logs.some((l: ActionLog) => l.action === 'undone' && l.details.includes(log.action));
  };

  const getActionDisplay = (action: string) => {
    switch (action) {
      case 'create_calendar_assignment':
        return { label: 'Night assigned', color: 'bg-blue-100 text-blue-800' };
      case 'update_calendar_assignment':
        return { label: 'Night changed', color: 'bg-blue-100 text-blue-800' };
      case 'accept_calendar_assignment':
        return { label: 'Approved', color: 'bg-green-100 text-green-800' };
      case 'decline_calendar_assignment':
        return { label: 'Declined', color: 'bg-red-100 text-red-800' };
      case 'undone':
        return { label: 'Undone', color: 'bg-gray-100 text-gray-800' };
      default:
        return { label: 'Updated', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getCurrentStatus = () => {
    if (currentAssignment) {
      const { status, createdBy } = currentAssignment;
      const creatorName = getUserName(createdBy);
      
      if (status === "pending") {
        const needsApproval = createdBy !== currentUserId;
        if (needsApproval) {
          return {
            text: `Pending approval from ${creatorName === "Mom" ? "Dad" : "Mom"}`,
            color: "bg-orange-100 text-orange-800"
          };
        } else {
          return {
            text: "Waiting for approval",
            color: "bg-yellow-100 text-yellow-800"
          };
        }
      } else if (status === "confirmed") {
        return {
          text: "Confirmed",
          color: "bg-green-100 text-green-800"
        };
      }
    }
    return null;
  };

  const currentStatus = getCurrentStatus();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Change History
            {entityName && <span className="text-muted-foreground">- {entityName}</span>}
          </DialogTitle>
          {currentStatus && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Current status:</span>
              <Badge className={currentStatus.color}>
                {currentStatus.text}
              </Badge>
            </div>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading history...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <AlertCircle className="h-5 w-5 mr-2" />
              No change history available
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log: ActionLog) => {
                const actionDisplay = getActionDisplay(log.action);
                const logDate = new Date(log.timestamp);
                const timeAgo = logDate.toLocaleDateString() + ' at ' + logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={actionDisplay.color}>
                          {actionDisplay.label}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          {getUserName(log.userId)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {timeAgo}
                        </div>
                      </div>
                      
                      <p className="text-sm mb-2">{log.details}</p>
                      
                      {log.requestedBy && log.requestedBy !== log.userId && (
                        <div className="text-xs text-muted-foreground">
                          Originally requested by: {getUserName(log.requestedBy)}
                        </div>
                      )}
                      
                      {log.approvedBy && log.approvedBy !== log.userId && (
                        <div className="text-xs text-muted-foreground">
                          Approved by: {getUserName(log.approvedBy)}
                        </div>
                      )}
                    </div>
                    
                    {canUndo(log) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUndo(log.id)}
                        disabled={undoingLogId === log.id}
                        className="ml-2"
                      >
                        <Undo2 className="h-3 w-3 mr-1" />
                        {undoingLogId === log.id ? 'Undoing...' : 'Undo'}
                      </Button>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}