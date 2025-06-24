/*
  # Live Messaging System

  1. New Tables
    - `conversations` - Chat conversations between users
    - `messages` - Individual messages with media support
    - `message_media` - Media files attached to messages
    - `message_status` - Read/delivery status tracking

  2. Features
    - Real-time messaging with Supabase realtime
    - Media support (text, audio, images, GIFs, video, voice recordings)
    - Message status tracking (sent, delivered, seen)
    - Conversation management
    - Unread message indicators

  3. Security
    - Row Level Security (RLS) enabled on all tables
    - Users can only access their own conversations and messages
    - Media files are properly secured
*/

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_id uuid,
  last_message_at timestamptz DEFAULT now(),
  user1_last_seen_at timestamptz DEFAULT now(),
  user2_last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Ensure user1_id < user2_id to prevent duplicates
  CHECK (user1_id < user2_id),
  UNIQUE(user1_id, user2_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'gif', 'audio', 'video', 'voice')),
  reply_to_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  edited_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Message Media Table (for file attachments)
CREATE TABLE IF NOT EXISTS message_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  file_url text NOT NULL,
  thumbnail_url text,
  duration integer, -- For audio/video files (in seconds)
  width integer, -- For images/videos
  height integer, -- For images/videos
  created_at timestamptz DEFAULT now()
);

-- Message Status Table (for read receipts)
CREATE TABLE IF NOT EXISTS message_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'seen')),
  status_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_media_message ON message_media(message_id);
CREATE INDEX IF NOT EXISTS idx_message_status_message ON message_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_status_user ON message_status(user_id);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = conversation_id 
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = conversation_id 
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for message_media
CREATE POLICY "Users can view media in their conversations" ON message_media
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_id 
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can add media to their messages" ON message_media
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_id 
      AND m.sender_id = auth.uid()
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- RLS Policies for message_status
CREATE POLICY "Users can view message status in their conversations" ON message_status
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_id 
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update message status" ON message_status
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  other_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  conversation_id uuid;
  user1_id uuid;
  user2_id uuid;
BEGIN
  -- Get the current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF current_user_id = other_user_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;
  
  -- Ensure user1_id < user2_id for consistency
  IF current_user_id < other_user_id THEN
    user1_id := current_user_id;
    user2_id := other_user_id;
  ELSE
    user1_id := other_user_id;
    user2_id := current_user_id;
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE user1_id = user1_id AND user2_id = user2_id;
  
  -- Create conversation if it doesn't exist
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (user1_id, user2_id)
    VALUES (user1_id, user2_id)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$;

