/*
  # Enhanced Unread Message Counting Functions

  1. New Functions
    - `get_unread_count_for_user` - Direct function to get unread count for a specific user
    - Enhanced `get_user_conversations` - Better unread counting with direct function calls
    - Enhanced `get_conversation_statistics` - Improved statistics for flame strength calculation

  2. Changes
    - Drop existing functions that need signature changes
    - Recreate with improved unread counting logic
    - Add better error handling and security checks
    - Optimize queries for real-time performance

  3. Security
    - All functions use SECURITY DEFINER with proper auth checks
    - Verify user access to conversations before returning data
    - Clean up orphaned data automatically
*/

-- Drop existing functions that need signature changes
DROP FUNCTION IF EXISTS get_user_conversations();
DROP FUNCTION IF EXISTS get_conversation_statistics(UUID);

-- Function to get unread message count for a specific user
CREATE OR REPLACE FUNCTION get_unread_count_for_user(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  unread_count INTEGER := 0;
  conversation_id_var UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Check if target user exists and is active
  IF NOT user_exists_and_active(target_user_id) THEN
    RETURN 0;
  END IF;
  
  -- Get conversation ID between current user and target user
  SELECT id INTO conversation_id_var
  FROM conversations
  WHERE (user1_id = current_user_id AND user2_id = target_user_id)
     OR (user1_id = target_user_id AND user2_id = current_user_id);
  
  -- If no conversation exists, return 0
  IF conversation_id_var IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Count unread messages (messages sent by target user that current user hasn't seen)
  SELECT COUNT(*)::INTEGER INTO unread_count
  FROM messages m
  LEFT JOIN message_status ms ON (m.id = ms.message_id AND ms.user_id = current_user_id)
  WHERE m.conversation_id = conversation_id_var
    AND m.sender_id = target_user_id
    AND (ms.status IS NULL OR ms.status != 'seen');
  
  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Enhanced get_user_conversations function with better unread counting
CREATE OR REPLACE FUNCTION get_user_conversations()
RETURNS TABLE (
  conversation_id UUID,
  other_user_id UUID,
  other_user_nickname TEXT,
  last_message_content TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER,
  last_seen_at TIMESTAMPTZ
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
    c.id as conversation_id,
    CASE 
      WHEN c.user1_id = current_user_id THEN c.user2_id 
      ELSE c.user1_id 
    END as other_user_id,
    up.nickname as other_user_nickname,
    COALESCE(lm.content, '') as last_message_content,
    c.last_message_at,
    -- Use the direct unread count function
    get_unread_count_for_user(
      CASE 
        WHEN c.user1_id = current_user_id THEN c.user2_id 
        ELSE c.user1_id 
      END
    ) as unread_count,
    CASE 
      WHEN c.user1_id = current_user_id THEN c.user1_last_seen_at 
      ELSE c.user2_last_seen_at 
    END as last_seen_at
  FROM conversations c
  JOIN user_profiles up ON (
    CASE 
      WHEN c.user1_id = current_user_id THEN c.user2_id 
      ELSE c.user1_id 
    END = up.id
  )
  LEFT JOIN messages lm ON c.last_message_id = lm.id
  WHERE (c.user1_id = current_user_id OR c.user2_id = current_user_id)
    AND user_exists_and_active(
      CASE 
        WHEN c.user1_id = current_user_id THEN c.user2_id 
        ELSE c.user1_id 
      END
    )
  ORDER BY c.last_message_at DESC;
END;
$$;

-- Enhanced get_conversation_statistics function for flame strength calculation
CREATE OR REPLACE FUNCTION get_conversation_statistics(conversation_id_param UUID)
RETURNS TABLE (
  message_count INTEGER,
  character_count INTEGER,
  media_size_mb DECIMAL,
  hours_since_last_message DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  last_message_time TIMESTAMPTZ;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Verify user has access to this conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = conversation_id_param 
    AND (user1_id = current_user_id OR user2_id = current_user_id)
  ) THEN
    RAISE EXCEPTION 'Access denied to conversation';
  END IF;
  
  -- Get the last message time
  SELECT MAX(created_at) INTO last_message_time
  FROM messages
  WHERE conversation_id = conversation_id_param;
  
  RETURN QUERY
  SELECT 
    COUNT(m.id)::INTEGER as message_count,
    COALESCE(SUM(LENGTH(COALESCE(m.content, '')))::INTEGER, 0) as character_count,
    COALESCE(SUM(mm.file_size)::DECIMAL / (1024 * 1024), 0) as media_size_mb,
    CASE 
      WHEN last_message_time IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (NOW() - last_message_time)) / 3600
      ELSE 
        24 * 30 -- Default to 30 days if no messages
    END as hours_since_last_message
  FROM messages m
  LEFT JOIN message_media mm ON m.id = mm.message_id
  WHERE m.conversation_id = conversation_id_param;
END;
$$;