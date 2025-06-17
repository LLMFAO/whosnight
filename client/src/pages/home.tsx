import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CalendarView from "@/components/calendar-view";
import TodoView from "@/components/todo-view";
import ExpensesView from "@/components/expenses-view";
import BottomNavigation from "@/components/bottom-navigation";
import ShareUpdatesModal from "@/components/share-updates-modal";
import { getPendingItemsCount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

type ViewType = "calendar" | "todo" | "expenses";

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>("calendar");
  const [showShareModal, setShowShareModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: pendingItems } = useQuery({
    queryKey: ["/api/pending"],
    refetchInterval: 5000, // Check for updates every 5 seconds
  });

  const pendingCount = getPendingItemsCount(pendingItems);
  const showUpdatesBanner = pendingCount > 0;

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
        // Invalidate all relevant queries
        queryClient.invalidateQueries({ queryKey: ["/api/pending"] });
        queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      }
    } catch (error) {
      console.error("Failed to accept all items:", error);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      {/* Updates Banner */}
      {showUpdatesBanner && (
        <div className="bg-orange-50 border-b border-orange-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-700">
                You have {pendingCount} updates to review
              </span>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleAcceptAll}
                className="text-orange-700 border-orange-300 hover:bg-orange-100"
              >
                Accept All
              </Button>
              <Button
                size="sm"
                onClick={() => setShowShareModal(true)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Share Updates
              </Button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
