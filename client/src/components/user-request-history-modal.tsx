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
import { Clock, Undo2, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

const getActionIcon = (action: string) => {
  switch (action) {
    case "approved": return <CheckCircle className="h-4 w-4" />;
    case "rejected": return <XCircle className="h-4 w-4" />;
    case "undone": return <Undo2 className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
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
        title: "Change undone successfully",
        description: "Your request has been reverted to its previous state."
      });
      queryClient.invalidateQueries({ queryKey: ['my-requests', currentUser] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['pending'] });
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

  const canUndo = (request: ActionLog) => {
    return request.previousState && 
           request.action !== 'undone' &&
           !requests.some((r: ActionLog) => r.action === 'undone' && r.details.includes(request.action));
  };

  const getRequestStatus = (request: ActionLog) => {
    const hasBeenUndone = requests.some((r: ActionLog) => 
      r.action === 'undone' && r.details.includes(request.action)
    );
    
    if (hasBeenUndone) return 'undone';
    if (request.approvedBy) return 'approved';
    
    // Most actions are automatically approved/completed, not pending
    if (['create_calendar_assignment', 'update_calendar_assignment', 'create_event', 'update_event', 'create_task', 'update_task', 'cancel_event', 'accept_pending_item', 'accept_all_pending'].includes(request.action)) {
      return 'completed';
    }
    
    return 'pending';
  };

  const groupedRequests = requests.reduce((acc: any, request: ActionLog) => {
    const status = getRequestStatus(request);
    if (!acc[status]) acc[status] = [];
    acc[status].push(request);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            My Request History
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading your requests...</div>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <AlertCircle className="h-5 w-5 mr-2" />
              No requests found
            </div>
          ) : (
            <div className="space-y-6">
              {['pending', 'completed', 'approved', 'undone'].map(status => {
                const statusRequests = groupedRequests[status] || [];
                if (statusRequests.length === 0) return null;

                return (
                  <div key={status}>
                    <h3 className="font-medium mb-3 capitalize text-sm text-muted-foreground">
                      {status} Requests ({statusRequests.length})
                    </h3>
                    <div className="space-y-3">
                      {statusRequests.map((request: ActionLog) => (
                        <div key={request.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getActionIcon(status)}
                                <Badge className={getActionColor(request.action)}>
                                  {request.action}
                                </Badge>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(request.timestamp).toLocaleString()}
                                </div>
                              </div>
                              
                              <p className="text-sm mb-2">{request.details}</p>
                              
                              <div className="text-xs text-muted-foreground">
                                {request.entityType && (
                                  <span className="capitalize">{request.entityType}</span>
                                )}
                                {request.entityId && (
                                  <span> #{request.entityId}</span>
                                )}
                              </div>
                            </div>
                            
                            {status === 'approved' && canUndo(request) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUndo(request.id)}
                                disabled={undoingLogId === request.id}
                                className="ml-2"
                              >
                                <Undo2 className="h-3 w-3 mr-1" />
                                {undoingLogId === request.id ? 'Undoing...' : 'Undo'}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
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