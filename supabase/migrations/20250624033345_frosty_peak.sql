/*
  # Fix RLS policies for authentication system

  1. Security Updates
    - Allow anonymous users to insert into auth_attempts table for logging
    - Allow service role to insert user profiles during signup
    - Allow authenticated users to insert their own agreements
    - Update existing policies to be more permissive for necessary operations

  2. Changes Made
    - Modified auth_attempts table to allow anonymous inserts
    - Updated user_profiles policies to allow profile creation during signup
    - Ensured user_agreements can be inserted by authenticated users
    - Added policies for password reset tokens and user sessions
*/

-- Drop existing restrictive policies and recreate them with proper permissions

-- Auth attempts table - allow anonymous users to log attempts
DROP POLICY IF EXISTS "Users can read own auth attempts" ON auth_attempts;

CREATE POLICY "Anyone can insert auth attempts"
  ON auth_attempts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read own auth attempts"
  ON auth_attempts
  FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- User profiles table - allow creation during signup
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- User agreements table - ensure authenticated users can insert their own agreements
DROP POLICY IF EXISTS "Users can insert own agreements" ON user_agreements;
DROP POLICY IF EXISTS "Users can read own agreements" ON user_agreements;

CREATE POLICY "Users can insert own agreements"
  ON user_agreements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own agreements"
  ON user_agreements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Password reset tokens - allow authenticated users to read their own tokens
DROP POLICY IF EXISTS "Users can read own reset tokens" ON password_reset_tokens;

CREATE POLICY "Users can read own reset tokens"
  ON password_reset_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage reset tokens"
  ON password_reset_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User sessions - allow users to manage their own sessions
DROP POLICY IF EXISTS "Users can read own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON user_sessions;

CREATE POLICY "Users can read own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON user_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON user_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create or update the RPC functions to handle the new policies

-- Function to log authentication attempts (accessible by anonymous users)
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

-- Function to check rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
  email_input text,
  attempt_type_input text,
  max_attempts integer DEFAULT 5,
  time_window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attempt_count integer;
BEGIN
  SELECT COUNT(*)
  INTO attempt_count
  FROM auth_attempts
  WHERE email = email_input
    AND attempt_type = attempt_type_input
    AND attempted_at > NOW() - INTERVAL '1 minute' * time_window_minutes;
  
  RETURN attempt_count < max_attempts;
END;
$$;

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION log_auth_attempt TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO anon, authenticated;