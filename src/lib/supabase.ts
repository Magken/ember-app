import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
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