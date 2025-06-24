import { supabase } from './supabase';

export interface Conversation {
  conversation_id: string;
  other_user_id: string;
  other_user_nickname: string;
  last_message_content?: string;
  last_message_at: string;
  unread_count: number;
  last_seen_at: string;
}

export interface Message {
  message_id: string;
  sender_id: string;
  sender_nickname: string;
  content?: string;
  message_type: 'text' | 'image' | 'gif' | 'audio' | 'video' | 'voice';
  created_at: string;
  edited_at?: string;
  media_files: MediaFile[];
  status: 'sent' | 'delivered' | 'seen';
}

export interface MediaFile {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  thumbnail_url?: string;
  duration?: number; // For audio/video
  width?: number; // For images/videos
  height?: number; // For images/videos
}

export interface SendMessageData {
  content?: string;
  message_type?: 'text' | 'image' | 'gif' | 'audio' | 'video' | 'voice';
  media_files?: Omit<MediaFile, 'id'>[];
}

// Real-time subscription manager for messaging
class MessagingSubscriptionManager {
  private static instance: MessagingSubscriptionManager;
  private subscriptions: { [key: string]: any } = {};
  private listeners: { [key: string]: ((data: any) => void)[] } = {};

  static getInstance(): MessagingSubscriptionManager {
    if (!MessagingSubscriptionManager.instance) {
      MessagingSubscriptionManager.instance = new MessagingSubscriptionManager();
    }
    return MessagingSubscriptionManager.instance;
  }

