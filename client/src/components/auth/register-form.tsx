import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Shield } from "lucide-react";
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
  const [invitationCode, setInvitationCode] = useState("");
  const [joinExistingFamily, setJoinExistingFamily] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async (userData: { 
      email: string; 
      password: string; 
      name: string; 
      username: string;
      role: string; 
      invitationCode?: string 
    }) => {
      console.log('=== REGISTER WITH INVITATION DEBUG START ===');
      console.log('Registration data:', { ...userData, password: '[REDACTED]' });

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
        console.error('❌ Auth signup failed:', authError);
        // Handle specific Supabase Auth errors
        if (authError.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        throw new Error(authError.message);
      }

      if (!authData.user) {
        console.error('❌ No user returned from auth signup');
        throw new Error("Registration failed");
      }

      console.log('✅ User authenticated:', authData.user.id);

      let familyId = null;
      
      // If invitation code is provided, use the secure invitation system
      if (userData.invitationCode) {
        console.log('🔐 Using secure invitation system...');
        
        // Normalize invitation code
        const normalizedCode = userData.invitationCode.trim().toUpperCase();
        console.log('Normalized invitation code:', normalizedCode);

        // Get user's IP address for logging (optional)
        let ipAddress = null;
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          ipAddress = ipData.ip;
        } catch (e) {
          console.warn('Could not get IP address:', e);
        }

        // Use the secure invitation function
        const { data: result, error: invitationError } = await supabase
          .rpc('use_family_invitation', {
            p_invitation_code: normalizedCode,
            p_ip_address: ipAddress,
            p_user_agent: navigator.userAgent
          });

        console.log('Invitation usage result:', result, invitationError);

        if (invitationError) {
          console.error('❌ Invitation function failed:', invitationError);
          throw new Error(`Invalid invitation code: ${invitationError.message}`);
        }

        const invitationResult = result[0];
        
        if (!invitationResult.success) {
          console.error('❌ Invitation usage failed:', invitationResult.message);
          throw new Error(invitationResult.message);
        }

        familyId = invitationResult.family_id;
        console.log('✅ Successfully used invitation, family_id:', familyId);
      } else {
        console.log('ℹ️ No invitation code provided, user will set up family later');
        
        // Insert user profile data into the users table without family_id
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: userData.email,
            username: userData.username,
            name: userData.name,
            role: userData.role,
            family_id: null // Will be set during onboarding
          });

        if (profileError) {
          console.error('❌ Profile creation failed:', profileError);
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

        console.log('✅ User profile created without family');
      }

      console.log('=== REGISTER WITH INVITATION DEBUG END ===');

      return {
        id: authData.user.id,
        email: authData.user.email!,
        username: userData.username,
        name: userData.name,
        role: userData.role,
        familyId: familyId // Return familyId so App.tsx knows if user has joined a family
      };
    },
    onSuccess: (userData) => {
      console.log('✅ Registration successful:', userData);
      onSuccess(userData);
    },
    onError: (error) => {
      console.error('❌ Registration failed:', error);
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
      invitationCode: joinExistingFamily ? invitationCode : undefined
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
                Join an existing family (I have a secure invitation code)
              </Label>
            </div>

            {joinExistingFamily && (
              <div className="space-y-2">
                <Label htmlFor="invitationCode" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Secure Invitation Code
                </Label>
                <Input
                  id="invitationCode"
                  type="text"
                  placeholder="e.g., ABCD-EFGH-IJKL"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  required={joinExistingFamily}
                  disabled={registerMutation.isPending}
                  className="text-center text-lg tracking-wider font-mono"
                />
                <div className="bg-gray-50 p-2 rounded text-xs text-gray-600">
                  <p className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Secure invitation codes expire automatically and have usage limits for your family's safety.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={registerMutation.isPending || password !== confirmPassword || !role || (joinExistingFamily && !invitationCode.trim())}
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