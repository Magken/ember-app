import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export class AuthService {
  private static instance: AuthService;
  private listeners: ((state: AuthState) => void)[] = [];
  private currentState: AuthState = {
    user: null,
    session: null,
    loading: true
  };

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        await this.handleInvalidSession();
        return;
      }

      // If we have a session, verify the user still exists
      if (session) {
        try {
          const { data: user, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error('Error verifying user:', userError);
            // If user doesn't exist (403 error), clear the invalid session
            if (userError.message?.includes('User from sub claim in JWT does not exist') || 
                userError.status === 403) {
              await this.handleInvalidSession();
              return;
            }
          }

          this.updateState({
            user: user?.user || null,
            session,
            loading: false
          });
        } catch (verificationError) {
          console.error('User verification failed:', verificationError);
          await this.handleInvalidSession();
          return;
        }
      } else {
        this.updateState({
          user: null,
          session: null,
          loading: false
        });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_OUT' || !session) {
          this.updateState({
            user: null,
            session: null,
            loading: false
          });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          try {
            const { data: user, error } = await supabase.auth.getUser();
            
            if (error) {
              console.error('Error getting user after auth change:', error);
              if (error.message?.includes('User from sub claim in JWT does not exist') || 
                  error.status === 403) {
                await this.handleInvalidSession();
                return;
              }
            }

            this.updateState({
              user: user?.user || null,
              session,
              loading: false
            });
          } catch (error) {
            console.error('Error handling auth state change:', error);
            await this.handleInvalidSession();
          }
        }
      });

    } catch (error) {
      console.error('Auth initialization error:', error);
      await this.handleInvalidSession();
    }
  }

  private async handleInvalidSession() {
    console.log('Handling invalid session - clearing local storage and signing out');
    
    try {
      // Sign out to clear the session
      await supabase.auth.signOut();
      
      // Clear any remaining local storage items related to Supabase
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // Update state to signed out
      this.updateState({
        user: null,
        session: null,
        loading: false
      });

      // Optionally reload the page to ensure clean state
      window.location.reload();
      
    } catch (error) {
      console.error('Error handling invalid session:', error);
      // Force reload as fallback
      window.location.reload();
    }
  }

  private updateState(newState: Partial<AuthState>) {
    this.currentState = { ...this.currentState, ...newState };
    this.listeners.forEach(listener => listener(this.currentState));
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.currentState);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getCurrentState(): AuthState {
    return this.currentState;
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  }

  async signUp(email: string, password: string, nickname: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname
          }
        }
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        throw error;
      }
      return { error: null };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error };
    }
  }
}

export const authService = AuthService.getInstance();