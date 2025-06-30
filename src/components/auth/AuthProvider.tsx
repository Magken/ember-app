import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, sessionId } from '../../lib/supabase';
import type { UserProfile } from '../../lib/supabase';
import { getCurrentUserProfile } from '../../lib/auth';
import { sessionManager, type SessionData } from '../../lib/sessionManager';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearAuthState: () => void;
  clearCacheForSignIn: () => Promise<void>;
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
  };

  // Function to clear cache for smooth sign-in
  const clearCacheForSignIn = async () => {
    try {
      await sessionManager.clearCacheForSignIn();
    } catch (error) {
      console.warn('Error clearing cache for sign-in:', error);
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
      
      // Use session manager to clear session and cache
      await sessionManager.clearSession();
      
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
    const MAX_INIT_TIME = 8000; // 8 seconds

    // Get initial session with enhanced session management
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
        
        // Check if cache should be cleared (for returning users)
        if (sessionManager.shouldClearCache()) {
          console.log('Cache clear request detected, clearing cache...');
          await sessionManager.clearCacheForSignIn();
        }
        
        // Initialize session using session manager
        const sessionData = await sessionManager.initializeSession();
        
        // Clear the timeout since we got a response
        if (initializationTimeout) {
          clearTimeout(initializationTimeout);
        }
        
        if (!mounted) return;
        
        if (sessionData) {
          console.log(`Session initialized successfully for ${sessionId}`);
          
          // Get Supabase session for compatibility
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.warn('Supabase session error after initialization:', error);
            clearAuthState();
            return;
          }
          
          if (session?.user) {
            setSession(session);
            setUser(session.user);
            
            // Create profile object from session data
            const profileData: UserProfile = {
              id: sessionData.userId,
              nickname: sessionData.nickname,
              unique_code: sessionData.uniqueCode,
              avatar_url: undefined,
              bio: undefined,
              is_active: true,
              last_seen_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            setProfile(profileData);
            console.log('Profile loaded from session data');
          }
        } else {
          // No session - user is not logged in
          console.log(`No valid session found for ${sessionId}`);
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

    // Set up periodic session validation
    const validationInterval = setInterval(() => {
      if (mounted && document.visibilityState === 'visible') {
        sessionManager.validateSession().then(isValid => {
          if (!isValid && mounted) {
            console.log('Session validation failed, clearing auth state');
            clearAuthState();
          }
        });
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Cleanup function
    return () => {
      mounted = false;
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
      subscription.unsubscribe();
      clearInterval(validationInterval);
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
    clearCacheForSignIn,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};