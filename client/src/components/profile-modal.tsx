import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/auth-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Users, LogOut, Settings, Share, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TeenPermissionsModal from "./teen-permissions-modal";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const [showTeenSettings, setShowTeenSettings] = useState(false);
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Fetch family information
  const { data: familyData } = useQuery({
    queryKey: ["family", user?.familyId || user?.family_id],
    queryFn: async () => {
      // Check both familyId (camelCase) and family_id (snake_case) from database
      const userFamilyId = user?.familyId || user?.family_id;
      if (!userFamilyId) return null;
      
      const { data, error } = await supabase
        .from("families")
        .select("code, name")
        .eq("id", userFamilyId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!(user?.familyId || user?.family_id) && open,
  });

  // Fetch family members
  const { data: familyMembers } = useQuery({
    queryKey: ["family-members", user?.familyId || user?.family_id],
    queryFn: async () => {
      // Check both familyId (camelCase) and family_id (snake_case) from database
      const userFamilyId = user?.familyId || user?.family_id;
      if (!userFamilyId) return [];
      
      const { data, error } = await supabase
        .from("users")
        .select("id, name, role, username")
        .eq("family_id", userFamilyId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!(user?.familyId || user?.family_id) && open,
  });

  const handleCopyFamilyCode = async () => {
    if (familyData?.code) {
      try {
        await navigator.clipboard.writeText(familyData.code);
        toast({
          title: "Family code copied!",
          description: "Share this code with family members to join.",
        });
      } catch (error) {
        toast({
          title: "Failed to copy",
          description: "Please copy the code manually: " + familyData.code,
          variant: "destructive",
        });
      }
    }
  };

  const handleInviteFamilyMember = async () => {
    if (!familyData?.code) return;

    const shareMessage = `Join our family on Who's Night! 

Use family code: ${familyData.code}

Download the app: https://whosnight.netlify.app

Who's Night helps families coordinate schedules, tasks, and responsibilities together.`;

    try {
      // Try to use native share API if available
      if (navigator.share) {
        await navigator.share({
          title: "Join our family on Who's Night!",
          text: shareMessage,
          url: "https://whosnight.netlify.app"
        });
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(shareMessage);
        toast({
          title: "Invitation copied!",
          description: "Share this message with your family member.",
        });
      }
    } catch (error) {
      // If both fail, show the message in a toast
      toast({
        title: "Share this with your family member:",
        description: shareMessage,
        duration: 10000,
      });
    }
  };

  const isParent = user?.role === "mom" || user?.role === "dad";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Profile
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* User Info */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Logged in as</h3>
                <p className="text-lg font-semibold">{user?.name}</p>
                <Badge variant="secondary" className="mt-1 capitalize">
                  {user?.role}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Family Info */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Family</h3>
                <p className="text-lg font-semibold">
                  {familyData?.name || "Who's Night Family"}
                </p>
              </div>

              {familyData?.code && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Family Code</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                      {familyData.code}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyFamilyCode}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share this code with family members to join
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Family Members */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Family Members ({familyMembers?.length || 0})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInviteFamilyMember}
                  className="h-8 px-3"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Invite
                </Button>
              </div>
              
              <div className="space-y-2">
                {familyMembers?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">@{member.username}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {member.role}
                    </Badge>
                  </div>
                ))}
                
                {(!familyMembers || familyMembers.length === 0) && (
                  <div className="text-center py-4 text-muted-foreground">
                    <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No other family members yet</p>
                    <p className="text-xs">Use the invite button to add family members</p>
                  </div>
                )}
              </div>
            
              {/* Invite Family Member Section */}
              <div className="bg-muted/50 rounded-lg p-3 mt-3">
                <div className="flex items-start gap-3">
                  <Share className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">Invite Family Members</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Share the app with your coparent, teens, or other family members to coordinate together.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleInviteFamilyMember}
                      className="mt-2 w-full"
                    >
                      <Share className="h-3 w-3 mr-2" />
                      Share Who's Night
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              {isParent && (
                <Button
                  variant="outline"
                  onClick={() => setShowTeenSettings(true)}
                  className="w-full justify-start"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Teen Permissions
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={logout}
                className="w-full justify-start text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Teen Settings Modal */}
      {/* Teen Settings Modal - only show if there are teens in the family */}
      {isParent && familyMembers?.some(member => member.role === "teen") && (
        <TeenPermissionsModal
          open={showTeenSettings}
          onOpenChange={setShowTeenSettings}
          teenUserId={familyMembers.find(member => member.role === "teen")?.id || 0}
        />
      )}
    </>
  );
}