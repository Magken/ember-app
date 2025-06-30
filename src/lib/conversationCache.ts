import { Message, Conversation } from './messaging';

// Cache keys
const CONVERSATION_CACHE_KEY = 'ember_conversation_cache';
const MESSAGES_CACHE_KEY = 'ember_messages_cache';
const CACHE_TIMESTAMP_KEY = 'ember_cache_timestamp';

// Cache expiration time (30 minutes)
const CACHE_EXPIRATION = 30 * 60 * 1000;

interface ConversationCache {
  [conversationId: string]: {
    conversation: Conversation;
    messages: Message[];
    lastUpdated: number;
    contactUserId: string;
  };
}

interface MessagesCache {
  [conversationId: string]: {
    messages: Message[];
    lastUpdated: number;
    hasMore: boolean;
  };
}

class ConversationCacheManager {
  private static instance: ConversationCacheManager;
  private conversationCache: ConversationCache = {};
  private messagesCache: MessagesCache = {};
  private isInitialized = false;

  static getInstance(): ConversationCacheManager {
    if (!ConversationCacheManager.instance) {
      ConversationCacheManager.instance = new ConversationCacheManager();
    }
    return ConversationCacheManager.instance;
  }

  private initialize() {
    if (this.isInitialized) return;
    
    console.log('Initializing ConversationCacheManager...');
    
    // Load cached data from storage
    this.loadFromStorage();
    
    // Set up periodic cache cleanup
    this.startCacheCleanup();
    
    this.isInitialized = true;
  }

  /**
   * Cache conversation data
   */
  cacheConversation(conversationId: string, conversation: Conversation, contactUserId: string): void {
    this.initialize();
    
    console.log(`Caching conversation: ${conversationId}`);
    
    this.conversationCache[conversationId] = {
      conversation,
      messages: [],
      lastUpdated: Date.now(),
      contactUserId
    };
    
    this.saveToStorage();
  }

  /**
   * Cache messages for a conversation
   */
  cacheMessages(conversationId: string, messages: Message[], hasMore: boolean = true): void {
    this.initialize();
    
    console.log(`Caching ${messages.length} messages for conversation: ${conversationId}`);
    
    this.messagesCache[conversationId] = {
      messages: [...messages], // Create a copy to avoid reference issues
      lastUpdated: Date.now(),
      hasMore
    };
    
    this.saveToStorage();
  }

  /**
   * Add a new message to cache
   */
  addMessage(conversationId: string, message: Message): void {
    this.initialize();
    
    if (this.messagesCache[conversationId]) {
      // Add message to the beginning (newest first)
      this.messagesCache[conversationId].messages.unshift(message);
      this.messagesCache[conversationId].lastUpdated = Date.now();
      
      console.log(`Added message to cache for conversation: ${conversationId}`);
      this.saveToStorage();
    }
  }

  /**
   * Get cached conversation
   */
  getCachedConversation(conversationId: string): Conversation | null {
    this.initialize();
    
    const cached = this.conversationCache[conversationId];
    if (cached && this.isCacheValid(cached.lastUpdated)) {
      console.log(`Retrieved cached conversation: ${conversationId}`);
      return cached.conversation;
    }
    
    return null;
  }

  /**
   * Get cached messages
   */
  getCachedMessages(conversationId: string): { messages: Message[]; hasMore: boolean } | null {
    this.initialize();
    
    const cached = this.messagesCache[conversationId];
    if (cached && this.isCacheValid(cached.lastUpdated)) {
      console.log(`Retrieved ${cached.messages.length} cached messages for conversation: ${conversationId}`);
      return {
        messages: [...cached.messages], // Return a copy
        hasMore: cached.hasMore
      };
    }
    
    console.log(`No cached messages found for conversation: ${conversationId}`);
    return null;
  }

  /**
   * Get contact user ID for a conversation
   */
  getContactUserId(conversationId: string): string | null {
    this.initialize();
    
    const cached = this.conversationCache[conversationId];
    if (cached && this.isCacheValid(cached.lastUpdated)) {
      return cached.contactUserId;
    }
    
    return null;
  }

  /**
   * Check if conversation is cached
   */
  isConversationCached(conversationId: string): boolean {
    this.initialize();
    
    const cached = this.conversationCache[conversationId];
    return cached && this.isCacheValid(cached.lastUpdated);
  }

  /**
   * Check if messages are cached
   */
  areMessagesCached(conversationId: string): boolean {
    this.initialize();
    
    const cached = this.messagesCache[conversationId];
    const isCached = cached && this.isCacheValid(cached.lastUpdated);
    console.log(`Messages cached for ${conversationId}: ${isCached}`);
    return isCached;
  }

