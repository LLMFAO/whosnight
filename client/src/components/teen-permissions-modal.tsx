import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TeenPermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teenUserId: number;
}

interface TeenPermissions {
  id: number;
  teenUserId: number;
  canModifyAssignments: boolean;
  canAddEvents: boolean;
  canAddTasks: boolean;
  canAddExpenses: boolean;
  isReadOnly: boolean;
  modifiedBy: number;
  modifiedAt: string;
}

export default function TeenPermissionsModal({ 
  open, 
  onOpenChange, 
  teenUserId 
}: TeenPermissionsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['/api/teen-permissions', teenUserId],
    enabled: open && teenUserId > 0,
  });

  const [localPermissions, setLocalPermissions] = useState<Partial<TeenPermissions>>({});

  // Update local state when permissions are loaded
  useEffect(() => {
    if (permissions) {
      setLocalPermissions({
        canModifyAssignments: permissions.canModifyAssignments,
        canAddEvents: permissions.canAddEvents,
        canAddTasks: permissions.canAddTasks,
        canAddExpenses: permissions.canAddExpenses,
        isReadOnly: permissions.isReadOnly,
      });
    }
  }, [permissions]);

  const updatePermissionsMutation = useMutation({
    mutationFn: async (updatedPermissions: Partial<TeenPermissions>) => {
      return await apiRequest(`/api/teen-permissions/${teenUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPermissions),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teen-permissions', teenUserId] });
      toast({
        title: "Permissions Updated",
        description: "Teen permissions have been successfully updated.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update teen permissions.",
        variant: "destructive",
      });
    },
  });

  const handlePermissionChange = (permission: keyof TeenPermissions, value: boolean) => {
    setLocalPermissions(prev => ({ ...prev, [permission]: value }));
  };

  const handleReadOnlyToggle = (value: boolean) => {
    setLocalPermissions(prev => ({
      ...prev,
      isReadOnly: value,
      // If read-only is enabled, disable all other permissions
      ...(value ? {
        canModifyAssignments: false,
        canAddEvents: false,
        canAddTasks: false,
        canAddExpenses: false,
      } : {})
    }));
  };

  const handleSave = () => {
    updatePermissionsMutation.mutate(localPermissions);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Teen Permissions</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">Loading permissions...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Teen Permissions Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Read-Only Mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="read-only" className="text-base font-medium">
                Read-Only Mode
              </Label>
              <Switch
                id="read-only"
                checked={localPermissions.isReadOnly ?? true}
                onCheckedChange={handleReadOnlyToggle}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              When enabled, teen can only view information but cannot make any changes.
            </p>
          </div>

          <Separator />

          {/* Individual Permissions */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Individual Permissions {localPermissions.isReadOnly && "(Disabled in Read-Only Mode)"}
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="modify-assignments" className="text-sm">
                  Modify Calendar Assignments
                </Label>
                <Switch
                  id="modify-assignments"
                  checked={localPermissions.canModifyAssignments ?? false}
                  onCheckedChange={(value) => handlePermissionChange('canModifyAssignments', value)}
                  disabled={localPermissions.isReadOnly}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="add-events" className="text-sm">
                  Add Events
                </Label>
                <Switch
                  id="add-events"
                  checked={localPermissions.canAddEvents ?? false}
                  onCheckedChange={(value) => handlePermissionChange('canAddEvents', value)}
                  disabled={localPermissions.isReadOnly}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="add-tasks" className="text-sm">
                  Add Tasks
                </Label>
                <Switch
                  id="add-tasks"
                  checked={localPermissions.canAddTasks ?? false}
                  onCheckedChange={(value) => handlePermissionChange('canAddTasks', value)}
                  disabled={localPermissions.isReadOnly}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="add-expenses" className="text-sm">
                  Add Expenses
                </Label>
                <Switch
                  id="add-expenses"
                  checked={localPermissions.canAddExpenses ?? false}
                  onCheckedChange={(value) => handlePermissionChange('canAddExpenses', value)}
                  disabled={localPermissions.isReadOnly}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updatePermissionsMutation.isPending}
          >
            {updatePermissionsMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}