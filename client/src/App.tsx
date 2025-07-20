import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/components/auth/auth-provider";
import Home from "@/pages/home";
import { AuthPage } from "@/pages/auth";
import { OnboardingPage } from "@/pages/onboarding";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, ...props }: any) {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <AuthPage />;
  }
  
  // Check if user needs onboarding
  const hasCompletedOnboarding = localStorage.getItem("onboarding-completed");
  if (!hasCompletedOnboarding && user) {
    return <OnboardingPage />;
  }
  
  return <Component {...props} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/" component={(props) => <ProtectedRoute component={Home} {...props} />} />
      <Route path="/share/:linkId" component={(props) => <ProtectedRoute component={Home} {...props} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="whos-night-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
