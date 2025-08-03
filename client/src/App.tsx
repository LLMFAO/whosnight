import { Switch, Route, useRoute } from "wouter";
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
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";

function ProtectedRoute({ component: Component, ...props }: any) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessingShareLink, setIsProcessingShareLink] = useState(false);
  const [shareLinkError, setShareLinkError] = useState<string | null>(null);
  
  // Use useRoute to extract linkId from URL parameters
  const [match, params] = useRoute("/share/:linkId");
  const linkId = params?.linkId;
  
  // Handle share link processing
  useEffect(() => {
    const processShareLink = async () => {
      if (!linkId || !isAuthenticated || !user || isProcessingShareLink) {
        return;
      }
      
      // If user already has a family, skip share link processing
      if (user.familyId) {
        console.log('User already has a family, skipping share link processing');
        return;
      }
      
      setIsProcessingShareLink(true);
      setShareLinkError(null);
      
      try {
        console.log('Processing share link with linkId:', linkId);
        
        // First, look up the share link to get the family information
        const { data: shareLink, error: shareLinkError } = await supabase
          .from('share_links')
          .select('*')
          .eq('link_id', linkId)
          .single();
          
        if (shareLinkError || !shareLink) {
          console.error('Share link not found:', shareLinkError);
          setShareLinkError('Invalid or expired share link');
          return;
        }
        
        // Check if share link has expired
        if (new Date(shareLink.expires_at) < new Date()) {
          console.error('Share link has expired');
          setShareLinkError('This share link has expired');
          return;
        }
        
        // Get the family information from the user who created the share link
        const { data: creatorUser, error: creatorError } = await supabase
          .from('users')
          .select('family_id')
          .eq('id', shareLink.created_by)
          .single();
          
        if (creatorError || !creatorUser || !creatorUser.family_id) {
          console.error('Could not find creator family:', creatorError);
          setShareLinkError('Unable to find family information');
          return;
        }
        
        // Get the family code
        const { data: family, error: familyError } = await supabase
          .from('families')
          .select('code')
          .eq('id', creatorUser.family_id)
          .single();
          
        if (familyError || !family) {
          console.error('Could not find family:', familyError);
          setShareLinkError('Unable to find family');
          return;
        }
        
        // Join the family using the family code
        const { data: joinResult, error: joinError } = await supabase.functions.invoke('join_family', {
          body: { familyCode: family.code }
        });
        
        if (joinError) {
          console.error('Error joining family:', joinError);
          setShareLinkError('Failed to join family');
          return;
        }
        
        // The join_family function should have already updated the user's family_id
        // We just need to refresh the user data to reflect the family join
        console.log('Successfully joined family via share link');
        
        // Refresh user data to reflect the family join
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        
      } catch (error) {
        console.error('Unexpected error processing share link:', error);
        setShareLinkError('An unexpected error occurred');
      } finally {
        setIsProcessingShareLink(false);
      }
    };
    
    processShareLink();
  }, [linkId, isAuthenticated, user, isProcessingShareLink, queryClient]);
  
  if (isLoading || isProcessingShareLink) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">
          {isProcessingShareLink ? 'Joining family...' : 'Loading...'}
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <AuthPage />;
  }
  
  // Show error if share link processing failed
  if (shareLinkError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">{shareLinkError}</div>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Continue to App
          </button>
        </div>
      </div>
    );
  }
  
  // Debug logging to understand user profile data
  console.log('User profile data:', user);
  console.log('User name:', user?.name);
  console.log('User role:', user?.role);
  console.log('User familyId:', user?.familyId);
  console.log('User family_id:', user?.family_id);
  console.log('User familyId type:', typeof user?.familyId);
  console.log('User family_id type:', typeof user?.family_id);
  
  // Check if onboarding was already completed via localStorage
  const onboardingCompleted = localStorage.getItem("onboarding-completed") === "true";
  
  // Check if user needs onboarding based on their profile completeness
  // A user should go through onboarding only if they haven't joined a family yet
  // Users who have joined a family (familyId is a number) should skip onboarding
  // Check both familyId (camelCase) and family_id (snake_case from database)
  const hasJoinedFamily = user && (
    (typeof user.familyId === 'number' && user.familyId > 0) ||
    (typeof user.family_id === 'number' && user.family_id > 0)
  );
  
  console.log('Has joined family:', hasJoinedFamily);
  console.log('Onboarding completed:', onboardingCompleted);
  
  // If user has joined a family, skip onboarding and show main app
  if (hasJoinedFamily) {
    console.log('User has joined family, showing main app');
    return <Component {...props} />;
  }
  
  // If onboarding was completed (even without family), show main app to prevent infinite loops
  if (onboardingCompleted) {
    console.log('Onboarding was completed, showing main app to prevent infinite loop');
    return <Component {...props} />;
  }
  
  // If user hasn't joined a family and hasn't completed onboarding, they need to go through onboarding
  if (!hasJoinedFamily && !onboardingCompleted && user) {
    console.log('Redirecting to onboarding - user has not joined family and not completed onboarding');
    return <OnboardingPage />;
  }
  
  // For any other case, show the main app (this shouldn't normally happen)
  console.log('Showing main app by default');
  return <Component {...props} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/share/:linkId" component={() => <ProtectedRoute component={Home} />} />
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
