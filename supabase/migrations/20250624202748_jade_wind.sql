-- Enhanced user deletion cleanup with cascade triggers

-- Function to handle user deletion cleanup
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean up all user-related data when a user is deleted from auth.users
  
  -- Delete friendships where this user is involved
  DELETE FROM friendships 
  WHERE user1_id = OLD.id OR user2_id = OLD.id;
  
  -- Delete friend requests where this user is involved
  DELETE FROM friend_requests 
  WHERE sender_id = OLD.id OR receiver_id = OLD.id;
  
  -- Delete conversations where this user is involved
  DELETE FROM conversations 
  WHERE user1_id = OLD.id OR user2_id = OLD.id;
  
  -- Delete messages sent by this user
  DELETE FROM messages 
  WHERE sender_id = OLD.id;
  
  -- Delete message status records for this user
  DELETE FROM message_status 
  WHERE user_id = OLD.id;
  
  -- Delete connection metrics for this user
  DELETE FROM connection_metrics 
  WHERE user_id = OLD.id;
  
  -- Delete user sessions for this user
  DELETE FROM user_sessions 
  WHERE user_id = OLD.id;
  
  -- Delete password reset tokens for this user
  DELETE FROM password_reset_tokens 
  WHERE user_id = OLD.id;
  
  -- Delete user agreements for this user
  DELETE FROM user_agreements 
  WHERE user_id = OLD.id;
  
  -- Delete user profile (this should cascade automatically, but ensure it's cleaned up)
  DELETE FROM user_profiles 
  WHERE id = OLD.id;
  
  RAISE NOTICE 'Cleaned up all data for deleted user: %', OLD.id;
  
  RETURN OLD;
END;
$$;

-- Create trigger for user deletion cleanup
DROP TRIGGER IF EXISTS trigger_user_deletion_cleanup ON auth.users;
CREATE TRIGGER trigger_user_deletion_cleanup
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deletion();

-- Enhanced get_user_friends function with proper strength calculation
CREATE OR REPLACE FUNCTION get_user_friends()
RETURNS TABLE (
  friend_id UUID,
  friend_nickname TEXT,
  friend_unique_code TEXT,
  connection_strength DECIMAL,
  last_interaction_at TIMESTAMPTZ,
  friendship_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Clean up any orphaned data first
  PERFORM cleanup_deleted_user_data();
  
  RETURN QUERY
  SELECT 
    CASE 
      WHEN f.user1_id = current_user_id THEN f.user2_id 
      ELSE f.user1_id 
    END as friend_id,
    up.nickname as friend_nickname,
    up.unique_code as friend_unique_code,
    -- Default strength that will be recalculated by the frontend
    0.5::DECIMAL as connection_strength,
    f.last_interaction_at,
    f.created_at as friendship_created_at
  FROM friendships f
  JOIN user_profiles up ON (
    CASE 
      WHEN f.user1_id = current_user_id THEN f.user2_id 
      ELSE f.user1_id 
    END = up.id
  )
  WHERE (f.user1_id = current_user_id OR f.user2_id = current_user_id)
    AND user_exists_and_active(
      CASE 
        WHEN f.user1_id = current_user_id THEN f.user2_id 
        ELSE f.user1_id 
      END
    )
  ORDER BY f.last_interaction_at DESC;
END;
$$;

-- Function to clean up orphaned connection metrics
CREATE OR REPLACE FUNCTION cleanup_orphaned_connection_metrics()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete connection metrics for non-existent friendships
  DELETE FROM connection_metrics 
  WHERE NOT EXISTS (
    SELECT 1 FROM friendships 
    WHERE friendships.id = connection_metrics.friendship_id
  );
  
  -- Delete connection metrics for non-existent users
  DELETE FROM connection_metrics 
  WHERE NOT user_exists_and_active(user_id);
  
  RAISE NOTICE 'Cleaned up orphaned connection metrics';
END;
$$;

-- Enhanced cleanup function
CREATE OR REPLACE FUNCTION cleanup_deleted_user_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean up friendships where one user no longer exists
  DELETE FROM friendships 
  WHERE NOT user_exists_and_active(user1_id) 
     OR NOT user_exists_and_active(user2_id);
  
  -- Clean up friend requests where sender or receiver no longer exists
  DELETE FROM friend_requests 
  WHERE NOT user_exists_and_active(sender_id) 
     OR NOT user_exists_and_active(receiver_id);
  
  -- Clean up conversations where one user no longer exists
  DELETE FROM conversations 
  WHERE NOT user_exists_and_active(user1_id) 
     OR NOT user_exists_and_active(user2_id);
  
  -- Clean up messages where sender no longer exists
  DELETE FROM messages 
  WHERE NOT user_exists_and_active(sender_id);
  
  -- Clean up message status where user no longer exists
  DELETE FROM message_status 
  WHERE NOT user_exists_and_active(user_id);
  
  -- Clean up connection metrics
  PERFORM cleanup_orphaned_connection_metrics();
  
  -- Clean up user profiles for deleted auth users
  DELETE FROM user_profiles 
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = user_profiles.id
  );
  
  -- Clean up user sessions for deleted auth users
  DELETE FROM user_sessions 
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = user_sessions.user_id
  );
  
  -- Clean up password reset tokens for deleted auth users
  DELETE FROM password_reset_tokens 
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = password_reset_tokens.user_id
  );
  
  -- Clean up user agreements for deleted auth users
  DELETE FROM user_agreements 
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = user_agreements.user_id
  );
  
  RAISE NOTICE 'Cleanup completed for deleted user data';
END;
$$;

-- Run initial cleanup
SELECT cleanup_deleted_user_data();