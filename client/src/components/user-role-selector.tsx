import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings } from "lucide-react";
import TeenPermissionsModal from "./teen-permissions-modal";
import NotificationBadge from "./notification-badge";

interface UserRoleSelectorProps {
  currentRole: "mom" | "dad" | "teen";
  onRoleChange: (role: "mom" | "dad" | "teen") => void;
}

export default function UserRoleSelector({ currentRole, onRoleChange }: UserRoleSelectorProps) {
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const handleRoleChange = (newRole: string) => {
    const validRole = newRole as "mom" | "dad" | "teen";
    // Update URL parameter to maintain user context
    const url = new URL(window.location.href);
    url.searchParams.set('user', newRole);
    window.history.replaceState({}, '', url);
    
    onRoleChange(validRole);
    // Reload the page to switch user context
    window.location.reload();
  };

  const isParent = currentRole === "mom" || currentRole === "dad";

  return (
    <div className="flex items-center gap-2 p-4 bg-background border-b">
      <div className="flex items-center gap-2 flex-1">
        <span className="text-sm font-medium">View as:</span>
        <Select value={currentRole} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mom">Mom</SelectItem>
            <SelectItem value="dad">Dad</SelectItem>
            <SelectItem value="teen">Teen</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {isParent && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPermissionsModal(true)}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          Teen Settings
        </Button>
      )}

      <TeenPermissionsModal
        open={showPermissionsModal}
        onOpenChange={setShowPermissionsModal}
        teenUserId={3} // Teen user ID from the database
      />
    </div>
  );
}