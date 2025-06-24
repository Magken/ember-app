/*
  # Fix ambiguous column reference in get_or_create_conversation function

  1. Function Updates
    - Drop and recreate the get_or_create_conversation function
    - Use proper parameter naming to avoid column name conflicts
    - Add table aliases to disambiguate column references
    - Ensure proper ordering of user IDs (user1_id < user2_id)

  2. Security
    - Maintain existing RLS policies
    - Ensure function respects user permissions
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_or_create_conversation(uuid);

-- Create the corrected function with proper parameter naming and table aliases
CREATE OR REPLACE FUNCTION get_or_create_conversation(p_other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_user_id uuid;
    v_conversation_id uuid;
    v_user1_id uuid;
    v_user2_id uuid;
BEGIN
    -- Get the current authenticated user ID
    v_current_user_id := auth.uid();
    
    -- Validate that user is authenticated
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Validate that other user exists and is not the same as current user
    IF p_other_user_id IS NULL OR p_other_user_id = v_current_user_id THEN
        RAISE EXCEPTION 'Invalid other user ID';
    END IF;
    
    -- Ensure proper ordering (user1_id < user2_id)
    IF v_current_user_id < p_other_user_id THEN
        v_user1_id := v_current_user_id;
        v_user2_id := p_other_user_id;
    ELSE
        v_user1_id := p_other_user_id;
        v_user2_id := v_current_user_id;
    END IF;
    
    -- Try to find existing conversation
    SELECT c.id INTO v_conversation_id
    FROM conversations c
    WHERE c.user1_id = v_user1_id 
      AND c.user2_id = v_user2_id;
    
    -- If conversation doesn't exist, create it
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (user1_id, user2_id)
        VALUES (v_user1_id, v_user2_id)
        RETURNING id INTO v_conversation_id;
    END IF;
    
    RETURN v_conversation_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_conversation(uuid) TO authenticated;