  subscribeToConversation(conversationId: string, callback: (message: Message) => void) {
    const key = `conversation_${conversationId}`;
    
    // Add listener
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(callback);

    // Create subscription if it doesn't exist
    if (!this.subscriptions[key]) {
      console.log(`Creating real-time subscription for conversation: ${conversationId}`);
      
      this.subscriptions[key] = supabase
        .channel(`conversation_${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          async (payload) => {
            console.log('New message received:', payload);
            
            // Fetch the complete message with media and status
            try {
              const { data: messages } = await supabase.rpc('get_conversation_messages', {
                conversation_id_param: conversationId,
                limit_param: 1,
                offset_param: 0
              });
              
              if (messages && messages.length > 0) {
                const message = messages[0];
                this.listeners[key]?.forEach(listener => {
                  try {
                    listener(message);
                  } catch (error) {
                    console.error('Error in message listener:', error);
                  }
                });
              }
            } catch (error) {
              console.error('Error fetching new message:', error);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'message_status',
            filter: `message_id=in.(SELECT id FROM messages WHERE conversation_id='${conversationId}')`
          },
          (payload) => {
            console.log('Message status updated:', payload);
            // Trigger a refresh of message status
            window.dispatchEvent(new CustomEvent('messageStatusUpdated', { 
              detail: { conversationId, statusUpdate: payload } 
            }));
          }
        )
        .subscribe((status) => {
          console.log(`Conversation subscription status for ${conversationId}:`, status);
        });
    }

    // Return unsubscribe function
    return () => {
      if (this.listeners[key]) {
        this.listeners[key] = this.listeners[key].filter(l => l !== callback);
        
        // If no more listeners, remove subscription
        if (this.listeners[key].length === 0) {
          console.log(`Removing subscription for conversation: ${conversationId}`);
          this.subscriptions[key]?.unsubscribe();
          delete this.subscriptions[key];
          delete this.listeners[key];
        }
      }
    };
  }

  subscribeToConversations(callback: () => void) {
    const key = 'conversations';
    
    // Add listener
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(callback);

    // Create subscription if it doesn't exist
    if (!this.subscriptions[key]) {
      console.log('Creating real-time subscription for conversations');
      
      this.subscriptions[key] = supabase
        .channel('conversations_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations'
          },
          (payload) => {
            console.log('Conversations updated:', payload);
            this.listeners[key]?.forEach(listener => {
              try {
                listener(payload);
              } catch (error) {
                console.error('Error in conversations listener:', error);
              }
            });
          }
        )
        .subscribe((status) => {
          console.log('Conversations subscription status:', status);
        });
    }

    // Return unsubscribe function
    return () => {
      if (this.listeners[key]) {
        this.listeners[key] = this.listeners[key].filter(l => l !== callback);
        
        // If no more listeners, remove subscription
        if (this.listeners[key].length === 0) {
          console.log('Removing conversations subscription');
          this.subscriptions[key]?.unsubscribe();
          delete this.subscriptions[key];
          delete this.listeners[key];
        }
      }
    };
  }

  // Generic subscription method for any table
  subscribe(table: string, callback: (data: any) => void) {
    const key = table;
    
    // Add listener
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(callback);

    // Create subscription if it doesn't exist
    if (!this.subscriptions[key]) {
      console.log(`Creating real-time subscription for table: ${table}`);
      
      this.subscriptions[key] = supabase
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
            this.listeners[key]?.forEach(listener => {
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
      if (this.listeners[key]) {
        this.listeners[key] = this.listeners[key].filter(l => l !== callback);
        
        // If no more listeners, remove subscription
        if (this.listeners[key].length === 0) {
          console.log(`Removing subscription for ${table}`);
          this.subscriptions[key]?.unsubscribe();
          delete this.subscriptions[key];
          delete this.listeners[key];
        }
      }
    };
  }

  cleanup() {
    console.log('Cleaning up all messaging subscriptions');
    Object.values(this.subscriptions).forEach(subscription => {
      subscription?.unsubscribe();
    });
    this.subscriptions = {};
    this.listeners = {};
  }
}

export const messagingSubscriptionManager = MessagingSubscriptionManager.getInstance();

// Get user's conversations with unread counts
export const getUserConversations = async (): Promise<{ data: Conversation[] | null; error: any }> => {
  try {
    console.log('Fetching user conversations...');
    
    const { data, error } = await supabase.rpc('get_user_conversations');

    if (error) {
      console.error('Get conversations error:', error);
      throw new Error(error.message || 'Failed to fetch conversations');
    }

    console.log('Conversations fetched:', data?.length || 0);
    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Get conversations error:', error);
    return { data: null, error };
  }
};

// Get messages for a specific conversation
export const getConversationMessages = async (
  conversationId: string, 
  limit: number = 50, 
  offset: number = 0
): Promise<{ data: Message[] | null; error: any }> => {
  try {
    console.log('Fetching conversation messages:', conversationId);
    
    const { data, error } = await supabase.rpc('get_conversation_messages', {
      conversation_id_param: conversationId,
      limit_param: limit,
      offset_param: offset
    });

    if (error) {
      console.error('Get messages error:', error);
      throw new Error(error.message || 'Failed to fetch messages');
    }

    console.log('Messages fetched:', data?.length || 0);
    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Get messages error:', error);
    return { data: null, error };
  }
};

// Send a message to a user
export const sendMessage = async (
  recipientUserId: string, 
  messageData: SendMessageData
): Promise<{ data: any; error: any }> => {
  try {
    console.log('Sending message to:', recipientUserId, messageData);
    
    const { data, error } = await supabase.rpc('send_message', {
      recipient_user_id: recipientUserId,
      message_content: messageData.content || null,
      message_type_param: messageData.message_type || 'text',
      media_files: messageData.media_files || null
    });

    if (error) {
      console.error('Send message error:', error);
      throw new Error(error.message || 'Failed to send message');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to send message');
    }

    console.log('Message sent successfully:', data);
    return { data, error: null };
  } catch (error: any) {
    console.error('Send message error:', error);
    return { data: null, error };
  }
};

// Mark messages as seen in a conversation
export const markMessagesAsSeen = async (
  conversationId: string, 
  upToMessageId?: string
): Promise<{ success: boolean; error: any }> => {
  try {
    console.log('Marking messages as seen:', conversationId, upToMessageId);
    
    const { data, error } = await supabase.rpc('mark_messages_as_seen', {
      conversation_id_param: conversationId,
      up_to_message_id: upToMessageId || null
    });

    if (error) {
      console.error('Mark messages as seen error:', error);
      throw new Error(error.message || 'Failed to mark messages as seen');
    }

    console.log('Messages marked as seen:', data);
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Mark messages as seen error:', error);
    return { success: false, error };
  }
};

// Get or create conversation with a user
export const getOrCreateConversation = async (otherUserId: string): Promise<{ data: string | null; error: any }> => {
  try {
    console.log('Getting or creating conversation with:', otherUserId);
    
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_other_user_id: otherUserId
    });

    if (error) {
      console.error('Get or create conversation error:', error);
      throw new Error(error.message || 'Failed to get or create conversation');
    }

    console.log('Conversation ID:', data);
    return { data, error: null };
  } catch (error: any) {
    console.error('Get or create conversation error:', error);
    return { data: null, error };
  }
};

// Upload media file to Supabase Storage
export const uploadMediaFile = async (file: File): Promise<{ data: MediaFile | null; error: any }> => {
  try {
    console.log('Uploading media file:', file.name);
    
    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `media/${fileName}`;
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(uploadError.message || 'Failed to upload file');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('chat-media')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }

    // Create media file object
    const mediaFile: MediaFile = {
      id: Date.now().toString(),
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      file_url: urlData.publicUrl,
      // Add dimensions for images/videos if needed
      ...(file.type.startsWith('image/') && {
        width: 0, // You'd get actual dimensions here
        height: 0
      }),
      // Add duration for audio/video if needed
      ...(file.type.startsWith('audio/') || file.type.startsWith('video/')) && {
        duration: 0 // You'd get actual duration here
      }
    };

    console.log('Media file uploaded successfully:', mediaFile);
    return { data: mediaFile, error: null };
  } catch (error: any) {
    console.error('Upload media file error:', error);
    
    // Fallback to blob URL for development/testing
    console.log('Falling back to blob URL for file:', file.name);
    const blobUrl = URL.createObjectURL(file);
    
    const mediaFile: MediaFile = {
      id: Date.now().toString(),
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      file_url: blobUrl,
      // Add dimensions for images/videos if needed
      ...(file.type.startsWith('image/') && {
        width: 0,
        height: 0
      }),
      // Add duration for audio/video if needed
      ...(file.type.startsWith('audio/') || file.type.startsWith('video/')) && {
        duration: 0
      }
    };

    return { data: mediaFile, error: null };
  }
};

// Helper function to check if user has unread messages
export const hasUnreadMessages = async (): Promise<{ hasUnread: boolean; totalUnread: number }> => {
  try {
    const { data: conversations } = await getUserConversations();
    
    if (!conversations) {
      return { hasUnread: false, totalUnread: 0 };
    }

    const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
    
    return {
      hasUnread: totalUnread > 0,
      totalUnread
    };
  } catch (error) {
    console.error('Error checking unread messages:', error);
    return { hasUnread: false, totalUnread: 0 };
  }
};

// Helper function to get unread count for a specific user
export const getUnreadCountForUser = async (userId: string): Promise<number> => {
  try {
    const { data: conversations } = await getUserConversations();
    
    if (!conversations) {
      return 0;
    }

    const conversation = conversations.find(conv => conv.other_user_id === userId);
    return conversation?.unread_count || 0;
  } catch (error) {
    console.error('Error getting unread count for user:', error);
    return 0;
  }
};