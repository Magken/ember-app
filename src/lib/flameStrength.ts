import { supabase } from './supabase';

// Constants for the formula
const M_REF = 20; // Message saturation constant
const C_REF = 2000; // Character saturation constant
const MEDIA_CAP_MB = 50; // Media cap in MB
const HALF_LIFE = 24; // Hours for freshness score to halve

// Interface for message data
interface MessageData {
  message_count: number;
  character_count: number;
  media_size_mb: number;
  hours_since_last_message: number;
}

/**
 * Calculate the connection strength between the current user and a friend
 * using the specified formula
 */
export const calculateFlameStrength = async (friendId: string): Promise<number> => {
  try {
    // Get message data for the conversation with this friend
    const messageData = await getMessageData(friendId);
    
    if (!messageData) {
      console.log(`No message data found for friend ${friendId}, using default strength`);
      return 0.5; // Default medium strength if no data
    }
    
    // Calculate the strength components
    const strength = calculateStrengthFromData(messageData);
    
    console.log(`Calculated strength for ${friendId}:`, strength);
    return strength;
  } catch (error) {
    console.error('Error calculating flame strength:', error);
    return 0.5; // Default medium strength on error
  }
};

/**
 * Get message data for the conversation with a specific friend
 */
const getMessageData = async (friendId: string): Promise<MessageData | null> => {
  try {
    // Get the conversation ID
    const { data: conversationId, error: convError } = await supabase.rpc('get_or_create_conversation', {
      p_other_user_id: friendId
    });
    
    if (convError || !conversationId) {
      console.error('Error getting conversation:', convError);
      return null;
    }
    
    // Get message statistics for this conversation
    const { data, error } = await supabase.rpc('get_conversation_statistics', {
      conversation_id_param: conversationId
    });
    
    if (error || !data) {
      console.error('Error getting conversation statistics:', error);
      return null;
    }
    
    return {
      message_count: data.message_count || 0,
      character_count: data.character_count || 0,
      media_size_mb: data.media_size_mb || 0,
      hours_since_last_message: data.hours_since_last_message || 0
    };
  } catch (error) {
    console.error('Error getting message data:', error);
    return null;
  }
};

/**
 * Calculate the strength score based on the formula
 */
const calculateStrengthFromData = (data: MessageData): number => {
  // Extract variables from data
  const m1 = Math.floor(data.message_count / 2); // Approximate split between users
  const m2 = data.message_count - m1;
  const chars1 = Math.floor(data.character_count / 2); // Approximate split between users
  const chars2 = data.character_count - chars1;
  const size_mb = data.media_size_mb;
  const t_h = data.hours_since_last_message;
  
  // Calculate S_count (message count score)
  const S_count = (Math.min(m1 / M_REF, 1) + Math.min(m2 / M_REF, 1)) / 2;
  
  // Calculate S_char (character count score)
  const S_char = (Math.min(chars1 / C_REF, 1) + Math.min(chars2 / C_REF, 1)) / 2;
  
  // Calculate S_msg_raw (raw messaging score)
  const S_msg_raw = 0.5 * S_count + 0.5 * S_char;
  
  // Calculate silence penalty
  const frac = Math.min(t_h / 24, 1);
  const penalty = 0.5 * frac;
  
  // Calculate S_msg (messaging score after decay)
  const S_msg = Math.max(S_msg_raw - penalty, 0);
  
  // Calculate S_media (media contribution)
  const S_media = Math.min(size_mb / MEDIA_CAP_MB, 1);
  
  // Calculate S_time (recency score with exponential decay)
  const S_time = Math.pow(2, -t_h / HALF_LIFE);
  
  // Calculate final strength
  const strength = 0.50 * S_msg + 0.25 * S_media + 0.25 * S_time;
  
  // Ensure strength is between 0.1 and 1.0
  return Math.max(0.1, Math.min(1.0, strength));
};

/**
 * Simulate the calculation with sample data (for testing)
 */
export const simulateStrengthCalculation = (
  m1: number, 
  m2: number, 
  chars1: number, 
  chars2: number, 
  size_mb: number, 
  t_h: number
): number => {
  // Calculate S_count (message count score)
  const S_count = (Math.min(m1 / M_REF, 1) + Math.min(m2 / M_REF, 1)) / 2;
  
  // Calculate S_char (character count score)
  const S_char = (Math.min(chars1 / C_REF, 1) + Math.min(chars2 / C_REF, 1)) / 2;
  
  // Calculate S_msg_raw (raw messaging score)
  const S_msg_raw = 0.5 * S_count + 0.5 * S_char;
  
  // Calculate silence penalty
  const frac = Math.min(t_h / 24, 1);
  const penalty = 0.5 * frac;
  
  // Calculate S_msg (messaging score after decay)
  const S_msg = Math.max(S_msg_raw - penalty, 0);
  
  // Calculate S_media (media contribution)
  const S_media = Math.min(size_mb / MEDIA_CAP_MB, 1);
  
  // Calculate S_time (recency score with exponential decay)
  const S_time = Math.pow(2, -t_h / HALF_LIFE);
  
  // Calculate final strength
  const strength = 0.50 * S_msg + 0.25 * S_media + 0.25 * S_time;
  
  // Ensure strength is between 0.1 and 1.0
  return Math.max(0.1, Math.min(1.0, strength));
};