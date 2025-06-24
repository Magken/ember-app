/*
  # Friends System for Embr

  1. New Tables
    - `friend_requests` - Friend request management with unique codes
    - `friendships` - Active friendships between users
    - `connection_metrics` - Track connection strength and activity

  2. Security Features
    - Row Level Security (RLS) enabled on all tables
    - Users can only see their own requests and friendships
    - Proper validation for friend request states

  3. Functions
    - Send friend request by unique code
    - Accept/decline friend requests
    - Calculate connection strength based on activity
*/

-- Friend Requests Table
CREATE TABLE IF NOT EXISTS friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Prevent duplicate requests
  UNIQUE(sender_id, receiver_id)
);

-- Friendships Table (for accepted friend requests)
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  last_interaction_at timestamptz DEFAULT now(),
  -- Ensure user1_id < user2_id to prevent duplicates
  CHECK (user1_id < user2_id),
  UNIQUE(user1_id, user2_id)
);

-- Connection Metrics Table (for calculating flame strength)
CREATE TABLE IF NOT EXISTS connection_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id uuid NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type text NOT NULL CHECK (interaction_type IN ('message', 'call', 'activity')),
  interaction_count integer DEFAULT 1,
  last_interaction_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(friendship_id, user_id, interaction_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON friendships(user1_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON friendships(user2_id);
CREATE INDEX IF NOT EXISTS idx_connection_metrics_friendship ON connection_metrics(friendship_id);

-- Enable Row Level Security
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friend_requests
CREATE POLICY "Users can view their own friend requests" ON friend_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests" ON friend_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received requests" ON friend_requests
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- RLS Policies for friendships
CREATE POLICY "Users can view their friendships" ON friendships
  FOR SELECT TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can create friendships" ON friendships
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their friendships" ON friendships
  FOR UPDATE TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for connection_metrics
CREATE POLICY "Users can view their connection metrics" ON connection_metrics
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their connection metrics" ON connection_metrics
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their connection metrics" ON connection_metrics
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to send friend request by unique code
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
  sender_id uuid;
  existing_request_id uuid;
  existing_friendship_id uuid;
  request_id uuid;
BEGIN
  -- Get the current user
  sender_id := auth.uid();
  
  IF sender_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Find the target user by unique code
  SELECT id INTO target_user_id
  FROM user_profiles
  WHERE unique_code = target_unique_code;
  
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found with that unique code');
  END IF;
  
  -- Check if trying to add themselves
  IF target_user_id = sender_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot send a friend request to yourself');
  END IF;
  
  -- Check if friendship already exists
  SELECT id INTO existing_friendship_id
  FROM friendships
  WHERE (user1_id = LEAST(sender_id, target_user_id) AND user2_id = GREATEST(sender_id, target_user_id));
  
  IF existing_friendship_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are already friends with this user');
  END IF;
  
  -- Check if request already exists
  SELECT id INTO existing_request_id
  FROM friend_requests
  WHERE (sender_id = sender_id AND receiver_id = target_user_id)
     OR (sender_id = target_user_id AND receiver_id = sender_id);
  
  IF existing_request_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'A friend request already exists between you and this user');
  END IF;
  
  -- Create the friend request
  INSERT INTO friend_requests (sender_id, receiver_id, message)
  VALUES (sender_id, target_user_id, message_text)
  RETURNING id INTO request_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'request_id', request_id,
    'message', 'Friend request sent successfully'
  );
END;
$$;

-- Function to respond to friend request
CREATE OR REPLACE FUNCTION respond_to_friend_request(
  request_id uuid,
  response text -- 'accepted' or 'declined'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  request_record friend_requests%ROWTYPE;
  friendship_id uuid;
BEGIN
  -- Get the current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Validate response
  IF response NOT IN ('accepted', 'declined') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid response. Must be "accepted" or "declined"');
  END IF;
  
  -- Get the friend request
  SELECT * INTO request_record
  FROM friend_requests
  WHERE id = request_id AND receiver_id = current_user_id AND status = 'pending';
  
  IF request_record.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Friend request not found or you are not authorized to respond');
  END IF;
  
  -- Update the request status
  UPDATE friend_requests
  SET status = response, updated_at = now()
  WHERE id = request_id;
  
  -- If accepted, create friendship
  IF response = 'accepted' THEN
    INSERT INTO friendships (user1_id, user2_id)
    VALUES (
      LEAST(request_record.sender_id, request_record.receiver_id),
      GREATEST(request_record.sender_id, request_record.receiver_id)
    )
    RETURNING id INTO friendship_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'friendship_id', friendship_id,
      'message', 'Friend request accepted and friendship created'
    );
  ELSE
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Friend request declined'
    );
  END IF;
