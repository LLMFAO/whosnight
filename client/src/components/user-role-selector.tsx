import { Button } from "@/components/ui/button";

interface UserRoleSelectorProps {
  currentRole: "mom" | "dad" | "teen";
  onRoleChange: (role: "mom" | "dad" | "teen") => void;
}

export default function UserRoleSelector({ currentRole, onRoleChange }: UserRoleSelectorProps) {
  const handleRoleChange = (newRole: "mom" | "dad" | "teen") => {
    // Update URL parameter to maintain user context
    const url = new URL(window.location.href);
    url.searchParams.set('user', newRole);
    window.history.replaceState({}, '', url);
    
    onRoleChange(newRole);
    // Reload the page to switch user context
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <Button
        variant={currentRole === "mom" ? "default" : "ghost"}
        size="sm"
        onClick={() => handleRoleChange("mom")}
        className={`h-8 px-3 text-xs font-mono ${
          currentRole === "mom" 
            ? "bg-red-500 hover:bg-red-600 text-white" 
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        MOM
      </Button>
      <Button
        variant={currentRole === "dad" ? "default" : "ghost"}
        size="sm"
        onClick={() => handleRoleChange("dad")}
        className={`h-8 px-3 text-xs font-mono ${
          currentRole === "dad" 
            ? "bg-blue-500 hover:bg-blue-600 text-white" 
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        DAD
      </Button>
      <Button
        variant={currentRole === "teen" ? "default" : "ghost"}
        size="sm"
        onClick={() => handleRoleChange("teen")}
        className={`h-8 px-3 text-xs font-mono ${
          currentRole === "teen" 
            ? "bg-green-500 hover:bg-green-600 text-white" 
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        TEEN
      </Button>
    </div>
  );
}