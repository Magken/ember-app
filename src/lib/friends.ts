import { supabase } from './supabase';

export interface FriendRequest {
  request_id: string;
  sender_id: string;
  receiver_id: string;
  sender_nickname: string;
  receiver_nickname: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  created_at: string;
  request_type: 'incoming' | 'outgoing';
}

export interface Friend {
  friend_id: string;
  friend_nickname: string;
  friend_unique_code: string;
  connection_strength: number;
  last_interaction_at: string;
  friendship_created_at: string;
}

export interface FlameData {
  id: string;
  x: number;
  y: number;
  strength: number;
  size?: number;
  name?: string;
}

// Real-time subscription manager with enhanced callbacks
class FriendsSubscriptionManager {
  private static instance: FriendsSubscriptionManager;
  private subscriptions: { [key: string]: any } = {};
  private listeners: { [key: string]: ((data: any) => void)[] } = {};

  static getInstance(): FriendsSubscriptionManager {
    if (!FriendsSubscriptionManager.instance) {
      FriendsSubscriptionManager.instance = new FriendsSubscriptionManager();
    }
    return FriendsSubscriptionManager.instance;
  }

  subscribe(table: string, callback: (data: any) => void) {
    // Add listener
    if (!this.listeners[table]) {
      this.listeners[table] = [];
    }
    this.listeners[table].push(callback);

    // Create subscription if it doesn't exist
    if (!this.subscriptions[table]) {
      console.log(`Creating real-time subscription for ${table}`);
      
      this.subscriptions[table] = supabase
        .channel(`${table}_changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table
          },
          (payload) => {
            console.log(`Real-time update for ${table}:`, payload);
            // Notify all listeners
            this.listeners[table]?.forEach(listener => {
              try {
                listener(payload);
              } catch (error) {
                console.error(`Error in ${table} listener:`, error);
              }
            });
          }
        )
        .subscribe((status) => {
          console.log(`Subscription status for ${table}:`, status);
        });
    }

    // Return unsubscribe function
    return () => {
      if (this.listeners[table]) {
        this.listeners[table] = this.listeners[table].filter(l => l !== callback);
        
        // If no more listeners, remove subscription
        if (this.listeners[table].length === 0) {
          console.log(`Removing subscription for ${table}`);
          this.subscriptions[table]?.unsubscribe();
          delete this.subscriptions[table];
          delete this.listeners[table];
        }
      }
    };
  }

  cleanup() {
    console.log('Cleaning up all friend subscriptions');
    Object.values(this.subscriptions).forEach(subscription => {
      subscription?.unsubscribe();
    });
    this.subscriptions = {};
    this.listeners = {};
  }
}

export const friendsSubscriptionManager = FriendsSubscriptionManager.getInstance();

// Check if a unique code exists and can be added
export const checkUniqueCodeExists = async (uniqueCode: string) => {
  try {
    console.log('Checking unique code:', uniqueCode);
    
    const { data, error } = await supabase.rpc('check_unique_code_exists', {
      code_to_check: uniqueCode.trim().toUpperCase()
    });

    if (error) {
      console.error('Check unique code error:', error);
      throw error;
    }

    console.log('Unique code check result:', data);
    return { data, error: null };
  } catch (error: any) {
    console.error('Check unique code error:', error);
    return { data: null, error };
  }
};

// Send a friend request using unique code with automatic refresh trigger
export const sendFriendRequest = async (uniqueCode: string, message?: string) => {
  try {
    console.log('Sending friend request to:', uniqueCode);
    
    const { data, error } = await supabase.rpc('send_friend_request_by_code', {
      target_unique_code: uniqueCode.trim().toUpperCase(),
      message_text: message || null
    });

    if (error) {
      console.error('Friend request RPC error:', error);
      throw new Error(error.message || 'Failed to send friend request');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to send friend request');
    }

    console.log('Friend request sent successfully:', data);
    
    // Trigger automatic refresh for sender's outgoing requests
    setTimeout(() => {
      console.log('Triggering sender refresh after friend request sent');
      window.dispatchEvent(new CustomEvent('friendRequestSent'));
    }, 500);
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Send friend request error:', error);
    return { data: null, error };
  }
};

// Respond to a friend request (accept or decline) with automatic refresh trigger
export const respondToFriendRequest = async (requestId: string, response: 'accepted' | 'declined') => {
  try {
    console.log('Responding to friend request:', requestId, response);
    
    const { data, error } = await supabase.rpc('respond_to_friend_request', {
      request_id: requestId,
      response: response
    });

    if (error) {
      console.error('Friend request response error:', error);
      throw new Error(error.message || 'Failed to respond to friend request');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to respond to friend request');
    }

    console.log('Friend request response successful:', data);
    
    // Trigger automatic refresh for receiver when accepting/declining
    setTimeout(() => {
      console.log('Triggering receiver refresh after friend request response');
      window.dispatchEvent(new CustomEvent('friendRequestResponded', { 
        detail: { response, accepted: response === 'accepted' } 
      }));
    }, 500);
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Respond to friend request error:', error);
    return { data: null, error };
  }
};

// Get all friend requests (incoming and outgoing)
export const getFriendRequests = async (): Promise<{ data: FriendRequest[] | null; error: any }> => {
  try {
    console.log('Fetching friend requests...');
    
    const { data, error } = await supabase.rpc('get_friend_requests');

    if (error) {
      console.error('Get friend requests error:', error);
      throw new Error(error.message || 'Failed to fetch friend requests');
    }

    console.log('Friend requests fetched:', data?.length || 0);
    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Get friend requests error:', error);
    return { data: null, error };
  }
};

// Get all friends with connection strength
export const getFriends = async (): Promise<{ data: Friend[] | null; error: any }> => {
  try {
    console.log('Fetching friends...');
    
    const { data, error } = await supabase.rpc('get_user_friends');

    if (error) {
      console.error('Get friends error:', error);
      throw new Error(error.message || 'Failed to fetch friends');
    }

    console.log('Friends fetched:', data?.length || 0);
    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Get friends error:', error);
    return { data: null, error };
  }
};

// Convert friends to flame data for the hearth
export const convertFriendsToFlames = (friends: Friend[]): FlameData[] => {
  if (!friends || friends.length === 0) {
    return [];
  }

  // Generate positions in a spiral pattern to avoid overlap
  const flames: FlameData[] = [];
  const centerX = 50;
  const centerY = 50;
  const minDistance = 15; // Minimum distance between flames
  
  friends.forEach((friend, index) => {
    let x, y;
    let attempts = 0;
    const maxAttempts = 50;
    
    do {
      // Use spiral pattern with some randomness
      const angle = (index * 2.4) + (Math.random() - 0.5) * 0.8; // Golden angle with variation
      const radius = Math.sqrt(index + 1) * 8 + Math.random() * 10;
      
      x = centerX + Math.cos(angle) * radius;
      y = centerY + Math.sin(angle) * radius;
      
      // Keep within bounds
      x = Math.max(10, Math.min(90, x));
      y = Math.max(10, Math.min(90, y));
      
      attempts++;
    } while (attempts < maxAttempts && flames.some(flame => {
      const distance = Math.sqrt(Math.pow(flame.x - x, 2) + Math.pow(flame.y - y, 2));
      return distance < minDistance;
    }));
    
    // Calculate size based on connection strength
    const baseSize = 40;
    const maxSize = 80;
    const size = baseSize + (friend.connection_strength * (maxSize - baseSize));
    
    flames.push({
      id: friend.friend_id,
      x,
      y,
      strength: friend.connection_strength,
      size: Math.round(size),
      name: friend.friend_nickname
    });
  });
  
  return flames;
};

// Update friendship interaction (for when users interact)
export const updateFriendshipInteraction = async (friendUserId: string, interactionType: string = 'activity') => {
  try {
    console.log('Updating friendship interaction:', friendUserId, interactionType);
    
    const { data, error } = await supabase.rpc('update_friendship_interaction', {
      friend_user_id: friendUserId,
      interaction_type_param: interactionType
    });

    if (error) {
      console.error('Update friendship interaction error:', error);
      throw new Error(error.message || 'Failed to update interaction');
    }

    console.log('Friendship interaction updated:', data);
    return { data, error: null };
  } catch (error: any) {
    console.error('Update friendship interaction error:', error);
    return { data: null, error };
  }
};

// Helper function to format time ago
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}mo ago`;
};

// Validate unique code format
export const validateUniqueCode = (code: string): boolean => {
  const codeRegex = /^EMBR-[A-Z0-9]{8}$/;
  return codeRegex.test(code.trim().toUpperCase());
};

// Hook for real-time friend requests with enhanced callbacks
export const useFriendRequestsSubscription = (callback: () => void) => {
  const subscriptionManager = friendsSubscriptionManager;
  
  return {
    subscribe: () => {
      const unsubscribe = subscriptionManager.subscribe('friend_requests', callback);
      return unsubscribe;
    },
    cleanup: () => {
      subscriptionManager.cleanup();
    }
  };
};

// Hook for real-time friendships with enhanced callbacks
export const useFriendshipsSubscription = (callback: () => void) => {
  const subscriptionManager = friendsSubscriptionManager;
  
  return {
    subscribe: () => {
      const unsubscribe = subscriptionManager.subscribe('friendships', callback);
      return unsubscribe;
    },
    cleanup: () => {
      subscriptionManager.cleanup();
    }
  };
};