END;
$$;

-- Function to get user's friends with connection strength
CREATE OR REPLACE FUNCTION get_user_friends()
RETURNS TABLE (
  friend_id uuid,
  friend_nickname text,
  friend_unique_code text,
  connection_strength decimal,
  last_interaction_at timestamptz,
  friendship_created_at timestamptz
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
    CASE 
      WHEN f.user1_id = current_user_id THEN f.user2_id 
      ELSE f.user1_id 
    END as friend_id,
    up.nickname as friend_nickname,
    up.unique_code as friend_unique_code,
    -- Calculate connection strength (0.1 to 1.0 based on recent activity)
    GREATEST(0.1, LEAST(1.0, 
      0.3 + (
        EXTRACT(EPOCH FROM (now() - f.last_interaction_at)) / 
        EXTRACT(EPOCH FROM INTERVAL '30 days')
      ) * -0.7
    ))::decimal as connection_strength,
    f.last_interaction_at,
    f.created_at as friendship_created_at
  FROM friendships f
  JOIN user_profiles up ON (
    CASE 
      WHEN f.user1_id = current_user_id THEN f.user2_id 
      ELSE f.user1_id 
    END = up.id
  )
  WHERE f.user1_id = current_user_id OR f.user2_id = current_user_id
  ORDER BY f.last_interaction_at DESC;
END;
$$;

-- Function to get pending friend requests
CREATE OR REPLACE FUNCTION get_friend_requests()
RETURNS TABLE (
  request_id uuid,
  sender_id uuid,
  receiver_id uuid,
  sender_nickname text,
  receiver_nickname text,
  status text,
  message text,
  created_at timestamptz,
  request_type text -- 'incoming' or 'outgoing'
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
  -- Incoming requests
  SELECT 
    fr.id as request_id,
    fr.sender_id,
    fr.receiver_id,
    up_sender.nickname as sender_nickname,
    up_receiver.nickname as receiver_nickname,
    fr.status,
    fr.message,
    fr.created_at,
    'incoming'::text as request_type
  FROM friend_requests fr
  JOIN user_profiles up_sender ON fr.sender_id = up_sender.id
  JOIN user_profiles up_receiver ON fr.receiver_id = up_receiver.id
  WHERE fr.receiver_id = current_user_id
  
  UNION ALL
  
  -- Outgoing requests
  SELECT 
    fr.id as request_id,
    fr.sender_id,
    fr.receiver_id,
    up_sender.nickname as sender_nickname,
    up_receiver.nickname as receiver_nickname,
    fr.status,
    fr.message,
    fr.created_at,
    'outgoing'::text as request_type
  FROM friend_requests fr
  JOIN user_profiles up_sender ON fr.sender_id = up_sender.id
  JOIN user_profiles up_receiver ON fr.receiver_id = up_receiver.id
  WHERE fr.sender_id = current_user_id
  
  ORDER BY created_at DESC;
END;
$$;

-- Function to update friendship interaction
CREATE OR REPLACE FUNCTION update_friendship_interaction(
  friend_user_id uuid,
  interaction_type_param text DEFAULT 'activity'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  friendship_record friendships%ROWTYPE;
BEGIN
  -- Get the current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Find the friendship
  SELECT * INTO friendship_record
  FROM friendships
  WHERE (user1_id = LEAST(current_user_id, friend_user_id) AND user2_id = GREATEST(current_user_id, friend_user_id));
  
  IF friendship_record.id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update friendship last interaction
  UPDATE friendships
  SET last_interaction_at = now()
  WHERE id = friendship_record.id;
  
  -- Update or insert connection metrics
  INSERT INTO connection_metrics (friendship_id, user_id, interaction_type, interaction_count, last_interaction_at)
  VALUES (friendship_record.id, current_user_id, interaction_type_param, 1, now())
  ON CONFLICT (friendship_id, user_id, interaction_type)
  DO UPDATE SET 
    interaction_count = connection_metrics.interaction_count + 1,
    last_interaction_at = now();
  
  RETURN true;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION send_friend_request_by_code TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_friend_request TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_friends TO authenticated;
GRANT EXECUTE ON FUNCTION get_friend_requests TO authenticated;
GRANT EXECUTE ON FUNCTION update_friendship_interaction TO authenticated;