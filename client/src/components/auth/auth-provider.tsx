import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  role?: string;
  familyId?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  // Check if user is authenticated on app load
  const { data: userData, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
      
      if (error || !supabaseUser) {
        throw new Error("Not authenticated");
      }
      
      // Get additional user profile data if needed
      // Handle case where user profile might not exist yet
      let profile = null;
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('username, name, role, family_id')
          .eq('id', supabaseUser.id)
          .maybeSingle(); // Use maybeSingle to handle case where no row exists
        
        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected for new users
          console.warn('Profile query error:', profileError);
        } else {
          profile = profileData;
        }
      } catch (err) {
        console.warn('Failed to fetch user profile:', err);
        // Continue without profile data - user might be in registration flow
      }
      
      return {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        username: profile?.username,
        name: profile?.name,
        role: profile?.role,
        familyId: profile?.family_id,
      };
    },
    retry: false,
  });

  // Update user state when query data changes
  useEffect(() => {
    if (userData) {
      setUser(userData);
    } else {
      setUser(null);
    }
  }, [userData]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Refetch user data when signed in
          queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          queryClient.clear();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
    },
  });

  const login = (userData: User) => {
    setUser(userData);
    queryClient.invalidateQueries({ queryKey: ["auth"] });
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}