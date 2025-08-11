import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/auth-provider";

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
  const { user } = useAuth();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['teen-permissions', teenUserId],
    queryFn: async () => {
      if (!user?.familyId || teenUserId <= 0) return null;
      
      const { data, error } = await supabase
        .from("teen_permissions")
        .select("*")
        .eq("teen_user_id", teenUserId.toString())
        .single();

      if (error) {
        // If no permissions exist yet, return default values
        if (error.code === 'PGRST116') {
          return {
            teenUserId,
            canModifyAssignments: false,
            canAddEvents: false,
            canAddTasks: false,
            isReadOnly: true,
          };
        }
        console.error("Error fetching teen permissions:", error);
        return null;
      }

      return data;
    },
    enabled: open && teenUserId > 0 && !!user?.familyId,
  });

  const [localPermissions, setLocalPermissions] = useState<Partial<TeenPermissions>>({
    canModifyAssignments: false,
    canAddEvents: false,
    canAddTasks: false,
    isReadOnly: true,
  });

  // Update local state when permissions are loaded
  useEffect(() => {
    if (permissions) {
      setLocalPermissions({
        canModifyAssignments: permissions.canModifyAssignments || false,
        canAddEvents: permissions.canAddEvents || false,
        canAddTasks: permissions.canAddTasks || false,
        isReadOnly: permissions.isReadOnly ?? true,
      });
    }
  }, [permissions]);

  const updatePermissionsMutation = useMutation({
    mutationFn: async (updatedPermissions: Partial<TeenPermissions>) => {
      if (!user?.id) throw new Error("User not authenticated");

      const permissionData = {
        teen_user_id: teenUserId.toString(),
        can_modify_assignments: updatedPermissions.canModifyAssignments || false,
        can_add_events: updatedPermissions.canAddEvents || false,
        can_add_tasks: updatedPermissions.canAddTasks || false,
        is_read_only: updatedPermissions.isReadOnly ?? true,
        modified_by: user.id,
      };

      // Use upsert to create or update permissions
      const { data, error } = await supabase
        .from("teen_permissions")
        .upsert(permissionData, {
          onConflict: "teen_user_id"
        })
        .select()
        .single();

      if (error) throw error;

      // Log the permission change
      const { error: logError } = await supabase
        .from("action_logs")
        .insert({
          userId: user.id,
          action: "update_teen_permissions",
          entityType: "teen_permissions",
          entityId: data.id,
          details: `Updated teen permissions for user ${teenUserId}`,
        });

      if (logError) console.warn("Failed to log permission change:", logError);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teen-permissions', teenUserId] });
      toast({
        title: "Permissions Updated",
        description: "Teen permissions have been successfully updated.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update teen permissions.",
        variant: "destructive",
      });
    },
  });

  const handlePermissionChange = (permission: keyof TeenPermissions, value: boolean) => {
    setLocalPermissions(prev => {
      const newPermissions = { ...prev, [permission]: value };
      
      // Auto-disable read-only mode when enabling any specific permission
      if (value && permission !== 'isReadOnly' && prev.isReadOnly) {
        newPermissions.isReadOnly = false;
      }
      
      return newPermissions;
    });
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
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading permissions...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Teen Permissions</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Read-Only Mode Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="read-only" className="text-sm font-medium">
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
              {!localPermissions.isReadOnly && permissions?.isReadOnly && (
                <span className="block mt-1 text-blue-600 font-medium">
                  ✓ Read-only mode automatically disabled when granting specific permissions
                </span>
              )}
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