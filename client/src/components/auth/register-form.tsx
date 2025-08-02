import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

interface RegisterFormProps {
  onSuccess: (user: any) => void;
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [joinExistingFamily, setJoinExistingFamily] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async (userData: { 
      email: string; 
      password: string; 
      name: string; 
      username: string;
      role: string; 
      familyCode?: string 
    }) => {
      // First, sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            username: userData.username,
            role: userData.role,
          }
        }
      });

      if (authError) {
        // Handle specific Supabase Auth errors
        if (authError.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Registration failed");
      }

      // Check if user profile already exists (in case of duplicate registration attempts)
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (existingUser) {
        // User profile already exists, just return the user data
        return {
          id: authData.user.id,
          email: authData.user.email!,
          username: userData.username,
          name: userData.name,
          role: userData.role,
        };
      }

      // Insert user profile data into the users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          username: userData.username,
          name: userData.name,
          role: userData.role,
        });

      if (profileError) {
        // Handle duplicate key errors with user-friendly messages
        if (profileError.code === '23505') { // PostgreSQL unique constraint violation
          if (profileError.message.includes('users_new_pkey') || profileError.message.includes('users_pkey')) {
            throw new Error('An account with this email already exists. Please sign in instead.');
          }
          if (profileError.message.includes('username')) {
            throw new Error('This username is already taken. Please choose a different username.');
          }
          if (profileError.message.includes('email')) {
            throw new Error('An account with this email already exists. Please sign in instead.');
          }
        }
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      // If family code is provided, join the family using the Edge Function
      if (userData.familyCode) {
        const { data: joinData, error: joinError } = await supabase.functions.invoke('join_family', {
          body: { familyCode: userData.familyCode }
        });

        if (joinError) {
          throw new Error(`Failed to join family: ${joinError.message}`);
        }
      }

      return {
        id: authData.user.id,
        email: authData.user.email!,
        username: userData.username,
        name: userData.name,
        role: userData.role,
      };
    },
    onSuccess: (userData) => {
      onSuccess(userData);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return;
    }
    
    registerMutation.mutate({
      email,
      password,
      name,
      username,
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
              autoComplete="name"
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
              autoComplete="username"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={registerMutation.isPending}
              autoComplete="email"
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
              autoComplete="new-password"
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
              autoComplete="new-password"
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