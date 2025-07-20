import { useState } from "react";
import { WelcomeScreen } from "@/components/onboarding/welcome-screen";
import { RoleSelection } from "@/components/onboarding/role-selection";
import { CompletionScreen } from "@/components/onboarding/completion-screen";
import { useLocation } from "wouter";

export function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();

  const steps = [
    { component: WelcomeScreen, title: "Welcome" },
    { component: RoleSelection, title: "Role Selection" },
    { component: CompletionScreen, title: "Complete" }
  ];

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
    // Mark onboarding as complete (in a real app, you'd save this to the backend)
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