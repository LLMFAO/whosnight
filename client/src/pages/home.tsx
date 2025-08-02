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
import TeenPermissionsModal from "@/components/teen-permissions-modal";
import { AdBanner } from "@/components/ads/ad-banner";
import { getPendingItemsCount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Bell, History, Settings, Moon, Sun, LogOut, Copy, Users } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { BannerAdPosition } from "@capacitor-community/admob";
import { useToast } from "@/hooks/use-toast";

type ViewType = "calendar" | "todo";

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>("calendar");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDetailedNotifications, setShowDetailedNotifications] = useState(false);
  const [showRequestHistory, setShowRequestHistory] = useState(false);
  const [showTeenSettings, setShowTeenSettings] = useState(false);
  const [showFamilyCode, setShowFamilyCode] = useState(false);
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Get user's role from auth context
  const currentUser = user?.role as "mom" | "dad" | "teen" || "mom";

  // Fetch family information to get the family code
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
    enabled: !!user?.familyId,
  });

  const { data: pendingItems, error: pendingError } = useQuery({
    queryKey: ["get_pending_items", currentUser],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{
        assignments: any[];
        events: any[];
        tasks: any[];
        expenses: any[];
      }>("get_pending_items", { search: { user: currentUser } });
      if (error) throw error;
      return data;
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
      queryClient.invalidateQueries({ queryKey: ["get_pending_items", currentUser] });
      queryClient.invalidateQueries({ queryKey: ["calendar_assignments"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    } catch (error) {
      console.error("Failed to accept all items:", error);
    }
  };

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

  const isParent = currentUser === "mom" || currentUser === "dad";

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative">
      {/* Modern Header */}
      <div className="flex items-center justify-between p-4 bg-card border-b border-border">
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-mono font-bold tracking-tight">Who's Night?</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Logged in as: <span className="font-medium capitalize">{user?.name || currentUser}</span>
            </span>
            {familyData?.code && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyFamilyCode}
                className="h-6 px-2 text-xs"
              >
                <Users className="h-3 w-3 mr-1" />
                {familyData.code}
                <Copy className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
        
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

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="h-8 w-8 p-0"
          >
            <LogOut className="h-4 w-4" />
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

      {/* Teen Settings Modal */}
      <TeenPermissionsModal
        open={showTeenSettings}
        onOpenChange={setShowTeenSettings}
        teenUserId={3}
      />
    </div>
  );
}
