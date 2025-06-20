import { Calendar, CheckSquare, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  currentView: "calendar" | "todo" | "mobile";
  onViewChange: (view: "calendar" | "todo" | "mobile") => void;
}

export default function BottomNavigation({ currentView, onViewChange }: BottomNavigationProps) {
  const navItems = [
    {
      id: "calendar" as const,
      label: "Calendar",
      icon: Calendar,
    },
    {
      id: "todo" as const,
      label: "To-Do",
      icon: CheckSquare,
    },
    {
      id: "mobile" as const,
      label: "Mobile App",
      icon: Smartphone,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "flex flex-col items-center py-2 px-3 touch-target transition-colors",
                  isActive ? "text-blue-600" : "text-gray-400"
                )}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
