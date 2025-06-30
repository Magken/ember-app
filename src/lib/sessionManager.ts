import { supabase } from './supabase';

// Session management constants
const SESSION_KEY = 'ember_session_data';
const CACHE_CLEAR_KEY = 'ember_cache_clear';
const TAB_SYNC_KEY = 'ember_tab_sync';

// Session data interface
interface SessionData {
  userId: string;
  email: string;
  nickname: string;
  uniqueCode: string;
  lastActivity: number;
  tabId: string;
}

// Cache clear request interface
interface CacheClearRequest {
  timestamp: number;
  userId: string;
  tabId: string;
}

// Tab sync message interface
interface TabSyncMessage {
  type: 'session_update' | 'session_clear' | 'cache_clear';
  data: any;
  timestamp: number;
  tabId: string;
}

class SessionManager {
  private tabId: string;
  private sessionData: SessionData | null = null;
  private isInitialized = false;
  private storageListeners: (() => void)[] = [];

  constructor() {
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.initializeSessionManager();
  }

  private initializeSessionManager() {
    if (this.isInitialized) return;
    
    console.log(`SessionManager initialized for tab: ${this.tabId}`);
    
    // Set up storage event listeners for cross-tab communication
    window.addEventListener('storage', this.handleStorageEvent.bind(this));
    
    // Set up beforeunload listener to clean up on tab close
    window.addEventListener('beforeunload', this.handleTabClose.bind(this));
    
    // Set up visibility change listener for tab switching
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Set up periodic session validation
    this.startSessionValidation();
    
    this.isInitialized = true;
  }

  /**
   * Initialize session from storage or Supabase
   */
  async initializeSession(): Promise<SessionData | null> {
    try {
      console.log('Initializing session...');
      
      // First, try to get session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('Supabase session error:', error);
        // Clear any invalid session data
        this.clearSessionData();
        return null;
      }
      
      if (!session?.user) {
        console.log('No active Supabase session');
        this.clearSessionData();
        return null;
      }
      
      // Validate session by getting user data
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        console.warn('Session validation failed:', userError);
        this.clearSessionData();
        return null;
      }
      
      // Get user profile
      const profile = await this.getUserProfile(userData.user.id);
      
      if (!profile) {
        console.warn('User profile not found');
        this.clearSessionData();
        return null;
      }
      
      // Create session data
      const sessionData: SessionData = {
        userId: userData.user.id,
        email: userData.user.email || '',
        nickname: profile.nickname,
        uniqueCode: profile.unique_code,
        lastActivity: Date.now(),
        tabId: this.tabId
      };
      
      // Store session data
      this.setSessionData(sessionData);
      
      // Notify other tabs
      this.notifyTabSync({
        type: 'session_update',
        data: sessionData,
        timestamp: Date.now(),
        tabId: this.tabId
      });
      
