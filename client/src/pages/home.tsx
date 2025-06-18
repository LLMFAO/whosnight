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
import TeenPermissionsModal from "@/components/teen-permissions-modal";
import { getPendingItemsCount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Bell, History, Settings } from "lucide-react";

type ViewType = "calendar" | "todo";

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>("calendar");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDetailedNotifications, setShowDetailedNotifications] = useState(false);
  const [showRequestHistory, setShowRequestHistory] = useState(false);
  const [showTeenSettings, setShowTeenSettings] = useState(false);
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

  const isParent = currentUser === "mom" || currentUser === "dad";

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative">
      {/* Modern Header */}
      <div className="flex items-center justify-between p-4 bg-card border-b border-border">
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-mono font-bold tracking-tight">Who's Night?</h1>
          <UserRoleSelector
            currentRole={currentUser}
            onRoleChange={handleUserSwitch}
          />
        </div>
        
        <div className="flex items-center gap-1">
          {/* History */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRequestHistory(true)}
            className="h-8 w-8 p-0"
          >
            <History className="h-4 w-4" />
          </Button>

          {/* Notifications for parents only */}
          {showNotificationBadge && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetailedNotifications(true)}
              className="h-8 w-8 p-0 relative"
            >
              <Bell className="h-4 w-4" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                  {pendingCount}
                </span>
              )}
            </Button>
          )}

          {/* Teen Settings for parents only */}
          {isParent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTeenSettings(true)}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
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

      {/* Teen Settings Modal */}
      <TeenPermissionsModal
        open={showTeenSettings}
        onOpenChange={setShowTeenSettings}
        teenUserId={3}
      />
    </div>
  );
}
