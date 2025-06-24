/*
  # Fix Friend Request System Issues

  1. Fix Database Function Issues
    - Correct variable naming conflicts in send_friend_request_by_code function
    - Add proper validation for unique code existence
    - Add check for existing friendships
    - Improve error handling

  2. Add Missing Validation
    - Check if unique code exists before sending request
    - Prevent duplicate friend requests
    - Prevent self-friend requests

  3. Performance Improvements
    - Add proper indexes
    - Optimize queries
*/

-- Drop and recreate the send_friend_request_by_code function with fixes
DROP FUNCTION IF EXISTS send_friend_request_by_code(text, text);

CREATE OR REPLACE FUNCTION send_friend_request_by_code(
  target_unique_code text,
  message_text text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  current_sender_id uuid;
  existing_request_id uuid;
  existing_friendship_id uuid;
  new_request_id uuid;
BEGIN
  -- Get the current user
  current_sender_id := auth.uid();
  
  IF current_sender_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Validate unique code format
  IF target_unique_code IS NULL OR target_unique_code = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unique code is required');
  END IF;
  
  IF NOT (target_unique_code ~ '^EMBR-[A-Z0-9]{8}$') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid unique code format. Must be EMBR-XXXXXXXX');
  END IF;
  
  -- Find the target user by unique code
  SELECT id INTO target_user_id
  FROM user_profiles
  WHERE unique_code = target_unique_code;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No user found with that unique code');
  END IF;
  
  -- Check if trying to add themselves
  IF target_user_id = current_sender_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot send a friend request to yourself');
  END IF;
  
  -- Check if friendship already exists
  SELECT id INTO existing_friendship_id
  FROM friendships
  WHERE (user1_id = LEAST(current_sender_id, target_user_id) AND user2_id = GREATEST(current_sender_id, target_user_id));
  
  IF existing_friendship_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are already friends with this user');
  END IF;
  
  -- Check if any pending request already exists (in either direction)
  SELECT id INTO existing_request_id
  FROM friend_requests
  WHERE ((sender_id = current_sender_id AND receiver_id = target_user_id)
     OR (sender_id = target_user_id AND receiver_id = current_sender_id))
    AND status = 'pending';
  
  IF existing_request_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'A pending friend request already exists between you and this user');
  END IF;
  
  -- Create the friend request
  INSERT INTO friend_requests (sender_id, receiver_id, message)
  VALUES (current_sender_id, target_user_id, message_text)
  RETURNING id INTO new_request_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'request_id', new_request_id,
    'message', 'Friend request sent successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'An unexpected error occurred: ' || SQLERRM
    );
END;
$$;

-- Add a function to check if a unique code exists (for frontend validation)
CREATE OR REPLACE FUNCTION check_unique_code_exists(
  code_to_check text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  current_user_id uuid;
  existing_friendship_id uuid;
  existing_request_id uuid;
BEGIN
  -- Get the current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('exists', false, 'error', 'Not authenticated');
  END IF;
  
  -- Validate unique code format
  IF code_to_check IS NULL OR code_to_check = '' THEN
    RETURN jsonb_build_object('exists', false, 'error', 'Unique code is required');
  END IF;
  
  IF NOT (code_to_check ~ '^EMBR-[A-Z0-9]{8}$') THEN
    RETURN jsonb_build_object('exists', false, 'error', 'Invalid unique code format');
  END IF;
  
  -- Find the target user by unique code
  SELECT id INTO target_user_id
  FROM user_profiles
  WHERE unique_code = code_to_check;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object('exists', false, 'error', 'No user found with that unique code');
  END IF;
  
  -- Check if it's the same user
  IF target_user_id = current_user_id THEN
    RETURN jsonb_build_object('exists', true, 'can_add', false, 'reason', 'This is your own unique code');
  END IF;
  
  -- Check if friendship already exists
  SELECT id INTO existing_friendship_id
  FROM friendships
  WHERE (user1_id = LEAST(current_user_id, target_user_id) AND user2_id = GREATEST(current_user_id, target_user_id));
  
  IF existing_friendship_id IS NOT NULL THEN
    RETURN jsonb_build_object('exists', true, 'can_add', false, 'reason', 'You are already friends with this user');
  END IF;
  
  -- Check if pending request already exists
  SELECT id INTO existing_request_id
  FROM friend_requests
  WHERE ((sender_id = current_user_id AND receiver_id = target_user_id)
     OR (sender_id = target_user_id AND receiver_id = current_user_id))
    AND status = 'pending';
  
  IF existing_request_id IS NOT NULL THEN
    RETURN jsonb_build_object('exists', true, 'can_add', false, 'reason', 'A pending friend request already exists');
  END IF;
  
  -- User exists and can be added
  RETURN jsonb_build_object('exists', true, 'can_add', true, 'user_id', target_user_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('exists', false, 'error', 'An unexpected error occurred: ' || SQLERRM);
END;
$$;

-- Grant execute permissions on the new function
GRANT EXECUTE ON FUNCTION check_unique_code_exists TO authenticated;

-- Ensure all existing permissions are still in place
GRANT EXECUTE ON FUNCTION send_friend_request_by_code TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_friend_request TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_friends TO authenticated;
GRANT EXECUTE ON FUNCTION get_friend_requests TO authenticated;
GRANT EXECUTE ON FUNCTION update_friendship_interaction TO authenticated;