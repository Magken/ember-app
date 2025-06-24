import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, sessionId } from '../../lib/supabase';
import type { UserProfile } from '../../lib/supabase';
import { getCurrentUserProfile } from '../../lib/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log(`AuthProvider initialized for session: ${sessionId}`);

  // Function to completely clear auth state for this session only
  const clearAuthState = () => {
    console.log('Clearing auth state for this session only...');
    setUser(null);
    setSession(null);
    setProfile(null);
    setError(null);
    setLoading(false);
    
    // Clear only this tab's session storage
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.includes('supabase')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      console.log('Cleared tab-specific session storage');
    } catch (e) {
      console.warn('Could not clear sessionStorage:', e);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      try {
        console.log('Refreshing profile for user:', user.id);
        const userProfile = await getCurrentUserProfile();
        setProfile(userProfile);
        setError(null);
        console.log('Profile refreshed:', userProfile);
      } catch (err) {
        console.error('Error refreshing profile:', err);
        // Don't set error for profile issues - user can still use the app
        console.warn('Profile refresh failed, continuing without profile');
      }
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out process for this tab only...');
      setLoading(true);
      
      // First, clear local state immediately
      setUser(null);
      setSession(null);
      setProfile(null);
      setError(null);
      
      // Clear only this tab's session storage
      try {
        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.includes('supabase')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
        console.log('Session storage cleared for this tab only');
      } catch (e) {
        console.warn('Could not clear sessionStorage:', e);
      }
      
      // Then sign out from Supabase (only this session)
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.error('Supabase sign out error:', error);
        // Don't throw error, we've already cleared local state
      }
      
      console.log('Sign out completed successfully for this tab');
      
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if sign out fails, we've cleared the local state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let initializationTimeout: NodeJS.Timeout;

    // Set a maximum time for initialization
    const MAX_INIT_TIME = 6000; // 6 seconds

    // Get initial session with timeout protection
    const getInitialSession = async () => {
      try {
        console.log(`Getting initial session for tab: ${sessionId}`);
        
        // Set a timeout to prevent infinite loading
        initializationTimeout = setTimeout(() => {
          if (mounted) {
            console.warn('Session initialization timed out, clearing state');
            clearAuthState();
          }
        }, MAX_INIT_TIME);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Clear the timeout since we got a response
        if (initializationTimeout) {
          clearTimeout(initializationTimeout);
        }
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          
          // Handle specific error cases that indicate invalid sessions
          if (error.message?.includes('User from sub claim in JWT does not exist') ||
              error.message?.includes('Invalid JWT') ||
              error.message?.includes('JWT expired') ||
              error.message?.includes('refresh_token_not_found')) {
            console.log('Invalid/expired session detected, clearing...');
            clearAuthState();
            // Force sign out to clean up any remaining session data
            await supabase.auth.signOut({ scope: 'local' });
            return;
          } else {
            console.warn('Session error, but continuing:', error.message);
            setError('Authentication issue detected. Please try refreshing the page.');
            setLoading(false);
            return;
          }
        }
        
        console.log(`Initial session result for ${sessionId}:`, session ? 'Found valid session' : 'No session');
        
        if (session?.user) {
          // Validate the session by trying to get user info
          try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            
            if (userError || !userData.user) {
              console.log('Session validation failed, clearing...');
              clearAuthState();
              await supabase.auth.signOut({ scope: 'local' });
              return;
            }
            
            console.log(`Session validated for ${sessionId}, setting user state`);
            setSession(session);
            setUser(userData.user);
            
            // Try to load profile, but don't block if it fails
            try {
              console.log('Loading user profile...');
              const userProfile = await getCurrentUserProfile();
              if (mounted) {
                setProfile(userProfile);
                console.log('Profile loaded successfully');
              }
            } catch (profileError) {
              console.warn('Profile loading failed, but continuing:', profileError);
              // Continue without profile - user can still use the app
            }
          } catch (validationError) {
            console.error('Session validation error:', validationError);
            clearAuthState();
            await supabase.auth.signOut({ scope: 'local' });
            return;
          }
        } else {
          // No session - user is not logged in
          setSession(null);
          setUser(null);
          setProfile(null);
        }
        
      } catch (error) {
        console.error('Session initialization error:', error);
        if (mounted) {
          // Clear everything and start fresh
          clearAuthState();
        }
      } finally {
        if (mounted) {
          console.log(`Session initialization complete for ${sessionId}, setting loading to false`);
          setLoading(false);
        }
        if (initializationTimeout) {
          clearTimeout(initializationTimeout);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log(`Auth state changed for ${sessionId}:`, event, session ? 'with session' : 'no session');
      
      // Clear any existing error
      setError(null);
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log(`User signed out or no session for ${sessionId}`);
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        console.log(`User signed in or token refreshed for ${sessionId}`);
        
        try {
          // Validate the new session
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError || !userData.user) {
            console.log('New session validation failed');
            clearAuthState();
            return;
          }
          
          setSession(session);
          setUser(userData.user);
          
          // Try to load profile for signed in users
          try {
            // For new signups, give the trigger time to create the profile
            if (event === 'SIGNED_IN') {
              console.log('New sign in detected, waiting for profile creation...');
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            const userProfile = await getCurrentUserProfile();
            if (mounted) {
              setProfile(userProfile);
              console.log('Profile loaded after auth change');
            }
          } catch (profileError) {
            console.warn('Profile loading failed after auth change:', profileError);
            // Continue without profile
          }
        } catch (validationError) {
          console.error('Auth change validation error:', validationError);
          clearAuthState();
        }
      }
      
      if (mounted) {
        setLoading(false);
      }
    });

    // Cleanup function
    return () => {
      mounted = false;
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    profile,
    loading,
    error,
    signOut,
    refreshProfile,
    clearAuthState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};