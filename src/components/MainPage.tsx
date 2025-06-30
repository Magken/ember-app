import React, { useState, useEffect, useRef } from 'react';
import { MainHeader } from './main/MainHeader';
import { HearthDisplay } from './main/HearthDisplay';
import { ChatDisplay } from './main/ChatDisplay';
import { QuickStats } from './main/QuickStats';
import { SettingsModal } from './main/SettingsModal';
import { TextBlock } from './ui/Typography';
import { useAuth } from './auth/AuthProvider';
import { 
  getFriends, 
  getFriendRequests, 
  convertFriendsToFlames,
  useFriendRequestsSubscription,
  useFriendshipsSubscription,
  type Friend,
  type FriendRequest,
  type FlameData
} from '../lib/friends';
import { calculateFlameStrengthsBatch } from '../lib/flameStrength';
import { getUserConversations, hasUnreadMessages, type Conversation } from '../lib/messaging';

export const MainPage: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  
  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'friends'>('profile');
  const [showChat, setShowChat] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<{ id: string; name: string } | null>(null);
  
  // Friends State
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [flames, setFlames] = useState<FlameData[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  
  // Messaging State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<{ [userId: string]: number }>({});
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  
  // Refs for cleanup
  const friendRequestsUnsubscribeRef = useRef<(() => void) | null>(null);
  const friendshipsUnsubscribeRef = useRef<(() => void) | null>(null);

  // Load friends and requests on mount
  useEffect(() => {
    loadFriends();
    loadFriendRequests();
    loadConversations();
    checkUnreadMessages();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    const friendRequestsSub = useFriendRequestsSubscription(() => {
      console.log('Friend requests updated, reloading...');
      loadFriendRequests();
    });

    const friendshipsSub = useFriendshipsSubscription(() => {
      console.log('Friendships updated, reloading...');
      loadFriends();
      loadConversations();
    });

    friendRequestsUnsubscribeRef.current = friendRequestsSub.subscribe();
    friendshipsUnsubscribeRef.current = friendshipsSub.subscribe();

    // Listen for custom events
    const handleFriendRequestSent = () => {
      console.log('Friend request sent event received');
      loadFriendRequests();
    };

    const handleFriendRequestResponded = (event: CustomEvent) => {
      console.log('Friend request responded event received:', event.detail);
      loadFriendRequests();
      if (event.detail.accepted) {
        loadFriends();
        loadConversations();
      }
    };

    const handleMessageSent = () => {
      console.log('Message sent event received');
      loadFriends(); // Refresh flame strengths
      checkUnreadMessages();
    };

    window.addEventListener('friendRequestSent', handleFriendRequestSent);
    window.addEventListener('friendRequestResponded', handleFriendRequestResponded as EventListener);
    window.addEventListener('messageSent', handleMessageSent);

    return () => {
      friendRequestsUnsubscribeRef.current?.();
      friendshipsUnsubscribeRef.current?.();
      window.removeEventListener('friendRequestSent', handleFriendRequestSent);
      window.removeEventListener('friendRequestResponded', handleFriendRequestResponded as EventListener);
      window.removeEventListener('messageSent', handleMessageSent);
    };
  }, []);

  // Load friends with flame strength calculation
  const loadFriends = async () => {
    try {
      setLoadingFriends(true);
      console.log('Loading friends...');
      
      const { data: friendsData, error } = await getFriends();
      
      if (error) {
        console.error('Error loading friends:', error);
        return;
      }

      if (friendsData && friendsData.length > 0) {
        console.log('Friends loaded:', friendsData.length);
        
        // Calculate flame strengths for all friends
        const friendIds = friendsData.map(friend => friend.friend_id);
        const strengths = await calculateFlameStrengthsBatch(friendIds);
        
        // Update friends with calculated strengths
        const friendsWithStrengths = friendsData.map(friend => ({
          ...friend,
          connection_strength: strengths[friend.friend_id] || 0.1
        }));
        
        setFriends(friendsWithStrengths);
        
        // Convert to flames for hearth display
        const flameData = convertFriendsToFlames(friendsWithStrengths);
        setFlames(flameData);
        
        console.log('Friends with flame strengths:', friendsWithStrengths);
      } else {
        setFriends([]);
        setFlames([]);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  // Load friend requests
  const loadFriendRequests = async () => {
    try {
      setLoadingRequests(true);
      console.log('Loading friend requests...');
      
      const { data: requestsData, error } = await getFriendRequests();
      
      if (error) {
        console.error('Error loading friend requests:', error);
        return;
      }

      if (requestsData) {
        console.log('Friend requests loaded:', requestsData.length);
        setFriendRequests(requestsData);
      } else {
        setFriendRequests([]);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Load conversations
  const loadConversations = async () => {
    try {
      const { data: conversationsData } = await getUserConversations();
      if (conversationsData) {
        setConversations(conversationsData);
        
        // Build unread counts map
        const unreadMap: { [userId: string]: number } = {};
        conversationsData.forEach(conv => {
          unreadMap[conv.other_user_id] = conv.unread_count;
        });
        setUnreadCounts(unreadMap);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Check for unread messages
  const checkUnreadMessages = async () => {
    try {
      const { totalUnread } = await hasUnreadMessages();
      setTotalUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error checking unread messages:', error);
    }
  };

  // Handle flame click to open chat
  const handleFlameClick = (flameId: string) => {
    const friend = friends.find(f => f.friend_id === flameId);
    if (friend) {
      setSelectedChatUser({
        id: friend.friend_id,
        name: friend.friend_nickname
      });
      setShowChat(true);
      setShowSettings(false);
    }
  };

  // Handle hearth refresh
  const handleHearthRefresh = () => {
    loadFriends();
    loadConversations();
    checkUnreadMessages();
  };

  // Handle chat with friend from settings
  const handleChatWithFriend = (friendId: string, friendName: string) => {
    setSelectedChatUser({ id: friendId, name: friendName });
    setShowChat(true);
    setShowSettings(false);
  };

  // Handle refresh data
  const handleRefreshData = () => {
    loadFriends();
    loadFriendRequests();
    loadConversations();
    checkUnreadMessages();
  };

  // Enhanced flames with unread indicators
  const flamesWithUnread = flames.map(flame => ({
    ...flame,
    hasUnreadMessages: (unreadCounts[flame.id] || 0) > 0,
    unreadCount: unreadCounts[flame.id] || 0
  }));

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-ember rounded-full mx-auto animate-pulse mb-4" />
          <TextBlock>Loading your profile...</TextBlock>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)]">
      {/* Header */}
      <MainHeader
        profile={profile}
        totalUnreadCount={totalUnreadCount}
        onSettingsClick={() => setShowSettings(true)}
        onSignOut={signOut}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showChat && selectedChatUser ? (
          /* Chat View */
          <ChatDisplay
            selectedChatUser={selectedChatUser}
            friends={friends}
            onClose={() => {
              setShowChat(false);
              setSelectedChatUser(null);
            }}
          />
        ) : (
          /* Hearth View */
          <div className="space-y-8">
            <HearthDisplay
              flames={flamesWithUnread}
              onFlameClick={handleFlameClick}
              onRefresh={handleHearthRefresh}
            />

            {/* Quick Stats */}
            <QuickStats
              flames={flames}
              totalUnreadCount={totalUnreadCount}
            />
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        activeTab={activeTab}
        profile={profile}
        friends={friends}
        friendRequests={friendRequests}
        unreadCounts={unreadCounts}
        onClose={() => setShowSettings(false)}
        onTabChange={setActiveTab}
        onChatWithFriend={handleChatWithFriend}
        onRefreshData={handleRefreshData}
      />
    </div>
  );
};