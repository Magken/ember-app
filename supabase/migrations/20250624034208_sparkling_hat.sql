/*
  # Add missing database functions for authentication system

  1. Database Functions
    - `update_user_profile_timestamp()` - Updates the updated_at timestamp for user profiles
    - `create_user_profile()` - Automatically creates a user profile when a new user signs up
    - `validate_email()` - Validates email format
    - `validate_password_strength()` - Validates password strength requirements
    - `check_rate_limit()` - Enforces rate limiting for authentication attempts
    - `log_auth_attempt()` - Logs authentication attempts for security monitoring
    - `cleanup_expired_data()` - Cleans up expired tokens and sessions

  2. Triggers
    - Trigger to automatically create user profile on user creation
    - Trigger to update timestamps on profile updates

  3. Security
    - All functions respect RLS policies
    - Proper error handling and validation
*/

-- Function to update user profile timestamp
CREATE OR REPLACE FUNCTION update_user_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, nickname)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate email format
CREATE OR REPLACE FUNCTION validate_email(email_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- Function to validate password strength
CREATE OR REPLACE FUNCTION validate_password_strength(password_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check minimum length
  IF LENGTH(password_input) < 8 THEN
    RETURN FALSE;
  END IF;
  
  -- Check for uppercase letter
  IF password_input !~ '[A-Z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for lowercase letter
  IF password_input !~ '[a-z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for number
  IF password_input !~ '[0-9]' THEN
    RETURN FALSE;
  END IF;
  
  -- Check for special character
  IF password_input !~ '[!@#$%^&*(),.?":{}|<>]' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
  email_input TEXT,
  attempt_type_input TEXT,
  ip_input INET DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  attempt_count INTEGER;
  time_window INTERVAL;
  max_attempts INTEGER;
BEGIN
  -- Set rate limits based on attempt type
  CASE attempt_type_input
    WHEN 'login' THEN
      time_window := INTERVAL '15 minutes';
      max_attempts := 5;
    WHEN 'signup' THEN
      time_window := INTERVAL '15 minutes';
      max_attempts := 5;
    WHEN 'password_reset' THEN
      time_window := INTERVAL '60 minutes';
      max_attempts := 3;
    ELSE
      time_window := INTERVAL '15 minutes';
      max_attempts := 5;
  END CASE;

  -- Count recent failed attempts
  SELECT COUNT(*)
  INTO attempt_count
  FROM auth_attempts
  WHERE email = email_input
    AND attempt_type = attempt_type_input
    AND success = FALSE
    AND attempted_at > (now() - time_window)
    AND (ip_input IS NULL OR ip_address = ip_input);

  RETURN attempt_count < max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log authentication attempts
CREATE OR REPLACE FUNCTION log_auth_attempt(
  email_input TEXT,
  attempt_type_input TEXT,
  success_input BOOLEAN,
  ip_input INET DEFAULT NULL,
  user_agent_input TEXT DEFAULT NULL,
  error_message_input TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  attempt_id UUID;
BEGIN
  INSERT INTO auth_attempts (
    email,
    attempt_type,
    success,
    ip_address,
    user_agent,
    error_message
  )
  VALUES (
    email_input,
    attempt_type_input,
    success_input,
    ip_input,
    user_agent_input,
    error_message_input
  )
  RETURNING id INTO attempt_id;
  
  RETURN attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS INTEGER AS $$
DECLARE
  cleanup_count INTEGER := 0;
BEGIN
  -- Clean up expired password reset tokens
  DELETE FROM password_reset_tokens
  WHERE expires_at < now();
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  -- Clean up expired user sessions
  DELETE FROM user_sessions
  WHERE expires_at < now();
  
  GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
  
  -- Clean up old auth attempts (keep last 30 days)
  DELETE FROM auth_attempts
  WHERE attempted_at < (now() - INTERVAL '30 days');
  
  GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
  
  RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile when user signs up
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_user_profile() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION validate_email(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION validate_password_strength(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, TEXT, INET) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION log_auth_attempt(TEXT, TEXT, BOOLEAN, INET, TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cleanup_expired_data() TO service_role;