      console.log('Session initialized successfully:', sessionData);
      return sessionData;
      
    } catch (error) {
      console.error('Session initialization error:', error);
      this.clearSessionData();
      return null;
    }
  }

  /**
   * Get current session data
   */
  getCurrentSession(): SessionData | null {
    if (!this.sessionData) {
      // Try to get from storage
      const stored = this.getSessionFromStorage();
      if (stored && this.isSessionValid(stored)) {
        this.sessionData = stored;
      }
    }
    return this.sessionData;
  }

  /**
   * Update session activity
   */
  updateSessionActivity(): void {
    if (this.sessionData) {
      this.sessionData.lastActivity = Date.now();
      this.setSessionData(this.sessionData);
    }
  }

  /**
   * Clear session data and cache
   */
  async clearSession(): Promise<void> {
    console.log('Clearing session and cache...');
    
    // Clear Supabase session
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.warn('Supabase sign out error:', error);
    }
    
    // Clear session data
    this.clearSessionData();
    
    // Clear cache
    this.clearCache();
    
    // Notify other tabs
    this.notifyTabSync({
      type: 'session_clear',
      data: null,
      timestamp: Date.now(),
      tabId: this.tabId
    });
    
    console.log('Session and cache cleared');
  }

  /**
   * Clear cache for smooth sign-in
   */
  async clearCacheForSignIn(): Promise<void> {
    console.log('Clearing cache for sign-in...');
    
    // Create cache clear request
    const cacheClearRequest: CacheClearRequest = {
      timestamp: Date.now(),
      userId: this.sessionData?.userId || '',
      tabId: this.tabId
    };
    
    // Store cache clear request
    try {
      localStorage.setItem(CACHE_CLEAR_KEY, JSON.stringify(cacheClearRequest));
    } catch (error) {
      console.warn('Could not store cache clear request:', error);
    }
    
    // Clear local cache
    this.clearCache();
    
    // Notify other tabs
    this.notifyTabSync({
      type: 'cache_clear',
      data: cacheClearRequest,
      timestamp: Date.now(),
      tabId: this.tabId
    });
    
    console.log('Cache cleared for sign-in');
  }

  /**
   * Check if cache should be cleared (for returning users)
   */
  shouldClearCache(): boolean {
    try {
      const stored = localStorage.getItem(CACHE_CLEAR_KEY);
      if (!stored) return false;
      
      const request: CacheClearRequest = JSON.parse(stored);
      const now = Date.now();
      
      // Clear if request is older than 5 minutes
      if (now - request.timestamp > 5 * 60 * 1000) {
        localStorage.removeItem(CACHE_CLEAR_KEY);
        return false;
      }
      
      // Clear if it's a different user
      if (this.sessionData && request.userId && request.userId !== this.sessionData.userId) {
        localStorage.removeItem(CACHE_CLEAR_KEY);
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Error checking cache clear request:', error);
      return false;
    }
  }

  /**
   * Validate session is still active
   */
  async validateSession(): Promise<boolean> {
    try {
      const session = this.getCurrentSession();
      if (!session) return false;
      
      // Check if session is too old (24 hours)
      const now = Date.now();
      if (now - session.lastActivity > 24 * 60 * 60 * 1000) {
        console.log('Session expired due to inactivity');
        await this.clearSession();
        return false;
      }
      
      // Validate with Supabase
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user || user.id !== session.userId) {
        console.log('Session validation failed with Supabase');
        await this.clearSession();
        return false;
      }
      
      // Update activity
      this.updateSessionActivity();
      return true;
      
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * Get user profile from database
   */
  private async getUserProfile(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Profile fetch error:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  }

  /**
   * Set session data in storage
   */
  private setSessionData(sessionData: SessionData): void {
    this.sessionData = sessionData;
    
    try {
      // Store in sessionStorage for this tab
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      
      // Also store in localStorage for persistence across page reloads
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.warn('Could not store session data:', error);
    }
  }

  /**
   * Get session data from storage
   */
  private getSessionFromStorage(): SessionData | null {
    try {
      // First try sessionStorage
      const sessionData = sessionStorage.getItem(SESSION_KEY);
      if (sessionData) {
        return JSON.parse(sessionData);
      }
      
      // Fallback to localStorage
      const localData = localStorage.getItem(SESSION_KEY);
      if (localData) {
        const parsed = JSON.parse(localData);
        // Copy to sessionStorage
        sessionStorage.setItem(SESSION_KEY, localData);
        return parsed;
      }
      
      return null;
    } catch (error) {
      console.warn('Error reading session data:', error);
      return null;
    }
  }

  /**
   * Clear session data from storage
   */
  private clearSessionData(): void {
    this.sessionData = null;
    
    try {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.warn('Error clearing session data:', error);
    }
  }

  /**
   * Clear cache (localStorage items that might interfere with sign-in)
   */
  private clearCache(): void {
    try {
      // Clear Supabase-related items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('supabase') ||
          key.includes('ember_cache') ||
          key.includes('auth')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore individual removal errors
        }
      });
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      console.log('Cache cleared successfully');
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }

  /**
   * Check if session data is valid
   */
  private isSessionValid(sessionData: SessionData): boolean {
    if (!sessionData || !sessionData.userId || !sessionData.email) {
      return false;
    }
    
    // Check if session is not too old (24 hours)
    const now = Date.now();
    if (now - sessionData.lastActivity > 24 * 60 * 60 * 1000) {
      return false;
    }
    
    return true;
  }

  /**
   * Notify other tabs about session changes
   */
  private notifyTabSync(message: TabSyncMessage): void {
    try {
      localStorage.setItem(TAB_SYNC_KEY, JSON.stringify(message));
      // Trigger storage event for other tabs
      localStorage.removeItem(TAB_SYNC_KEY);
    } catch (error) {
      console.warn('Could not notify other tabs:', error);
    }
  }

  /**
   * Handle storage events from other tabs
   */
  private handleStorageEvent(event: StorageEvent): void {
    if (event.key === TAB_SYNC_KEY && event.newValue) {
      try {
        const message: TabSyncMessage = JSON.parse(event.newValue);
        
        // Ignore messages from this tab
        if (message.tabId === this.tabId) return;
        
        console.log('Received tab sync message:', message);
        
        switch (message.type) {
          case 'session_update':
            if (message.data) {
              this.sessionData = message.data;
            }
            break;
            
          case 'session_clear':
            this.sessionData = null;
            this.clearSessionData();
            break;
            
          case 'cache_clear':
            this.clearCache();
            break;
        }
      } catch (error) {
        console.warn('Error parsing tab sync message:', error);
      }
    }
  }

  /**
   * Handle tab close
   */
  private handleTabClose(): void {
    console.log(`Tab ${this.tabId} closing, cleaning up...`);
    // Cleanup is handled by the browser automatically
  }

  /**
   * Handle visibility change (tab switching)
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      console.log('Tab became visible, validating session...');
      this.validateSession();
    }
  }

  /**
   * Start periodic session validation
   */
  private startSessionValidation(): void {
    // Validate session every 5 minutes
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.validateSession();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Add storage listener
   */
  addStorageListener(listener: () => void): void {
    this.storageListeners.push(listener);
  }

  /**
   * Remove storage listener
   */
  removeStorageListener(listener: () => void): void {
    const index = this.storageListeners.indexOf(listener);
    if (index > -1) {
      this.storageListeners.splice(index, 1);
    }
  }
}

// Create singleton instance
export const sessionManager = new SessionManager();

// Export types for use in other files
export type { SessionData, CacheClearRequest, TabSyncMessage }; 