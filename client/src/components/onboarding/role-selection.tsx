import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";

interface RoleSelectionProps {
  onNext: () => void;
  onBack: () => void;
}

export function RoleSelection({ onNext, onBack }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { user } = useAuth();

  const updateRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      // In a real implementation, you would update the user's role in the backend
      // For now, we'll just proceed to the next step
      return { role };
    },
    onSuccess: () => {
      onNext();
    },
  });

  const roles = [
    {
      id: "mom",
      title: "Parent (Mom)",
      description: "Manage family schedules, approve requests, and coordinate household activities.",
      icon: Heart,
      color: "bg-pink-100 text-pink-700",
      features: [
        "Full calendar management",
        "Approve/deny requests",
        "Expense oversight",
        "Teen permission controls"
      ]
    },
    {
      id: "dad",
      title: "Parent (Dad)",
      description: "Share parenting responsibilities, manage tasks, and stay coordinated with your co-parent.",
      icon: Shield,
      color: "bg-blue-100 text-blue-700",
      features: [
        "Full calendar management",
        "Approve/deny requests",
        "Expense oversight",
        "Teen permission controls"
      ]
    },
    {
      id: "teen",
      title: "Teen",
      description: "Stay informed about family plans, request changes, and manage your own responsibilities.",
      icon: Sparkles,
      color: "bg-purple-100 text-purple-700",
      features: [
        "View family calendar",
        "Request schedule changes",
        "Track personal tasks",
        "Limited editing permissions"
      ]
    }
  ];

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
  };

  const handleContinue = () => {
    if (selectedRole) {
      updateRoleMutation.mutate(selectedRole);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Choose Your Role</h2>
        <p className="text-lg text-gray-600">
          Select the role that best describes your position in the family. This helps us customize your experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;
          
          return (
            <Card
              key={role.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? "ring-2 ring-blue-500 shadow-lg" 
                  : "hover:shadow-md"
              }`}
              onClick={() => handleRoleSelect(role.id)}
            >
              <CardHeader className="text-center">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${role.color}`}>
                  <Icon className="w-8 h-8" />
                </div>
                <CardTitle className="flex items-center justify-center gap-2">
                  {role.title}
                  {isSelected && <Badge variant="secondary">Selected</Badge>}
                </CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {role.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={!selectedRole || updateRoleMutation.isPending}
        >
          {updateRoleMutation.isPending ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}