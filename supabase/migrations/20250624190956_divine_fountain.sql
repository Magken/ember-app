/*
  # Add Conversation Statistics Function

  1. New Function
    - `get_conversation_statistics` - Calculates message statistics for a conversation
      - Total message count
      - Total character count
      - Total media size in MB
      - Hours since last message
      
  2. Purpose
    - Provides data needed for flame strength calculation
    - Supports the formula for connection strength
*/

-- Function to get conversation statistics for flame strength calculation
CREATE OR REPLACE FUNCTION get_conversation_statistics(
  conversation_id_param uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  message_count integer;
  character_count integer;
  media_size_bytes bigint;
  media_size_mb numeric;
  last_message_time timestamptz;
  hours_since_last_message numeric;
BEGIN
  -- Get the current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  
  -- Verify user has access to this conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id_param
    AND (c.user1_id = current_user_id OR c.user2_id = current_user_id)
  ) THEN
    RETURN jsonb_build_object('error', 'Access denied to this conversation');
  END IF;
  
  -- Get message count
  SELECT COUNT(*) INTO message_count
  FROM messages
  WHERE conversation_id = conversation_id_param;
  
  -- Get total character count from text messages
  SELECT COALESCE(SUM(LENGTH(content)), 0) INTO character_count
  FROM messages
  WHERE conversation_id = conversation_id_param
  AND content IS NOT NULL;
  
  -- Get total media size in bytes
  SELECT COALESCE(SUM(file_size), 0) INTO media_size_bytes
  FROM message_media mm
  JOIN messages m ON mm.message_id = m.id
  WHERE m.conversation_id = conversation_id_param;
  
  -- Convert bytes to MB
  media_size_mb := media_size_bytes::numeric / (1024 * 1024);
  
  -- Get time of last message
  SELECT created_at INTO last_message_time
  FROM messages
  WHERE conversation_id = conversation_id_param
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Calculate hours since last message
  IF last_message_time IS NOT NULL THEN
    hours_since_last_message := EXTRACT(EPOCH FROM (NOW() - last_message_time)) / 3600;
  ELSE
    hours_since_last_message := 24; -- Default to 24 hours if no messages
  END IF;
  
  -- Return statistics as JSON
  RETURN jsonb_build_object(
    'message_count', message_count,
    'character_count', character_count,
    'media_size_mb', media_size_mb,
    'hours_since_last_message', hours_since_last_message,
    'last_message_time', last_message_time
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_conversation_statistics(uuid) TO authenticated;