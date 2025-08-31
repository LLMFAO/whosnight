import { useState, useEffect } from "react";
import { OnboardingConfirmationScreen } from "@/components/onboarding/onboarding-confirmation-screen";
import { useLocation } from "wouter";
import { useAuth } from "@/components/auth/auth-provider";

export function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Check if user needs to go through onboarding confirmation
  useEffect(() => {
    if (!user) return;

    // Check if onboarding was already completed via localStorage
    const onboardingCompleted = localStorage.getItem("onboarding-completed") === "true";
    
    // Check if user has family setup data from registration
    const hasFamilySetupData = user && (user.familySetupMode || user.newInvitationCode);

    console.log('Onboarding check:', {
      user,
      onboardingCompleted,
      hasFamilySetupData,
      familySetupMode: (user as any).familySetupMode,
      newInvitationCode: (user as any).newInvitationCode
    });
    
    // Skip onboarding if:
    // 1. Onboarding was already completed, OR
    // 2. User does not have new family setup data from registration (e.g. logged in normally)
    if (onboardingCompleted || !hasFamilySetupData) {
      console.log('Skipping onboarding confirmation - redirecting to main app');
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleComplete = () => {
    console.log('Onboarding confirmation completed - setting localStorage flag and redirecting');
    localStorage.setItem("onboarding-completed", "true");
    setTimeout(() => {
      setLocation("/");
    }, 500);
  };

  if (!user) {
    return <div>Loading...</div>; // Or a more sophisticated loading component
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <OnboardingConfirmationScreen
          user={user}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}