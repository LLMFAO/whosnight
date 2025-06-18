import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CalendarView from "@/components/calendar-view";
import TodoView from "@/components/todo-view";

import BottomNavigation from "@/components/bottom-navigation";
import ShareUpdatesModal from "@/components/share-updates-modal";
import DetailedNotificationsModal from "@/components/detailed-notifications-modal";
import UserRoleSelector from "@/components/user-role-selector";
import NotificationBadge from "@/components/notification-badge";
import UserRequestHistoryModal from "@/components/user-request-history-modal";
import { getPendingItemsCount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Bell, User, History } from "lucide-react";

type ViewType = "calendar" | "todo";

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>("calendar");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDetailedNotifications, setShowDetailedNotifications] = useState(false);
  const [showRequestHistory, setShowRequestHistory] = useState(false);
  const [currentUser, setCurrentUser] = useState<"mom" | "dad" | "teen">(() => {
    // Initialize based on URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user') as "mom" | "dad" | "teen";
    return userParam && ['mom', 'dad', 'teen'].includes(userParam) ? userParam : "mom";
  });
  const queryClient = useQueryClient();

  // Sync localStorage on initial load and user changes
  useEffect(() => {
    localStorage.setItem('currentUser', currentUser);
  }, [currentUser]);

  const { data: pendingItems } = useQuery({
    queryKey: ["/api/pending", currentUser],
    queryFn: () => fetch(`/api/pending?user=${currentUser}`).then(res => res.json()),
    refetchInterval: 5000, // Check for updates every 5 seconds
  });

  const pendingCount = getPendingItemsCount(pendingItems);
  const showNotificationBadge = currentUser !== "teen";

  const handleAcceptAll = async () => {
    try {
      const response = await fetch("/api/accept-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          itemTypes: ["assignments", "events", "tasks"]
        }),
      });

      if (response.ok) {
        // Invalidate all relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/pending"] });
        queryClient.invalidateQueries({ queryKey: ["/api/calendar/assignments"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      }
    } catch (error) {
      console.error("Failed to accept all items:", error);
    }
  };

  const handleUserSwitch = (user: "mom" | "dad" | "teen") => {
    setCurrentUser(user);
    // Update both URL parameter and localStorage
    const url = new URL(window.location.href);
    url.searchParams.set('user', user);
    window.history.replaceState({}, '', url);
    localStorage.setItem('currentUser', user);
    // Clear cache to refetch data for new user
    queryClient.clear();
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      {/* User Role Selector with Notification Badge */}
      <div className="flex items-center justify-between p-4 bg-background border-b">
        <UserRoleSelector
          currentRole={currentUser}
          onRoleChange={handleUserSwitch}
        />
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRequestHistory(true)}
            className="p-2"
          >
            <History className="h-4 w-4" />
          </Button>
          
          {showNotificationBadge && (
            <NotificationBadge
              pendingCount={pendingCount}
              pendingItems={pendingItems}
              onAcceptAll={handleAcceptAll}
            />
          )}
        </div>
      </div>





      {/* Main Content */}
      <div className="pb-20">
        {currentView === "calendar" && <CalendarView />}
        {currentView === "todo" && <TodoView />}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation currentView={currentView} onViewChange={setCurrentView} />

      {/* Share Updates Modal */}
      <ShareUpdatesModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        pendingCount={pendingCount}
        pendingItems={pendingItems}
      />

      {/* Detailed Notifications Modal */}
      <DetailedNotificationsModal
        open={showDetailedNotifications}
        onOpenChange={setShowDetailedNotifications}
        pendingItems={pendingItems || { assignments: [], events: [], tasks: [], expenses: [] }}
      />

      <UserRequestHistoryModal
        open={showRequestHistory}
        onOpenChange={setShowRequestHistory}
      />
    </div>
  );
}
