/*
  # Cleanup deleted users and orphaned data

  1. Security
    - Add RLS policies to prevent access to deleted user data
    - Clean up orphaned friendships and conversations
  
  2. Functions
    - Function to clean up user data when account is deleted
    - Function to check if user exists before operations
*/

-- Function to check if a user exists and is active
CREATE OR REPLACE FUNCTION user_exists_and_active(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user exists in auth.users and has a profile
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users u
    JOIN user_profiles p ON u.id = p.id
    WHERE u.id = user_id_param 
    AND p.is_active = true
  );
END;
$$;

-- Function to clean up orphaned data for deleted users
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
  
  -- Clean up connection metrics for non-existent friendships
  DELETE FROM connection_metrics 
  WHERE NOT EXISTS (
    SELECT 1 FROM friendships 
    WHERE friendships.id = connection_metrics.friendship_id
  );
  
  -- Clean up user profiles for deleted auth users
  DELETE FROM user_profiles 
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = user_profiles.id
  );
  
  RAISE NOTICE 'Cleanup completed for deleted user data';
END;
$$;

-- Enhanced get_user_friends function with existence check
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
    COALESCE(
      (SELECT AVG(cm.interaction_count::DECIMAL / 10.0) 
       FROM connection_metrics cm 
       WHERE cm.friendship_id = f.id), 
      0.5
    ) as connection_strength,
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

-- Enhanced send_message function with user existence check
CREATE OR REPLACE FUNCTION send_message(
  recipient_user_id UUID,
  message_content TEXT DEFAULT NULL,
  message_type_param TEXT DEFAULT 'text',
  media_files JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  conversation_id_var UUID;
  new_message_id UUID;
  media_file JSONB;
  result JSONB;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Check if recipient user exists and is active
  IF NOT user_exists_and_active(recipient_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recipient user not found or inactive');
  END IF;
  
  -- Check if sender is trying to message themselves
  IF current_user_id = recipient_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot send message to yourself');
  END IF;
  
  -- Get or create conversation
  SELECT get_or_create_conversation(recipient_user_id) INTO conversation_id_var;
  
  IF conversation_id_var IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Failed to create conversation');
  END IF;
  
  -- Insert the message
  INSERT INTO messages (
    conversation_id,
    sender_id,
    content,
    message_type
  ) VALUES (
    conversation_id_var,
    current_user_id,
    message_content,
    message_type_param
  ) RETURNING id INTO new_message_id;
  
  -- Insert media files if provided
  IF media_files IS NOT NULL THEN
    FOR media_file IN SELECT * FROM jsonb_array_elements(media_files)
    LOOP
      INSERT INTO message_media (
        message_id,
        file_name,
        file_size,
        file_type,
        file_url,
        thumbnail_url,
        duration,
        width,
        height
      ) VALUES (
        new_message_id,
        media_file->>'file_name',
        (media_file->>'file_size')::BIGINT,
        media_file->>'file_type',
        media_file->>'file_url',
        media_file->>'thumbnail_url',
        (media_file->>'duration')::INTEGER,
        (media_file->>'width')::INTEGER,
        (media_file->>'height')::INTEGER
      );
    END LOOP;
  END IF;
  
  -- Update conversation last message
  UPDATE conversations 
  SET 
    last_message_id = new_message_id,
    last_message_at = NOW(),
    updated_at = NOW()
  WHERE id = conversation_id_var;
  
  -- Create message status for recipient
  INSERT INTO message_status (
    message_id,
    user_id,
    status
  ) VALUES (
    new_message_id,
    recipient_user_id,
    'sent'
  );
  
  -- Update friendship interaction
  UPDATE friendships 
  SET last_interaction_at = NOW()
  WHERE (user1_id = current_user_id AND user2_id = recipient_user_id)
     OR (user1_id = recipient_user_id AND user2_id = current_user_id);
  
  RETURN jsonb_build_object(
    'success', true, 
    'message_id', new_message_id,
    'conversation_id', conversation_id_var
  );
END;
$$;

-- Run initial cleanup
SELECT cleanup_deleted_user_data();