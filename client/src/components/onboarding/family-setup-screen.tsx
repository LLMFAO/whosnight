import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Users, Plus, AlertCircle, Clock, Shield } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { supabase } from "@/lib/supabaseClient";

interface FamilySetupScreenProps {
  onNext: () => void;
  onBack: () => void;
}

interface InvitationDetails {
  invitation_code: string;
  expires_at: string;
}

export function FamilySetupScreen({ onNext, onBack }: FamilySetupScreenProps) {
  const [mode, setMode] = useState<"select" | "create" | "join">("select");
  const [familyName, setFamilyName] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [invitationCodeInput, setInvitationCodeInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [familyCreatedOrJoined, setFamilyCreatedOrJoined] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createFamilyMutation = useMutation({
    mutationFn: async (data: { familyName?: string }) => {
      console.log('=== CREATE FAMILY DEBUG START ===');
      console.log('Creating family with name:', data.familyName);
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      console.log('✅ User authenticated:', user.id);

      // Create family in Supabase
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name: data.familyName || null,
          code: 'LEGACY-' + Math.random().toString(36).substring(2, 8).toUpperCase(), // Legacy code for backward compatibility
        })
        .select()
        .single();

      if (familyError) {
        console.error('❌ Family creation failed:', familyError);
        throw new Error(`Failed to create family: ${familyError.message}`);
      }

      console.log('✅ Family created:', family.id);

      // Update user's family_id
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          username: user.username || user.email?.split('@')[0] || 'user',
          name: user.name || 'User',
          role: user.role || 'dad',
          family_id: family.id
        });

      if (userError) {
        console.error('❌ User update failed:', userError);
        throw new Error(`Failed to join family: ${userError.message}`);
      }

      console.log('✅ User joined family successfully');

      // Create a secure invitation for sharing
      console.log('🔐 Creating secure invitation...');
      const { data: invitationData, error: invitationError } = await supabase
        .rpc('create_family_invitation', {
          p_family_id: family.id,
          p_max_uses: 10, // Allow 10 family members to join
          p_expires_hours: 168 // 7 days
        });

      if (invitationError) {
        console.warn('⚠️ Failed to create invitation:', invitationError);
        // Don't fail the whole process if invitation creation fails
        return { familyCode: 'LEGACY-CODE', familyId: family.id };
      }

      const invitation = invitationData[0];
      console.log('✅ Secure invitation created:', invitation.invitation_code);
      console.log('=== CREATE FAMILY DEBUG END ===');

      return { 
        familyCode: invitation.invitation_code,
        familyId: family.id,
        expiresAt: invitation.expires_at
      };
    },
    onSuccess: (data) => {
      setInvitationCode(data.familyCode);
      setInvitationDetails({
        invitation_code: data.familyCode,
        expires_at: data.expiresAt
      });
      setFamilyCreatedOrJoined(true);
      setErrorMessage("");
      // Refresh the auth context to get updated user data
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    onError: (error) => {
      console.error('❌ Create family mutation failed:', error);
      setErrorMessage(error.message || "Failed to create family. Please try again.");
    },
  });

  const joinFamilyMutation = useMutation({
    mutationFn: async (data: { invitationCode: string }) => {
      console.log('=== JOIN FAMILY DEBUG START ===');
      console.log('Joining family with invitation code:', data.invitationCode);
      
      if (!user) {
        console.error('❌ No user found in auth context');
        throw new Error("User not authenticated");
      }

      console.log('✅ User authenticated:', user.id);

      // Normalize invitation code (trim whitespace and convert to uppercase)
      const normalizedCode = data.invitationCode.trim().toUpperCase();
      console.log('Normalized invitation code:', normalizedCode);
      
      if (!normalizedCode) {
        console.error('❌ Empty invitation code after normalization');
        throw new Error("Please enter an invitation code");
      }

      // Get user's IP address for logging (optional)
      let ipAddress = null;
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch (e) {
        console.warn('Could not get IP address:', e);
      }

      console.log('🔐 Using secure invitation system...');
      
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
        throw new Error(`Failed to use invitation: ${invitationError.message}`);
      }

      const invitationResult = result[0];
      
      if (!invitationResult.success) {
        console.error('❌ Invitation usage failed:', invitationResult.message);
        throw new Error(invitationResult.message);
      }

      console.log('✅ Successfully joined family:', invitationResult.family_id);
      console.log('=== JOIN FAMILY DEBUG END ===');

      return { success: true, familyId: invitationResult.family_id };
    },
    onSuccess: () => {
      setFamilyCreatedOrJoined(true);
      setErrorMessage("");
      // Refresh the auth context to get updated user data
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    onError: (error) => {
      console.error('❌ Join family mutation failed:', error);
      setErrorMessage(error.message || "Failed to join family. Please try again.");
    },
  });

  const handleCreateFamily = () => {
    createFamilyMutation.mutate({ familyName: familyName || undefined });
  };

  const handleJoinFamily = () => {
    if (!invitationCodeInput.trim()) {
      setErrorMessage("Please enter an invitation code");
      return;
    }
    joinFamilyMutation.mutate({ invitationCode: invitationCodeInput.trim() });
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(invitationCode);
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

  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  if (mode === "select") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Set Up Your Family</h2>
          <p className="text-lg text-gray-600">
            Choose to create a new family or join an existing one using a secure invitation code.
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
                Start a new family and get a secure invitation code to share with other family members.
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
                Enter a secure invitation code to join an existing family group.
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
            Give your family a name and we'll generate a secure invitation code for others to join.
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
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Family Created Successfully!
              </CardTitle>
              <CardDescription className="text-blue-700">
                Share this secure invitation code with other family members to invite them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-900 mb-2 font-mono tracking-wider">
                  {invitationCode}
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleCopyCode}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Invitation Code
                </Button>
              </div>
              
              {invitationDetails && (
                <div className="bg-blue-100 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-800 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Invitation Details</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    • Expires: {formatExpirationDate(invitationDetails.expires_at)}
                  </p>
                  <p className="text-xs text-blue-700">
                    • Can be used by up to 10 family members
                  </p>
                  <p className="text-xs text-blue-700">
                    • Secure and tracked for your family's safety
                  </p>
                </div>
              )}
              
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
            Enter the secure invitation code provided by a family member to join their group.
          </p>
        </div>

        {!familyCreatedOrJoined ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Enter Invitation Code
              </CardTitle>
              <CardDescription>
                Ask a family member for the secure invitation code to join their group.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invitationCode">Secure Invitation Code</Label>
                <Input
                  id="invitationCode"
                  placeholder="e.g., ABCD-EFGH-IJKL"
                  value={invitationCodeInput}
                  onChange={(e) => setInvitationCodeInput(e.target.value)}
                  className="text-center text-lg tracking-wider font-mono"
                />
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Security Features</span>
                </div>
                <p className="text-xs text-gray-600">
                  • Invitation codes expire automatically for security
                </p>
                <p className="text-xs text-gray-600">
                  • Limited usage to prevent unauthorized access
                </p>
                <p className="text-xs text-gray-600">
                  • All join attempts are logged and monitored
                </p>
              </div>
              
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleJoinFamily}
                disabled={!invitationCodeInput.trim() || joinFamilyMutation.isPending}
                className="w-full"
              >
                {joinFamilyMutation.isPending ? "Joining Family..." : "Join Family"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Successfully Joined Family!
              </CardTitle>
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