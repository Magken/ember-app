/*
  # Comprehensive Authentication System Setup

  This migration creates a complete authentication system with the following components:

  ## 1. New Tables
  - `user_profiles` - Extended user information with nicknames, unique codes, and activity tracking
  - `user_agreements` - Terms and conditions acceptance tracking with IP and user agent logging
  - `auth_attempts` - Authentication attempt logging for security monitoring and rate limiting
  - `password_reset_tokens` - Secure password reset token management
  - `user_sessions` - Enhanced session management with device tracking

  ## 2. Security Features
  - Row Level Security (RLS) enabled on all tables
  - Comprehensive policies for data access control
  - Rate limiting functions to prevent brute force attacks
  - Password strength validation
  - Email format validation

  ## 3. Database Functions
  - `validate_email()` - Email format validation
  - `validate_password_strength()` - Password strength checking
  - `check_rate_limit()` - Rate limiting enforcement
  - `log_auth_attempt()` - Authentication attempt logging
  - `cleanup_expired_data()` - Automatic cleanup of expired tokens
  - `create_user_profile()` - Automatic profile creation trigger
  - `update_user_profile_timestamp()` - Profile update timestamp trigger

  ## 4. Indexes and Constraints
  - Performance indexes on frequently queried columns
  - Unique constraints for data integrity
  - Check constraints for data validation
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text NOT NULL CHECK (length(nickname) >= 2 AND length(nickname) <= 50),
  unique_code text NOT NULL DEFAULT ('EMBR-' || upper(substring(gen_random_uuid()::text, 1, 8))) UNIQUE,
  avatar_url text,
  bio text CHECK (length(bio) <= 500),
  is_active boolean DEFAULT true,
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_nickname ON user_profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_user_profiles_unique_code ON user_profiles(unique_code);

-- Create user_agreements table
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

-- Create index for user_agreements
CREATE INDEX IF NOT EXISTS idx_user_agreements_user_type ON user_agreements(user_id, agreement_type);

-- Create auth_attempts table
CREATE TABLE IF NOT EXISTS auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  attempt_type text NOT NULL CHECK (attempt_type IN ('login', 'signup', 'password_reset')),
  success boolean NOT NULL DEFAULT false,
  ip_address inet,
  user_agent text,
  error_message text,
  attempted_at timestamptz DEFAULT now()
);

-- Create indexes for auth_attempts
CREATE INDEX IF NOT EXISTS idx_auth_attempts_email_time ON auth_attempts(email, attempted_at);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip_time ON auth_attempts(ip_address, attempted_at);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  ip_address inet,
  UNIQUE(user_id, token_hash)
);

-- Create index for password_reset_tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Create user_sessions table
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
  created_at timestamptz DEFAULT now()
);

-- Create indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for user_agreements
CREATE POLICY "Users can read own agreements" ON user_agreements
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agreements" ON user_agreements
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for auth_attempts
CREATE POLICY "Anyone can insert auth attempts" ON auth_attempts
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read own auth attempts" ON auth_attempts
  FOR SELECT TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Create RLS policies for password_reset_tokens
CREATE POLICY "Users can read own reset tokens" ON password_reset_tokens
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage reset tokens" ON password_reset_tokens
  FOR ALL TO service_role
  WITH CHECK (true);

-- Create RLS policies for user_sessions
CREATE POLICY "Users can read own sessions" ON user_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON user_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON user_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to validate email format
CREATE OR REPLACE FUNCTION validate_email(email_input text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

-- Create function to validate password strength
CREATE OR REPLACE FUNCTION validate_password_strength(password_input text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  common_passwords text[] := ARRAY[
    'password', '12345678', 'qwerty123', 'abc123456', 'password123',
    'admin123', 'letmein123', 'welcome123', 'monkey123', '123456789'
  ];
BEGIN
  -- Check minimum length
  IF length(password_input) < 8 THEN
    RETURN false;
  END IF;
  
  -- Check for uppercase letter
  IF password_input !~ '[A-Z]' THEN
    RETURN false;
  END IF;
  
  -- Check for lowercase letter
  IF password_input !~ '[a-z]' THEN
    RETURN false;
  END IF;
  
  -- Check for number
  IF password_input !~ '[0-9]' THEN
    RETURN false;
  END IF;
  
  -- Check for special character
  IF password_input !~ '[^A-Za-z0-9]' THEN
    RETURN false;
  END IF;
  
  -- Check against common passwords
  IF lower(password_input) = ANY(common_passwords) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Create function to check rate limiting
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
    AND attempted_at > (now() - interval '1 minute' * time_window_minutes);
  
  RETURN attempt_count < max_attempts;
END;
$$;

-- Create function to log authentication attempts
CREATE OR REPLACE FUNCTION log_auth_attempt(
  email_input text,
  attempt_type_input text,
  success_input boolean,
  ip_address_input inet DEFAULT NULL,
  user_agent_input text DEFAULT NULL,
  error_message_input text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
  );
END;
$$;

-- Create function to cleanup expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Clean up expired password reset tokens
  DELETE FROM password_reset_tokens
  WHERE expires_at < now();
  
  -- Clean up expired user sessions
  DELETE FROM user_sessions
  WHERE expires_at < now();
  
  -- Clean up old auth attempts (keep last 30 days)
  DELETE FROM auth_attempts
  WHERE attempted_at < (now() - interval '30 days');
END;
$$;

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_profiles (id, nickname)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', 'User')
  );
  RETURN NEW;
END;
$$;

-- Create function to update user profile timestamp
CREATE OR REPLACE FUNCTION update_user_profile_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Create trigger to update user profile timestamp
DROP TRIGGER IF EXISTS update_user_profile_timestamp_trigger ON user_profiles;
CREATE TRIGGER update_user_profile_timestamp_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profile_timestamp();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Insert initial cleanup job (optional - for demonstration)
-- You might want to set up a cron job or scheduled function to run cleanup_expired_data() periodically