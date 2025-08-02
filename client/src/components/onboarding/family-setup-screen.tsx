import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Users, Plus, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { supabase } from "@/lib/supabaseClient";

interface FamilySetupScreenProps {
  onNext: () => void;
  onBack: () => void;
}

export function FamilySetupScreen({ onNext, onBack }: FamilySetupScreenProps) {
  const [mode, setMode] = useState<"select" | "create" | "join">("select");
  const [familyName, setFamilyName] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [familyCodeInput, setFamilyCodeInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [familyCreatedOrJoined, setFamilyCreatedOrJoined] = useState(false);
  const { user } = useAuth();

  const createFamilyMutation = useMutation({
    mutationFn: async (data: { familyName?: string }) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Generate a unique family code
      const familyCode = Math.random().toString(36).substring(2, 8).toUpperCase() + 
                        '-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create family in Supabase
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name: data.familyName || null,
          code: familyCode,
        })
        .select()
        .single();

      if (familyError) {
        throw new Error(`Failed to create family: ${familyError.message}`);
      }

      // Update user's family_id
      const { error: userError } = await supabase
        .from('users')
        .update({ family_id: family.id })
        .eq('id', user.id);

      if (userError) {
        throw new Error(`Failed to join family: ${userError.message}`);
      }

      return { familyCode: family.code };
    },
    onSuccess: (data) => {
      setFamilyCode(data.familyCode);
      setFamilyCreatedOrJoined(true);
      setErrorMessage("");
    },
    onError: (error) => {
      setErrorMessage(error.message || "Failed to create family. Please try again.");
    },
  });

  const joinFamilyMutation = useMutation({
    mutationFn: async (data: { familyCode: string }) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Normalize family code (trim whitespace and convert to uppercase)
      const normalizedFamilyCode = data.familyCode.trim().toUpperCase();
      
      if (!normalizedFamilyCode) {
        throw new Error("Please enter a family code");
      }

      // Find family by code
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('id')
        .eq('code', normalizedFamilyCode)
        .single();

      if (familyError || !family) {
        throw new Error("Invalid family code. Please check and try again.");
      }

      // Check if user profile exists, create if it doesn't
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id, family_id')
        .eq('id', user.id)
        .single();

      if (userCheckError && userCheckError.code !== 'PGRST116') {
        throw new Error(`Failed to check user profile: ${userCheckError.message}`);
      }

      // If user doesn't exist, create profile first
      if (!existingUser) {
        const { error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            role: user.role,
            family_id: family.id
          });

        if (createError) {
          throw new Error(`Failed to create user profile: ${createError.message}`);
        }
      } else {
        // Update existing user's family_id
        const { error: userError } = await supabase
          .from('users')
          .update({ family_id: family.id })
          .eq('id', user.id);

        if (userError) {
          throw new Error(`Failed to join family: ${userError.message}`);
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      setFamilyCreatedOrJoined(true);
      setErrorMessage("");
    },
    onError: (error) => {
      setErrorMessage(error.message || "Failed to join family. Please try again.");
    },
  });

  const handleCreateFamily = () => {
    createFamilyMutation.mutate({ familyName: familyName || undefined });
  };

  const handleJoinFamily = () => {
    if (!familyCodeInput.trim()) {
      setErrorMessage("Please enter a family code");
      return;
    }
    joinFamilyMutation.mutate({ familyCode: familyCodeInput.trim() });
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(familyCode);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleContinue = () => {
    if (familyCreatedOrJoined) {
      onNext();
    }
  };

  if (mode === "select") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Set Up Your Family</h2>
          <p className="text-lg text-gray-600">
            Choose to create a new family or join an existing one using a family code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:ring-2 hover:ring-blue-500"
            onClick={() => setMode("create")}
          >
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle>Create New Family</CardTitle>
              <CardDescription>
                Start a new family and get a unique code to share with other family members.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:ring-2 hover:ring-green-500"
            onClick={() => setMode("join")}
          >
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle>Join Existing Family</CardTitle>
              <CardDescription>
                Enter a family code to join an existing family group.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button disabled>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Create Your Family</h2>
          <p className="text-lg text-gray-600">
            Give your family a name and we'll generate a unique code for others to join.
          </p>
        </div>

        {!familyCreatedOrJoined ? (
          <Card>
            <CardHeader>
              <CardTitle>Family Details</CardTitle>
              <CardDescription>
                The family name is optional but helps identify your family group.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="familyName">Family Name (Optional)</Label>
                <Input
                  id="familyName"
                  placeholder="e.g., The Smith Family"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                />
              </div>
              
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleCreateFamily}
                disabled={createFamilyMutation.isPending}
                className="w-full"
              >
                {createFamilyMutation.isPending ? "Creating Family..." : "Create Family"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Family Created Successfully!</CardTitle>
              <CardDescription className="text-blue-700">
                Share this code with other family members to invite them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-900 mb-2">{familyCode}</div>
                <Button 
                  variant="outline" 
                  onClick={handleCopyCode}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </Button>
              </div>
              <p className="text-sm text-blue-600 text-center">
                Keep this code safe! Family members will need it to join your family group.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setMode("select")}>
            Back
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={!familyCreatedOrJoined}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Join a Family</h2>
          <p className="text-lg text-gray-600">
            Enter the family code provided by a family member to join their group.
          </p>
        </div>

        {!familyCreatedOrJoined ? (
          <Card>
            <CardHeader>
              <CardTitle>Enter Family Code</CardTitle>
              <CardDescription>
                Ask a family member for the unique family code to join their group.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="familyCode">Family Code</Label>
                <Input
                  id="familyCode"
                  placeholder="e.g., ABC123-XYZ789"
                  value={familyCodeInput}
                  onChange={(e) => setFamilyCodeInput(e.target.value)}
                  className="text-center text-lg tracking-wider"
                />
              </div>
              
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleJoinFamily}
                disabled={!familyCodeInput.trim() || joinFamilyMutation.isPending}
                className="w-full"
              >
                {joinFamilyMutation.isPending ? "Joining Family..." : "Join Family"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-900">Successfully Joined Family!</CardTitle>
              <CardDescription className="text-green-700">
                You're now part of the family group and can access all family activities.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setMode("select")}>
            Back
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={!familyCreatedOrJoined}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return null;
}