-- Function to send a message
CREATE OR REPLACE FUNCTION send_message(
  recipient_user_id uuid,
  message_content text DEFAULT NULL,
  message_type_param text DEFAULT 'text',
  media_files jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  conversation_id uuid;
  new_message_id uuid;
  media_file jsonb;
  media_id uuid;
BEGIN
  -- Get the current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Validate that users are friends
  IF NOT EXISTS (
    SELECT 1 FROM friendships f
    WHERE (f.user1_id = LEAST(current_user_id, recipient_user_id) 
           AND f.user2_id = GREATEST(current_user_id, recipient_user_id))
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You can only message friends');
  END IF;
  
  -- Get or create conversation
  conversation_id := get_or_create_conversation(recipient_user_id);
  
  -- Create the message
  INSERT INTO messages (conversation_id, sender_id, content, message_type)
  VALUES (conversation_id, current_user_id, message_content, message_type_param)
  RETURNING id INTO new_message_id;
  
  -- Add media files if provided
  IF media_files IS NOT NULL THEN
    FOR media_file IN SELECT * FROM jsonb_array_elements(media_files)
    LOOP
      INSERT INTO message_media (
        message_id, file_name, file_size, file_type, file_url, 
        thumbnail_url, duration, width, height
      )
      VALUES (
        new_message_id,
        media_file->>'file_name',
        (media_file->>'file_size')::bigint,
        media_file->>'file_type',
        media_file->>'file_url',
        media_file->>'thumbnail_url',
        (media_file->>'duration')::integer,
        (media_file->>'width')::integer,
        (media_file->>'height')::integer
      );
    END LOOP;
  END IF;
  
  -- Update conversation last message
  UPDATE conversations
  SET last_message_id = new_message_id,
      last_message_at = now(),
      updated_at = now()
  WHERE id = conversation_id;
  
  -- Create message status for sender (sent)
  INSERT INTO message_status (message_id, user_id, status)
  VALUES (new_message_id, current_user_id, 'sent');
  
  -- Create message status for recipient (delivered)
  INSERT INTO message_status (message_id, user_id, status)
  VALUES (new_message_id, recipient_user_id, 'delivered');
  
  RETURN jsonb_build_object(
    'success', true,
    'message_id', new_message_id,
    'conversation_id', conversation_id
  );
END;
$$;

-- Function to mark messages as seen
CREATE OR REPLACE FUNCTION mark_messages_as_seen(
  conversation_id_param uuid,
  up_to_message_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verify user has access to this conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id_param
    AND (c.user1_id = current_user_id OR c.user2_id = current_user_id)
  ) THEN
    RETURN false;
  END IF;
  
  -- Update message status to seen for messages not sent by current user
  UPDATE message_status
  SET status = 'seen', status_at = now()
  WHERE message_id IN (
    SELECT m.id FROM messages m
    WHERE m.conversation_id = conversation_id_param
    AND m.sender_id != current_user_id
    AND (up_to_message_id IS NULL OR m.created_at <= (
      SELECT created_at FROM messages WHERE id = up_to_message_id
    ))
  )
  AND user_id = current_user_id
  AND status != 'seen';
  
  -- Update conversation last seen
  UPDATE conversations
  SET user1_last_seen_at = CASE WHEN user1_id = current_user_id THEN now() ELSE user1_last_seen_at END,
      user2_last_seen_at = CASE WHEN user2_id = current_user_id THEN now() ELSE user2_last_seen_at END
  WHERE id = conversation_id_param;
  
  RETURN true;
END;
$$;

-- Function to get conversation messages
CREATE OR REPLACE FUNCTION get_conversation_messages(
  conversation_id_param uuid,
  limit_param integer DEFAULT 50,
  offset_param integer DEFAULT 0
)
RETURNS TABLE (
  message_id uuid,
  sender_id uuid,
  sender_nickname text,
  content text,
  message_type text,
  created_at timestamptz,
  edited_at timestamptz,
  media_files jsonb,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Verify user has access to this conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id_param
    AND (c.user1_id = current_user_id OR c.user2_id = current_user_id)
  ) THEN
    RAISE EXCEPTION 'Access denied to this conversation';
  END IF;
  
  RETURN QUERY
  SELECT 
    m.id as message_id,
    m.sender_id,
    up.nickname as sender_nickname,
    m.content,
    m.message_type,
    m.created_at,
    m.edited_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', mm.id,
          'file_name', mm.file_name,
          'file_size', mm.file_size,
          'file_type', mm.file_type,
          'file_url', mm.file_url,
          'thumbnail_url', mm.thumbnail_url,
          'duration', mm.duration,
          'width', mm.width,
          'height', mm.height
        )
      ) FILTER (WHERE mm.id IS NOT NULL),
      '[]'::jsonb
    ) as media_files,
    COALESCE(ms.status, 'sent') as status
  FROM messages m
  JOIN user_profiles up ON m.sender_id = up.id
  LEFT JOIN message_media mm ON m.id = mm.message_id
  LEFT JOIN message_status ms ON m.id = ms.message_id AND ms.user_id = current_user_id
  WHERE m.conversation_id = conversation_id_param
  GROUP BY m.id, m.sender_id, up.nickname, m.content, m.message_type, m.created_at, m.edited_at, ms.status
  ORDER BY m.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

-- Function to get user conversations with unread counts
CREATE OR REPLACE FUNCTION get_user_conversations()
RETURNS TABLE (
  conversation_id uuid,
  other_user_id uuid,
  other_user_nickname text,
  last_message_content text,
  last_message_at timestamptz,
  unread_count bigint,
  last_seen_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  RETURN QUERY
  SELECT 
    c.id as conversation_id,
    CASE 
      WHEN c.user1_id = current_user_id THEN c.user2_id 
      ELSE c.user1_id 
    END as other_user_id,
    up.nickname as other_user_nickname,
    lm.content as last_message_content,
    c.last_message_at,
    COALESCE(unread.count, 0) as unread_count,
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
  LEFT JOIN (
    SELECT 
      m.conversation_id,
      COUNT(*) as count
    FROM messages m
    JOIN message_status ms ON m.id = ms.message_id
    WHERE ms.user_id = current_user_id
    AND ms.status != 'seen'
    AND m.sender_id != current_user_id
    GROUP BY m.conversation_id
  ) unread ON c.id = unread.conversation_id
  WHERE c.user1_id = current_user_id OR c.user2_id = current_user_id
  ORDER BY c.last_message_at DESC;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_or_create_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION send_message TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_seen TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_conversations TO authenticated;

-- Add foreign key constraint for last_message_id after messages table is created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'conversations' AND constraint_name = 'conversations_last_message_id_fkey'
  ) THEN
    ALTER TABLE conversations ADD CONSTRAINT conversations_last_message_id_fkey 
    FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;
  END IF;
END $$;