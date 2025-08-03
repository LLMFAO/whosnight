import { useState, useEffect } from "react";
import { WelcomeScreen } from "@/components/onboarding/welcome-screen";
import { FamilySetupScreen } from "@/components/onboarding/family-setup-screen";
import { RoleSelection } from "@/components/onboarding/role-selection";
import { CompletionScreen } from "@/components/onboarding/completion-screen";
import { useLocation } from "wouter";
import { useAuth } from "@/components/auth/auth-provider";

export function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const steps = [
    { component: WelcomeScreen, title: "Welcome" },
    { component: FamilySetupScreen, title: "Family Setup" },
    { component: RoleSelection, title: "Role Selection" },
    { component: CompletionScreen, title: "Complete" }
  ];

  // Check if user has already completed onboarding
  useEffect(() => {
    if (!user) return;

    // Check if onboarding was already completed via localStorage
    const onboardingCompleted = localStorage.getItem("onboarding-completed") === "true";
    
    // Check if user has joined a family (familyId is a number and > 0)
    const hasJoinedFamily = user && typeof user.familyId === 'number' && user.familyId > 0;
    
    // Also check the family_id field (snake_case from database)
    const hasJoinedFamilyAlt = user && typeof user.family_id === 'number' && user.family_id > 0;
    
    console.log('Onboarding check:', { 
      user, 
      onboardingCompleted, 
      hasJoinedFamily, 
      hasJoinedFamilyAlt,
      familyId: user.familyId,
      family_id: user.family_id,
      familyIdType: typeof user.familyId,
      family_idType: typeof user.family_id
    });
    
    // Skip onboarding if:
    // 1. User has joined a family, OR
    // 2. Onboarding was already completed (prevents infinite loops)
    if (hasJoinedFamily || hasJoinedFamilyAlt || onboardingCompleted) {
      console.log('Skipping onboarding - redirecting to main app');
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    console.log('Onboarding completed - setting localStorage flag and redirecting');
    // Mark onboarding as complete to prevent infinite loops
    localStorage.setItem("onboarding-completed", "true");
    setLocation("/");
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    index <= currentStep ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`ml-4 w-16 h-0.5 ${
                      index < currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current step content */}
        <CurrentStepComponent
          onNext={handleNext}
          onBack={handleBack}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}