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
  
  // Debug logging to understand user profile data
  console.log('User profile data:', user);
  console.log('User name:', user?.name);
  console.log('User role:', user?.role);
  console.log('User familyId:', user?.familyId);
  
  // Check if user needs onboarding based on their profile completeness
  // If user has joined a family (familyId is not null/undefined), they should skip onboarding
  // Users who haven't joined a family (familyId is null) should go through onboarding
  const hasJoinedFamily = user && user.familyId !== null && user.familyId !== undefined;
  const hasCompleteProfile = user && user.name && user.role && hasJoinedFamily;
  
  console.log('Has joined family:', hasJoinedFamily);
  console.log('Has complete profile:', hasCompleteProfile);
  
  // If user has joined a family, skip onboarding regardless of role
  if (hasJoinedFamily) {
    console.log('User has joined family, showing main app');
    return <Component {...props} />;
  }
  
  // If user hasn't joined a family, they need to go through onboarding
  if (!hasJoinedFamily && user) {
    console.log('Redirecting to onboarding - user has not joined family');
    return <OnboardingPage />;
  }
  
  console.log('User has complete profile, showing main app');
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
