import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";

interface RegisterFormProps {
  onSuccess: (user: any) => void;
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [joinExistingFamily, setJoinExistingFamily] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async (userData: { username: string; password: string; name: string; role: string; familyCode?: string }) => {
      // First register the user
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      const result = await response.json();

      // If family code is provided, join the family
      if (userData.familyCode) {
        const joinResponse = await fetch("/api/family/join", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ familyCode: userData.familyCode }),
          credentials: "include",
        });

        if (!joinResponse.ok) {
          const error = await joinResponse.json();
          throw new Error(error.message || "Failed to join family");
        }
      }

      return result;
    },
    onSuccess: (data) => {
      onSuccess(data.user);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return;
    }
    
    registerMutation.mutate({
      username,
      password,
      name,
      role,
      familyCode: joinExistingFamily ? familyCode : undefined
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Sign up for Who's Night? to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {registerMutation.error && (
            <Alert variant="destructive">
              <AlertDescription>
                {registerMutation.error.message}
              </AlertDescription>
            </Alert>
          )}
          
          {password !== confirmPassword && confirmPassword && (
            <Alert variant="destructive">
              <AlertDescription>
                Passwords do not match
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={registerMutation.isPending}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={registerMutation.isPending}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole} disabled={registerMutation.isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mom">Parent (Mom)</SelectItem>
                <SelectItem value="dad">Parent (Dad)</SelectItem>
                <SelectItem value="teen">Teen</SelectItem>
                {joinExistingFamily && (
                  <SelectItem value="caretaker">Caretaker</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={registerMutation.isPending}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={registerMutation.isPending}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="joinFamily"
                checked={joinExistingFamily}
                onChange={(e) => setJoinExistingFamily(e.target.checked)}
                disabled={registerMutation.isPending}
                className="rounded border-gray-300"
              />
              <Label htmlFor="joinFamily" className="text-sm">
                Join an existing family (I have a family code)
              </Label>
            </div>

            {joinExistingFamily && (
              <div className="space-y-2">
                <Label htmlFor="familyCode">Family Code</Label>
                <Input
                  id="familyCode"
                  type="text"
                  placeholder="e.g., ABC-12345"
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value)}
                  required={joinExistingFamily}
                  disabled={registerMutation.isPending}
                  className="text-center text-lg tracking-wider"
                />
                <p className="text-xs text-gray-500">
                  Ask a family member for the family code to join their group.
                </p>
              </div>
            )}
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={registerMutation.isPending || password !== confirmPassword || !role || (joinExistingFamily && !familyCode.trim())}
          >
            {registerMutation.isPending ? "Creating account..." : "Create Account"}
          </Button>
          
          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={onSwitchToLogin}
              disabled={registerMutation.isPending}
            >
              Already have an account? Sign in
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}