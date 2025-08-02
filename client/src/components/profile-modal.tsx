import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/auth-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Users, LogOut, Settings } from "lucide-react";
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
    queryKey: ["family", user?.familyId],
    queryFn: async () => {
      if (!user?.familyId) return null;
      
      const { data, error } = await supabase
        .from("families")
        .select("code, name")
        .eq("id", user.familyId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.familyId && open,
  });

  // Fetch family members
  const { data: familyMembers } = useQuery({
    queryKey: ["family-members", user?.familyId],
    queryFn: async () => {
      if (!user?.familyId) return [];
      
      const { data, error } = await supabase
        .from("users")
        .select("id, name, role, username")
        .eq("family_id", user.familyId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.familyId && open,
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

  const isParent = user?.role === "mom" || user?.role === "dad";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md mx-4">
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
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Family Members
              </h3>
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
      <TeenPermissionsModal
        open={showTeenSettings}
        onOpenChange={setShowTeenSettings}
        teenUserId={3} // This should be dynamic based on actual teen user
      />
    </>
  );
}