
import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabaseCustom, supabaseOperations } from '@/integrations/supabase/client-custom';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  initialized: boolean;
}

export const useOptimizedAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    isSuperAdmin: false,
    loading: true,
    initialized: false,
  });
  
  const authCheckPromise = useRef<Promise<AuthState> | null>(null);
  const cacheTimeout = useRef<NodeJS.Timeout | null>(null);

  const checkAdminStatus = async (userId: string): Promise<{ isAdmin: boolean; isSuperAdmin: boolean }> => {
    // Cache admin status for 5 minutes
    const cacheKey = `admin_status_${userId}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 5 * 60 * 1000) { // 5 minutes
        return data;
      }
    }

    try {
      const { data, error } = await supabaseOperations.getAdminProfiles();
      
      if (error) {
        console.error('Error checking admin status:', error);
        return { isAdmin: false, isSuperAdmin: false };
      }
      
      const adminProfile = data?.find((profile: any) => profile.id === userId);
      const result = adminProfile 
        ? {
            isAdmin: true,
            isSuperAdmin: adminProfile.role === 'super_admin'
          }
        : { isAdmin: false, isSuperAdmin: false };

      // Cache the result
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: result,
        timestamp: Date.now()
      }));

      return result;
    } catch (error) {
      console.error('Error in checkAdminStatus:', error);
      return { isAdmin: false, isSuperAdmin: false };
    }
  };

  const updateAuthState = async (user: User | null): Promise<AuthState> => {
    if (!user) {
      const newState = {
        user: null,
        isAdmin: false,
        isSuperAdmin: false,
        loading: false,
        initialized: true,
      };
      setAuthState(newState);
      return newState;
    }

    // Check if we have cached admin status
    const { isAdmin, isSuperAdmin } = await checkAdminStatus(user.id);
    
    const newState = {
      user,
      isAdmin,
      isSuperAdmin,
      loading: false,
      initialized: true,
    };
    
    setAuthState(newState);
    return newState;
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // Prevent multiple simultaneous auth checks
      if (authCheckPromise.current) {
        return authCheckPromise.current;
      }

      authCheckPromise.current = (async () => {
        try {
          // Get session immediately without waiting
          const { data: { session }, error } = await supabaseCustom.auth.getSession();
          
          if (error) {
            console.error('Session error:', error);
          }

          if (mounted) {
            return await updateAuthState(session?.user ?? null);
          }
          
          return authState;
        } catch (error) {
          console.error('Auth initialization error:', error);
          if (mounted) {
            const errorState = {
              user: null,
              isAdmin: false,
              isSuperAdmin: false,
              loading: false,
              initialized: true,
            };
            setAuthState(errorState);
            return errorState;
          }
          return authState;
        } finally {
          authCheckPromise.current = null;
        }
      })();

      return authCheckPromise.current;
    };

    // Initialize immediately
    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabaseCustom.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          // Clear cache on auth change
          if (event === 'SIGNED_OUT') {
            sessionStorage.clear();
          }
          
          await updateAuthState(session?.user ?? null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (cacheTimeout.current) {
        clearTimeout(cacheTimeout.current);
      }
    };
  }, []);

  const signOut = async () => {
    try {
      sessionStorage.clear(); // Clear cache
      await supabaseCustom.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    ...authState,
    signOut,
  };
};
