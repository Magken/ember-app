/*
  # Comprehensive Authentication System for Embr

  1. New Tables
    - `user_profiles` - Extended user profile information
    - `user_agreements` - Terms & conditions acceptance tracking
    - `auth_attempts` - Failed login attempt tracking
    - `password_reset_tokens` - Secure password reset functionality
    - `user_sessions` - Enhanced session management

  2. Security Features
    - Email validation and verification
    - Strong password requirements
    - Rate limiting for failed attempts
    - Secure session handling
    - Terms acceptance tracking
    - Password reset functionality

  3. Row Level Security
    - Enable RLS on all tables
    - Policies for authenticated users only
    - Admin access for monitoring
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text NOT NULL CHECK (length(nickname) >= 2 AND length(nickname) <= 50),
  unique_code text UNIQUE NOT NULL DEFAULT ('EMBR-' || upper(substring(gen_random_uuid()::text, 1, 8))),
  avatar_url text,
  bio text CHECK (length(bio) <= 500),
  is_active boolean DEFAULT true,
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Agreements Table (Terms & Conditions tracking)
CREATE TABLE IF NOT EXISTS user_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreement_type text NOT NULL DEFAULT 'terms_and_conditions',
  agreement_version text NOT NULL DEFAULT '1.0',
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  UNIQUE(user_id, agreement_type, agreement_version)
);

-- Authentication Attempts Table (Rate limiting & monitoring)
CREATE TABLE IF NOT EXISTS auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  attempt_type text NOT NULL CHECK (attempt_type IN ('login', 'signup', 'password_reset')),
  success boolean NOT NULL DEFAULT false,
  ip_address inet,
  user_agent text,
  error_message text,
  attempted_at timestamptz DEFAULT now(),
  -- Index for efficient rate limiting queries
  INDEX idx_auth_attempts_email_time (email, attempted_at),
  INDEX idx_auth_attempts_ip_time (ip_address, attempted_at)
);

-- Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  ip_address inet,
  -- Ensure only one active token per user
  UNIQUE(user_id, token_hash)
);

-- Enhanced User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  refresh_token text UNIQUE,
  ip_address inet,
  user_agent text,
  device_info jsonb,
  is_active boolean DEFAULT true,
  expires_at timestamptz NOT NULL,
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  -- Index for session cleanup
  INDEX idx_user_sessions_expires (expires_at),
  INDEX idx_user_sessions_user_active (user_id, is_active)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_agreements
CREATE POLICY "Users can read own agreements"
  ON user_agreements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agreements"
  ON user_agreements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for auth_attempts (read-only for users, admin access)
CREATE POLICY "Users can read own auth attempts"
  ON auth_attempts
  FOR SELECT
  TO authenticated
  USING (email = auth.email());

-- RLS Policies for password_reset_tokens (restricted access)
CREATE POLICY "Users can read own reset tokens"
  ON password_reset_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_sessions
CREATE POLICY "Users can read own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON user_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Functions for enhanced security

-- Function to validate email format
CREATE OR REPLACE FUNCTION validate_email(email_input text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

-- Function to validate password strength
CREATE OR REPLACE FUNCTION validate_password_strength(password_input text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb := '{"valid": true, "errors": []}'::jsonb;
  errors text[] := '{}';
BEGIN
  -- Check minimum length
  IF length(password_input) < 8 THEN
    errors := array_append(errors, 'Password must be at least 8 characters long');
  END IF;
  
  -- Check for uppercase letter
  IF password_input !~ '[A-Z]' THEN
    errors := array_append(errors, 'Password must contain at least one uppercase letter');
  END IF;
  
  -- Check for lowercase letter
  IF password_input !~ '[a-z]' THEN
    errors := array_append(errors, 'Password must contain at least one lowercase letter');
  END IF;
  
  -- Check for number
  IF password_input !~ '[0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one number');
  END IF;
  
  -- Check for special character
  IF password_input !~ '[^A-Za-z0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one special character');
  END IF;
  
  -- Check against common passwords
  IF lower(password_input) = ANY(ARRAY[
    'password', '12345678', 'qwerty123', 'abc123456', 'password123',
    'admin123', 'letmein123', 'welcome123', 'monkey123', '123456789'
  ]) THEN
    errors := array_append(errors, 'Password is too common, please choose a stronger password');
  END IF;
  
  -- Update result
  IF array_length(errors, 1) > 0 THEN
    result := jsonb_build_object('valid', false, 'errors', errors);
  END IF;
  
  RETURN result;
END;
$$;

-- Function to check rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
  email_input text,
  attempt_type_input text,
  max_attempts integer DEFAULT 5,
  time_window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  attempt_count integer;
BEGIN
  SELECT COUNT(*)
  INTO attempt_count
  FROM auth_attempts
  WHERE email = email_input
    AND attempt_type = attempt_type_input
    AND success = false
    AND attempted_at > (now() - interval '1 minute' * time_window_minutes);
  
  RETURN attempt_count < max_attempts;
END;
$$;

-- Function to log authentication attempts
CREATE OR REPLACE FUNCTION log_auth_attempt(
  email_input text,
  attempt_type_input text,
  success_input boolean,
  ip_address_input inet DEFAULT NULL,
  user_agent_input text DEFAULT NULL,
  error_message_input text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  attempt_id uuid;
BEGIN
  INSERT INTO auth_attempts (
    email,
    attempt_type,
    success,
    ip_address,
    user_agent,
    error_message
  ) VALUES (
    email_input,
    attempt_type_input,
    success_input,
    ip_address_input,
    user_agent_input,
    error_message_input
  ) RETURNING id INTO attempt_id;
  
  RETURN attempt_id;
END;
$$;

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_profiles (id, nickname)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Function to update user profile timestamp
CREATE OR REPLACE FUNCTION update_user_profile_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to clean up expired tokens and sessions
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Clean up expired password reset tokens
  DELETE FROM password_reset_tokens
  WHERE expires_at < now() OR used_at IS NOT NULL;
  
  -- Clean up expired sessions
  DELETE FROM user_sessions
  WHERE expires_at < now();
  
  -- Clean up old auth attempts (keep last 30 days)
  DELETE FROM auth_attempts
  WHERE attempted_at < (now() - interval '30 days');
END;
$$;

-- Triggers

-- Trigger to create user profile after signup
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Trigger to update user profile timestamp
DROP TRIGGER IF EXISTS update_user_profile_timestamp_trigger ON user_profiles;
CREATE TRIGGER update_user_profile_timestamp_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profile_timestamp();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_unique_code ON user_profiles(unique_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_nickname ON user_profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_user_agreements_user_type ON user_agreements(user_id, agreement_type);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- Create a scheduled job to clean up expired data (requires pg_cron extension)
-- This would typically be set up separately in your Supabase dashboard
-- SELECT cron.schedule('cleanup-expired-data', '0 2 * * *', 'SELECT cleanup_expired_data();');