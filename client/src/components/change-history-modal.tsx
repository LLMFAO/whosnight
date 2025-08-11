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
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/auth-provider";
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
  const { user } = useAuth();
  const [undoingLogId, setUndoingLogId] = useState<number | null>(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['entity-history', entityType, entityId],
    queryFn: async () => {
      if (!user?.familyId) return [];
      
      const { data, error } = await supabase
        .from("action_logs")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("Error fetching action logs:", error);
        return [];
      }

      return data || [];
    },
    enabled: open && !!user?.familyId,
  });

  // Get current assignment status
  const { data: currentAssignment } = useQuery({
    queryKey: ['current-assignment', entityType, entityId],
    queryFn: async () => {
      if (!user?.familyId || entityType !== 'calendar_assignment' || entityId <= 0) {
        return null;
      }
      
      const { data, error } = await supabase
        .from("calendar_assignments")
        .select("*")
        .eq("id", entityId)
        .single();

      if (error) {
        console.error("Error fetching current assignment:", error);
        return null;
      }

      return data;
    },
    enabled: open && entityType === 'calendar_assignment' && entityId > 0 && !!user?.familyId,
  });

  const undoMutation = useMutation({
    mutationFn: async (logId: number) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Find the log entry to undo
      const logToUndo = logs.find((log: ActionLog) => log.id === logId);
      if (!logToUndo || !logToUndo.previousState) {
        throw new Error("Cannot undo this action - no previous state available");
      }

      // Parse the previous state
      let previousState;
      try {
        previousState = JSON.parse(logToUndo.previousState);
      } catch (error) {
        throw new Error("Invalid previous state data");
      }

      // Determine which table to update based on entity type
      let tableName = "";
      switch (logToUndo.entityType) {
        case "calendar_assignment": tableName = "calendar_assignments"; break;
        case "event": tableName = "events"; break;
        case "task": tableName = "tasks"; break;
        default: throw new Error(`Unsupported entity type: ${logToUndo.entityType}`);
      }

      // Restore the previous state
      const { error: updateError } = await supabase
        .from(tableName)
        .update(previousState)
        .eq("id", logToUndo.entityId);

      if (updateError) throw updateError;

      // Log the undo action
      const { error: logError } = await supabase
        .from("action_logs")
        .insert({
          userId: user.id,
          action: "undone",
          entityType: logToUndo.entityType,
          entityId: logToUndo.entityId,
          details: `Undone action: ${logToUndo.action}`,
          previousState: null,
          requestedBy: user.id,
        });

      if (logError) console.warn("Failed to log undo action:", logError);

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Change undone successfully",
        description: "The change has been reverted to its previous state."
      });
      queryClient.invalidateQueries({ queryKey: ['entity-history'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
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
    return log.requestedBy === user?.id && 
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
      const { status, created_by } = currentAssignment;
      const creatorName = getUserName(created_by);
      
      if (status === "pending") {
        const needsApproval = created_by !== user?.id;
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