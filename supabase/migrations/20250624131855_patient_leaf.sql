-- Allow declined friend requests to be sent again by removing the unique constraint
-- that prevents duplicate requests and updating the send function

-- Drop the existing unique constraint that prevents any duplicate requests
ALTER TABLE friend_requests DROP CONSTRAINT IF EXISTS friend_requests_sender_id_receiver_id_key;

-- Update the send_friend_request_by_code function to allow resending to users who declined
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
  existing_pending_request_id uuid;
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
  
  -- Check if PENDING request already exists (in either direction)
  -- This allows resending to users who declined, but prevents spam of pending requests
  SELECT id INTO existing_pending_request_id
  FROM friend_requests
  WHERE ((sender_id = current_sender_id AND receiver_id = target_user_id)
     OR (sender_id = target_user_id AND receiver_id = current_sender_id))
    AND status = 'pending';
  
  IF existing_pending_request_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'A pending friend request already exists between you and this user');
  END IF;
  
  -- Create the friend request (this will now work even if previous requests were declined)
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

-- Update the check_unique_code_exists function to also allow declined requests
DROP FUNCTION IF EXISTS check_unique_code_exists(text);

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
  existing_pending_request_id uuid;
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
  
  -- Check if PENDING request already exists (only block pending, allow declined)
  SELECT id INTO existing_pending_request_id
  FROM friend_requests
  WHERE ((sender_id = current_user_id AND receiver_id = target_user_id)
     OR (sender_id = target_user_id AND receiver_id = current_user_id))
    AND status = 'pending';
  
  IF existing_pending_request_id IS NOT NULL THEN
    RETURN jsonb_build_object('exists', true, 'can_add', false, 'reason', 'A pending friend request already exists');
  END IF;
  
  -- User exists and can be added (even if previous requests were declined)
  RETURN jsonb_build_object('exists', true, 'can_add', true, 'user_id', target_user_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('exists', false, 'error', 'An unexpected error occurred: ' || SQLERRM);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION send_friend_request_by_code TO authenticated;
GRANT EXECUTE ON FUNCTION check_unique_code_exists TO authenticated;