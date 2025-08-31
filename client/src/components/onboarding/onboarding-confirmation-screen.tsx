import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Copy, Users, Plus, Shield, Clock } from "lucide-react";
import { User } from "@/components/auth/auth-provider";

interface OnboardingConfirmationScreenProps {
  user: User;
  onComplete: () => void;
}

export function OnboardingConfirmationScreen({ user, onComplete }: OnboardingConfirmationScreenProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (user.newInvitationCode) {
      try {
        await navigator.clipboard.writeText(user.newInvitationCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy code:", err);
      }
    }
  };

  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  if (user.familySetupMode === 'create') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Family Created Successfully!</h2>
          <p className="text-lg text-gray-600">
            Your family{user.familyName ? ` "${user.familyName}"` : ''} has been created. Share the invitation code below to get started.
          </p>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Your Secure Invitation Code
            </CardTitle>
            <CardDescription className="text-blue-700">
              Share this code with other family members to invite them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-900 mb-2 font-mono tracking-wider">
                {user.newInvitationCode}
              </div>
              <Button 
                variant="outline" 
                onClick={handleCopyCode}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? "Copied!" : "Copy Invitation Code"}
              </Button>
            </div>
            
            {user.newInvitationExpiresAt && (
              <div className="bg-blue-100 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-800 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Invitation Details</span>
                </div>
                <p className="text-xs text-blue-700">
                  • Expires: {formatExpirationDate(user.newInvitationExpiresAt)}
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

        <div className="text-center">
          <Button onClick={onComplete} size="lg" className="px-8">
            Start Using Who's Night?
          </Button>
        </div>
      </div>
    );
  }

  if (user.familySetupMode === 'join') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Successfully Joined Family!</h2>
          <p className="text-lg text-gray-600">
            You're now part of the family group and can access all family activities.
          </p>
        </div>

        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              You're All Set!
            </CardTitle>
            <CardDescription className="text-green-700">
              Your account is now connected to your family. You can start coordinating right away.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="text-center">
          <Button onClick={onComplete} size="lg" className="px-8">
            Start Using Who's Night?
          </Button>
        </div>
      </div>
    );
  }

  // Fallback for unexpected state, though ideally this should not be reached
  return (
    <div className="max-w-2xl mx-auto space-y-6 text-center">
      <h2 className="text-2xl font-bold text-gray-900">Welcome to Who's Night?!</h2>
      <p className="text-lg text-gray-600">Your account is ready. Click below to get started.</p>
      <Button onClick={onComplete} size="lg" className="px-8">
        Start Using Who's Night?
      </Button>
    </div>
  );
}