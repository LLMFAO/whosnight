import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CalendarView from "@/components/calendar-view";
import TodoView from "@/components/todo-view";
import ExpensesView from "@/components/expenses-view";
import BottomNavigation from "@/components/bottom-navigation";
import ShareUpdatesModal from "@/components/share-updates-modal";
import DetailedNotificationsModal from "@/components/detailed-notifications-modal";
import UserRoleSelector from "@/components/user-role-selector";
import NotificationBadge from "@/components/notification-badge";
import { getPendingItemsCount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Bell, User } from "lucide-react";

type ViewType = "calendar" | "todo" | "expenses";

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>("calendar");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDetailedNotifications, setShowDetailedNotifications] = useState(false);
  const [currentUser, setCurrentUser] = useState<"mom" | "dad" | "teen">(() => {
    // Initialize based on URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user') as "mom" | "dad" | "teen";
    return userParam && ['mom', 'dad', 'teen'].includes(userParam) ? userParam : "mom";
  });
  const queryClient = useQueryClient();

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
          itemTypes: ["assignments", "events", "tasks", "expenses"]
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
    // Update URL parameter to maintain user context
    const url = new URL(window.location.href);
    url.searchParams.set('user', user);
    window.history.replaceState({}, '', url);
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
        
        {showNotificationBadge && (
          <NotificationBadge
            pendingCount={pendingCount}
            pendingItems={pendingItems}
            onAcceptAll={handleAcceptAll}
          />
        )}
      </div>





      {/* Main Content */}
      <div className="pb-20">
        {currentView === "calendar" && <CalendarView />}
        {currentView === "todo" && <TodoView />}
        {currentView === "expenses" && <ExpensesView />}
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
    </div>
  );
}