  /**
   * Clear cache for a specific conversation
   */
  clearConversationCache(conversationId: string): void {
    console.log(`Clearing cache for conversation: ${conversationId}`);
    
    delete this.conversationCache[conversationId];
    delete this.messagesCache[conversationId];
    
    this.saveToStorage();
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    console.log('Clearing all conversation cache');
    
    this.conversationCache = {};
    this.messagesCache = {};
    
    this.saveToStorage();
  }

  /**
   * Get all cached conversation IDs
   */
  getCachedConversationIds(): string[] {
    this.initialize();
    
    return Object.keys(this.conversationCache).filter(conversationId => {
      const cached = this.conversationCache[conversationId];
      return cached && this.isCacheValid(cached.lastUpdated);
    });
  }

  /**
   * Update conversation last seen
   */
  updateConversationLastSeen(conversationId: string, lastSeenAt: string): void {
    this.initialize();
    
    if (this.conversationCache[conversationId]) {
      this.conversationCache[conversationId].conversation.last_seen_at = lastSeenAt;
      this.conversationCache[conversationId].lastUpdated = Date.now();
      this.saveToStorage();
    }
  }

  /**
   * Update unread count for conversation
   */
  updateUnreadCount(conversationId: string, unreadCount: number): void {
    this.initialize();
    
    if (this.conversationCache[conversationId]) {
      this.conversationCache[conversationId].conversation.unread_count = unreadCount;
      this.conversationCache[conversationId].lastUpdated = Date.now();
      this.saveToStorage();
    }
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    const now = Date.now();
    return (now - timestamp) < CACHE_EXPIRATION;
  }

  /**
   * Save cache to storage
   */
  private saveToStorage(): void {
    try {
      const cacheData = {
        conversations: this.conversationCache,
        messages: this.messagesCache,
        timestamp: Date.now()
      };
      
      localStorage.setItem(CONVERSATION_CACHE_KEY, JSON.stringify(cacheData));
      console.log('Conversation cache saved to storage');
    } catch (error) {
      console.warn('Failed to save conversation cache to storage:', error);
    }
  }

  /**
   * Load cache from storage
   */
  private loadFromStorage(): void {
    try {
      const cachedData = localStorage.getItem(CONVERSATION_CACHE_KEY);
      if (cachedData) {
        const data = JSON.parse(cachedData);
        
        // Check if cache is still valid
        if (this.isCacheValid(data.timestamp)) {
          this.conversationCache = data.conversations || {};
          this.messagesCache = data.messages || {};
          console.log('Conversation cache loaded from storage');
        } else {
          console.log('Conversation cache expired, clearing...');
          this.clearAllCache();
        }
      }
    } catch (error) {
      console.warn('Failed to load conversation cache from storage:', error);
      this.clearAllCache();
    }
  }

  /**
   * Start periodic cache cleanup
   */
  private startCacheCleanup(): void {
    // Clean up expired cache every 5 minutes
    setInterval(() => {
      const now = Date.now();
      let cleanedConversations = 0;
      let cleanedMessages = 0;
      
      // Clean expired conversations
      Object.keys(this.conversationCache).forEach(conversationId => {
        const cached = this.conversationCache[conversationId];
        if (!this.isCacheValid(cached.lastUpdated)) {
          delete this.conversationCache[conversationId];
          cleanedConversations++;
        }
      });
      
      // Clean expired messages
      Object.keys(this.messagesCache).forEach(conversationId => {
        const cached = this.messagesCache[conversationId];
        if (!this.isCacheValid(cached.lastUpdated)) {
          delete this.messagesCache[conversationId];
          cleanedMessages++;
        }
      });
      
      if (cleanedConversations > 0 || cleanedMessages > 0) {
        console.log(`Cleaned up ${cleanedConversations} conversations and ${cleanedMessages} message caches`);
        this.saveToStorage();
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { conversations: number; messages: number; totalSize: number } {
    this.initialize();
    
    const conversations = Object.keys(this.conversationCache).length;
    const messages = Object.values(this.messagesCache).reduce((total, cache) => total + cache.messages.length, 0);
    const totalSize = JSON.stringify(this.conversationCache).length + JSON.stringify(this.messagesCache).length;
    
    return { conversations, messages, totalSize };
  }
}

// Export singleton instance
export const conversationCache = ConversationCacheManager.getInstance();

// Export types
export type { ConversationCache, MessagesCache }; 