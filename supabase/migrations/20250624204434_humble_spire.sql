-- Function to completely clean up a user account and all associated data
CREATE OR REPLACE FUNCTION cleanup_user_account(user_id_to_delete UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  cleanup_count INTEGER := 0;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Only allow users to delete their own account
  IF current_user_id IS NULL OR current_user_id != user_id_to_delete THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  -- Check if user exists
  IF NOT user_exists_and_active(user_id_to_delete) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Start cleanup process
  RAISE NOTICE 'Starting cleanup for user: %', user_id_to_delete;
  
  -- Delete friendships where this user is involved
  DELETE FROM friendships 
  WHERE user1_id = user_id_to_delete OR user2_id = user_id_to_delete;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % friendships', cleanup_count;
  
  -- Delete friend requests where this user is involved
  DELETE FROM friend_requests 
  WHERE sender_id = user_id_to_delete OR receiver_id = user_id_to_delete;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % friend requests', cleanup_count;
  
  -- Delete conversations where this user is involved
  DELETE FROM conversations 
  WHERE user1_id = user_id_to_delete OR user2_id = user_id_to_delete;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % conversations', cleanup_count;
  
  -- Delete messages sent by this user
  DELETE FROM messages 
  WHERE sender_id = user_id_to_delete;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % messages', cleanup_count;
  
  -- Delete message status records for this user
  DELETE FROM message_status 
  WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % message status records', cleanup_count;
  
  -- Delete connection metrics for this user
  DELETE FROM connection_metrics 
  WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % connection metrics', cleanup_count;
  
  -- Delete user sessions for this user
  DELETE FROM user_sessions 
  WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % user sessions', cleanup_count;
  
  -- Delete password reset tokens for this user
  DELETE FROM password_reset_tokens 
  WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % password reset tokens', cleanup_count;
  
  -- Delete user agreements for this user
  DELETE FROM user_agreements 
  WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % user agreements', cleanup_count;
  
  -- Delete auth attempts for this user's email
  DELETE FROM auth_attempts 
  WHERE email = (SELECT email FROM auth.users WHERE id = user_id_to_delete);
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % auth attempts', cleanup_count;
  
  -- Mark user profile as inactive (don't delete yet, let the trigger handle it)
  UPDATE user_profiles 
  SET 
    is_active = false,
    updated_at = NOW()
  WHERE id = user_id_to_delete;
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  RAISE NOTICE 'Marked % user profiles as inactive', cleanup_count;
  
  RAISE NOTICE 'Account cleanup completed for user: %', user_id_to_delete;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Account cleanup completed successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during account cleanup: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Cleanup failed: ' || SQLERRM
    );
END;
$$;

-- Enhanced user deletion trigger that handles all cascading deletes
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This trigger fires when a user is deleted from auth.users
  -- It ensures all related data is properly cleaned up
  
  RAISE NOTICE 'Handling deletion for user: %', OLD.id;
  
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
  
  -- Delete auth attempts for this user
  DELETE FROM auth_attempts 
  WHERE email = OLD.email;
  
  -- Delete user profile
  DELETE FROM user_profiles 
  WHERE id = OLD.id;
  
  RAISE NOTICE 'Completed deletion cleanup for user: %', OLD.id;
  
  RETURN OLD;
END;
$$;

-- Recreate the trigger to ensure it's using the latest function
DROP TRIGGER IF EXISTS trigger_user_deletion_cleanup ON auth.users;
CREATE TRIGGER trigger_user_deletion_cleanup
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deletion();

-- Function to safely delete a user account (admin function)
CREATE OR REPLACE FUNCTION admin_delete_user_account(user_id_to_delete UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function can only be called by service role
  -- It completely removes a user from the system
  
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id_to_delete) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Delete the user from auth.users (this will trigger all cleanup)
  DELETE FROM auth.users WHERE id = user_id_to_delete;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'User account deleted successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Deletion failed: ' || SQLERRM
    );
END;
$$;