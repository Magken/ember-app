import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a unique session ID for this tab/window
const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
console.log('Creating Supabase client with session ID:', sessionId);

// Custom storage adapter that uses sessionStorage with unique keys per tab
const createTabUniqueStorage = () => {
  const keyPrefix = `supabase_${sessionId}_`;
  
  return {
    getItem: (key: string) => {
      try {
        // First try sessionStorage (tab-specific)
        const sessionValue = sessionStorage.getItem(keyPrefix + key);
        if (sessionValue) {
          console.log(`Retrieved from sessionStorage: ${key}`);
          return sessionValue;
        }
        
        // Fallback to localStorage for initial session (but don't use it for ongoing storage)
        const localValue = localStorage.getItem(key);
        if (localValue) {
          console.log(`Retrieved from localStorage (fallback): ${key}`);
          // Immediately copy to sessionStorage and remove from localStorage
          sessionStorage.setItem(keyPrefix + key, localValue);
          localStorage.removeItem(key);
          return localValue;
        }
        
        return null;
      } catch (error) {
        console.warn('Storage getItem error:', error);
        return null;
      }
    },
    
    setItem: (key: string, value: string) => {
      try {
        // Always store in sessionStorage with unique prefix
        sessionStorage.setItem(keyPrefix + key, value);
        console.log(`Stored in sessionStorage: ${key}`);
        
        // Remove from localStorage to prevent conflicts
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore localStorage removal errors
        }
      } catch (error) {
        console.warn('Storage setItem error:', error);
      }
    },
    
    removeItem: (key: string) => {
      try {
        // Remove from both storages
        sessionStorage.removeItem(keyPrefix + key);
        localStorage.removeItem(key);
        console.log(`Removed from storage: ${key}`);
      } catch (error) {
        console.warn('Storage removeItem error:', error);
      }
    }
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Use our custom tab-unique storage
    storage: createTabUniqueStorage()
  }
});

// Types for our database schema
export interface UserProfile {
  id: string;
  nickname: string;
  unique_code: string;
  avatar_url?: string;
  bio?: string;
  is_active: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserAgreement {
  id: string;
  user_id: string;
  agreement_type: string;
  agreement_version: string;
  accepted_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AuthAttempt {
  id: string;
  email: string;
  attempt_type: 'login' | 'signup' | 'password_reset';
  success: boolean;
  ip_address?: string;
  user_agent?: string;
  error_message?: string;
  attempted_at: string;
}

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
  ip_address?: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  refresh_token?: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: any;
  is_active: boolean;
  expires_at: string;
  last_activity_at: string;
  created_at: string;
}

// Export session ID for debugging
export { sessionId };