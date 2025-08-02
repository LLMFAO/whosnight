import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import CalendarView from "@/components/calendar-view";
import TodoView from "@/components/todo-view";
import BottomNavigation from "@/components/bottom-navigation";
import ShareUpdatesModal from "@/components/share-updates-modal";
import DetailedNotificationsModal from "@/components/detailed-notifications-modal";
import NotificationBadge from "@/components/notification-badge";
import UserRequestHistoryModal from "@/components/user-request-history-modal";
import ProfileModal from "@/components/profile-modal";
import { AdBanner } from "@/components/ads/ad-banner";
import { getPendingItemsCount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Bell, History, Settings, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { BannerAdPosition } from "@capacitor-community/admob";

type ViewType = "calendar" | "todo";

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>("calendar");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDetailedNotifications, setShowDetailedNotifications] = useState(false);
  const [showRequestHistory, setShowRequestHistory] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  // Get user's role from auth context
  const currentUser = user?.role as "mom" | "dad" | "teen" || "mom";

  const { data: pendingItems, error: pendingError } = useQuery({
    queryKey: ["pending_items", currentUser, user?.family_id],
    queryFn: async () => {
      if (!user?.family_id) return { assignments: [], events: [], tasks: [], expenses: [] };

      // Get all pending items for the family
      const [assignmentsResult, eventsResult, tasksResult, expensesResult] = await Promise.all([
        supabase
          .from("calendar_assignments")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase
          .from("events")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase
          .from("tasks")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase
          .from("expenses")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
      ]);

      if (assignmentsResult.error) throw assignmentsResult.error;
      if (eventsResult.error) throw eventsResult.error;
      if (tasksResult.error) throw tasksResult.error;
      if (expensesResult.error) throw expensesResult.error;

      return {
        assignments: assignmentsResult.data || [],
        events: eventsResult.data || [],
        tasks: tasksResult.data || [],
        expenses: expensesResult.data || []
      };
    },
    refetchInterval: 5000, // Check for updates every 5 seconds
  });

  const pendingCount = getPendingItemsCount(pendingItems);
  const showNotificationBadge = currentUser !== "teen";

  const handleAcceptAll = async () => {
    try {
      await Promise.all([
        supabase.from("calendar_assignments").update({ status: "confirmed" })
          .eq("created_by", user?.id).eq("status", "pending"),
        supabase.from("events").update({ status: "confirmed" })
          .eq("created_by", user?.id).eq("status", "pending"),
        supabase.from("tasks").update({ status: "confirmed" })
          .eq("created_by", user?.id).eq("status", "pending"),
        supabase.from("expenses").update({ status: "confirmed" })
          .eq("created_by", user?.id).eq("status", "pending"),
      ]);
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["pending_items", currentUser, user?.family_id] });
      queryClient.invalidateQueries({ queryKey: ["calendar_assignments"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    } catch (error) {
      console.error("Failed to accept all items:", error);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative">
      {/* Clean Header */}
      <div className="flex items-center justify-between p-4 bg-card border-b border-border">
        <h1 className="text-lg font-mono font-bold tracking-tight">Who's Night?</h1>
        
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="h-8 w-8 p-0"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

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

          {/* Profile Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProfileModal(true)}
            className="h-8 w-8 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-20">
        {currentView === "calendar" && <CalendarView />}
        {currentView === "todo" && <TodoView />}
        
        {/* Ad Banner - positioned above bottom navigation */}
        <div className="fixed bottom-16 left-0 right-0 z-10">
          <AdBanner position={BannerAdPosition.BOTTOM_CENTER} className="mx-4 mb-2" />
        </div>
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

      {/* Profile Modal */}
      <ProfileModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
      />
    </div>
  );
}
