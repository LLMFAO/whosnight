import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import DetailedNotificationsModal from "./detailed-notifications-modal";

interface NotificationBadgeProps {
  pendingCount: number;
  pendingItems: any;
  onAcceptAll: () => void;
}

export default function NotificationBadge({ 
  pendingCount, 
  pendingItems, 
  onAcceptAll 
}: NotificationBadgeProps) {
  const [showDetailedNotifications, setShowDetailedNotifications] = useState(false);

  if (pendingCount === 0) {
    return null;
  }

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetailedNotifications(true)}
          className="relative p-2"
        >
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </Button>
      </div>

      <DetailedNotificationsModal
        open={showDetailedNotifications}
        onOpenChange={setShowDetailedNotifications}
        pendingItems={pendingItems || { assignments: [], events: [], tasks: [], expenses: [] }}
      />
    </>
  );
}