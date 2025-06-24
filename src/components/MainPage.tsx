import React, { useState, useEffect, useCallback } from 'react';
import { BurningPaperCard } from './ui/Card';
import { IconedButton } from './ui/IconedButton';
import { InputBox } from './ui/InputBox';
import { PasswordInput } from './ui/PasswordInput';
import { EmberButton } from './ui/Button';
import { Flame } from './ui/Flame';
import { Hearth } from './ui/Hearth';
import { LiveChatBox } from './ui/LiveChatBox';
import { Heading2, Heading3, TextBlock, SmallText, TinyText } from './ui/Typography';
import { Settings, User, UserPlus, X, Clock, CheckCircle, XCircle, Copy, LogOut, Trash2, RefreshCw, AlertCircle, MessageCircle } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';
import { 
  sendFriendRequest, 
  respondToFriendRequest, 
  getFriendRequests, 
  getFriends, 
  convertFriendsToFlames,
  formatTimeAgo,
  validateUniqueCode,
  friendsSubscriptionManager,
  type FriendRequest,
  type Friend,
  type FlameData
} from '../lib/friends';
import { getUserConversations, getUnreadCountForUser, messagingSubscriptionManager } from '../lib/messaging';
import { updateProfile, changePassword, signOut, deleteAccount } from '../lib/auth';
import { calculateFlameStrength, calculateFlameStrengthsBatch } from '../lib/flameStrength';

interface ValidationMessage {
  type: 'success' | 'error';
  message: string;
}

export const MainPage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedContact, setSelectedContact] = useState<FlameData | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'friends'>('profile');
  const [nickname, setNickname] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [friendUsername, setFriendUsername] = useState('');
  const [hearthDimensions, setHearthDimensions] = useState({ width: 800, height: 600 });
  const [copySuccess, setCopySuccess] = useState(false);

  // Validation messages for both tabs
  const [profileMessage, setProfileMessage] = useState<ValidationMessage | null>(null);
  const [friendsMessage, setFriendsMessage] = useState<ValidationMessage | null>(null);

  // Friends state
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [userConnections, setUserConnections] = useState<FlameData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unread messages state
  const [unreadCounts, setUnreadCounts] = useState<{ [userId: string]: number }>({});

  // Real-time subscription cleanup functions
  const [friendRequestsUnsubscribe, setFriendRequestsUnsubscribe] = useState<(() => void) | null>(null);
  const [friendshipsUnsubscribe, setFriendshipsUnsubscribe] = useState<(() => void) | null>(null);
  const [conversationsUnsubscribe, setConversationsUnsubscribe] = useState<(() => void) | null>(null);

  // Set nickname from profile when available
  useEffect(() => {
    if (profile?.nickname) {
      setNickname(profile.nickname);
    }
  }, [profile]);

  // Clear messages when switching tabs
  useEffect(() => {
    setProfileMessage(null);
    setFriendsMessage(null);
  }, [activeTab]);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (profileMessage) {
      const timer = setTimeout(() => setProfileMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [profileMessage]);

  useEffect(() => {
    if (friendsMessage) {
      const timer = setTimeout(() => setFriendsMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [friendsMessage]);

  // Update hearth dimensions based on window size with reduced minimum sizes (20% smaller)
  useEffect(() => {
    const updateDimensions = () => {
      const padding = 32; // Total horizontal padding
      const headerHeight = 88; // Header height
      const bottomPadding = 32; // Bottom padding
      
      const availableWidth = window.innerWidth - padding;
      const availableHeight = window.innerHeight - headerHeight - bottomPadding;
      
      setHearthDimensions({
        width: Math.max(320, availableWidth), // Reduced from 400px to 320px (20% smaller)
        height: Math.max(240, availableHeight) // Reduced from 300px to 240px (20% smaller)
      });
    };

    // Initial calculation
    updateDimensions();

    // Add resize listener
    window.addEventListener('resize', updateDimensions);

    // Cleanup
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Load friends and friend requests
  const loadFriendsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading friends data...');

      // Load friends and friend requests in parallel
      const [friendsResult, requestsResult] = await Promise.all([
        getFriends(),
        getFriendRequests()
      ]);

      if (friendsResult.error) {
        throw new Error(friendsResult.error.message || 'Failed to load friends');
      }

      if (requestsResult.error) {
        throw new Error(requestsResult.error.message || 'Failed to load friend requests');
      }

      const friendsData = friendsResult.data || [];
      const requestsData = requestsResult.data || [];

      console.log('Loaded friends:', friendsData.length);
      console.log('Loaded requests:', requestsData.length);

      setFriends(friendsData);
      setFriendRequests(requestsData);

      // Convert friends to flame data for hearth (without strength calculation yet)
      const flameData = convertFriendsToFlames(friendsData);
      setUserConnections(flameData);

      // Load unread message counts for each friend
      await loadUnreadCounts(friendsData);

    } catch (err: any) {
      console.error('Error loading friends data:', err);
      setError(err.message || 'Failed to load friends data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load unread message counts for friends
  const loadUnreadCounts = async (friendsList: Friend[]) => {
    try {
      console.log('Loading unread counts for friends...');
      const counts: { [userId: string]: number } = {};
      
      // Get unread count for each friend
      await Promise.all(
        friendsList.map(async (friend) => {
          const count = await getUnreadCountForUser(friend.friend_id);
          if (count > 0) {
            counts[friend.friend_id] = count;
          }
        })
      );
      
      console.log('Unread counts loaded:', counts);
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  };

  // Recalculate flame strengths based on the formula
  const recalculateFlameStrengths = useCallback(async () => {
    try {
      console.log('Recalculating flame strengths...');
      
      // Get the latest friends data
      const { data: friendsData, error } = await getFriends();
      
      if (error || !friendsData) {
        console.error('Failed to get friends for strength calculation:', error);
        return;
      }
      
      if (friendsData.length === 0) {
        console.log('No friends to calculate strengths for');
        setUserConnections([]);
        return;
      }
      
      // Calculate strengths for all friends in batch
      const friendIds = friendsData.map(friend => friend.friend_id);
      const strengthResults = await calculateFlameStrengthsBatch(friendIds);
      
      // Update friends with new strengths
      const updatedFriends = friendsData.map(friend => ({
        ...friend,
        connection_strength: strengthResults[friend.friend_id] || 0.1
      }));
      
      console.log('Updated friends with new strengths:', updatedFriends);
      
      // Update friends state
      setFriends(updatedFriends);
      
      // Convert to updated flame data
      const updatedFlameData = convertFriendsToFlames(updatedFriends);
      setUserConnections(updatedFlameData);
      
      console.log('Flame strengths recalculated successfully');
    } catch (error) {
      console.error('Error recalculating flame strengths:', error);
    }
  }, []);

  // Set up real-time subscriptions for friend requests
  useEffect(() => {
    if (activeTab === 'friends') {
      console.log('Setting up friend requests real-time subscription');
      
      const unsubscribe = friendsSubscriptionManager.subscribe('friend_requests', () => {
        console.log('Friend requests updated via real-time subscription');
        // Reload friend requests data
        getFriendRequests().then(({ data, error }) => {
          if (!error && data) {
            setFriendRequests(data);
          }
        });
      });
      
      setFriendRequestsUnsubscribe(() => unsubscribe);
      
      return () => {
        console.log('Cleaning up friend requests subscription');
        unsubscribe();
        setFriendRequestsUnsubscribe(null);
      };
    }
  }, [activeTab]);

  // Set up real-time subscriptions for friendships
  useEffect(() => {
    console.log('Setting up friendships real-time subscription');
    
    const unsubscribe = friendsSubscriptionManager.subscribe('friendships', () => {
      console.log('Friendships updated via real-time subscription');
      // Reload friends data and recalculate flame strengths
      loadFriendsData().then(() => {
        recalculateFlameStrengths();
      });
    });
    
    setFriendshipsUnsubscribe(() => unsubscribe);
    
    return () => {
      console.log('Cleaning up friendships subscription');
      unsubscribe();
      setFriendshipsUnsubscribe(null);
    };
  }, [loadFriendsData, recalculateFlameStrengths]);

  // Set up real-time subscription for conversations (unread counts)
  useEffect(() => {
    if (!showChat) {
      console.log('Setting up conversations real-time subscription');
      
      const unsubscribe = messagingSubscriptionManager.subscribeToConversations(() => {
        console.log('Conversations updated via real-time subscription');
        if (friends.length > 0) {
          loadUnreadCounts(friends);
        }
      });

      setConversationsUnsubscribe(() => unsubscribe);
      
      return () => {
        console.log('Cleaning up conversations subscription');
        unsubscribe();
        setConversationsUnsubscribe(null);
      };
    }
  }, [showChat, friends]);

  // Load data on component mount
  useEffect(() => {
    loadFriendsData().then(() => {
      // Calculate flame strengths after initial load
      recalculateFlameStrengths();
    });
  }, [loadFriendsData, recalculateFlameStrengths]);

  // Listen for custom refresh events
  useEffect(() => {
    const handleFriendRequestSent = () => {
      console.log('Friend request sent event received, refreshing...');
      if (activeTab === 'friends') {
        loadFriendsData();
      }
    };

    const handleFriendRequestResponded = () => {
      console.log('Friend request responded event received, refreshing...');
      if (activeTab === 'friends') {
        loadFriendsData().then(() => {
          recalculateFlameStrengths();
        });
      }
    };

    window.addEventListener('friendRequestSent', handleFriendRequestSent);
    window.addEventListener('friendRequestResponded', handleFriendRequestResponded);

    return () => {
      window.removeEventListener('friendRequestSent', handleFriendRequestSent);
      window.removeEventListener('friendRequestResponded', handleFriendRequestResponded);
    };
  }, [activeTab, loadFriendsData, recalculateFlameStrengths]);

  // Listen for message sent events to update flame strengths
  useEffect(() => {
    const handleMessageSent = () => {
      console.log('Message sent, updating flame strengths...');
      // Delay to allow message to be processed
      setTimeout(() => {
        recalculateFlameStrengths();
      }, 1000);
    };

    window.addEventListener('messageSent', handleMessageSent);

    return () => {
      window.removeEventListener('messageSent', handleMessageSent);
    };
  }, [recalculateFlameStrengths]);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      if (friendRequestsUnsubscribe) {
        friendRequestsUnsubscribe();
      }
      if (friendshipsUnsubscribe) {
        friendshipsUnsubscribe();
      }
      if (conversationsUnsubscribe) {
        conversationsUnsubscribe();
      }
    };
  }, [friendRequestsUnsubscribe, friendshipsUnsubscribe, conversationsUnsubscribe]);

  const handlePasswordChange = async () => {
    // Clear previous messages
    setProfileMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setProfileMessage({ type: 'error', message: 'Please fill in all password fields' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setProfileMessage({ type: 'error', message: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setProfileMessage({ type: 'error', message: 'Password must be at least 8 characters long' });
      return;
    }
    
    try {
      const { error } = await changePassword(currentPassword, newPassword);
      if (error) {
        throw error;
      }
      
      setProfileMessage({ type: 'success', message: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setProfileMessage({ type: 'error', message: error.message || 'Failed to change password' });
    }
  };

  const handleAddFriend = async () => {
    // Clear previous messages
    setFriendsMessage(null);

    if (!friendUsername.trim()) {
      setFriendsMessage({ type: 'error', message: 'Please enter a username or unique code' });
      return;
    }
    
    // Validate unique code format
    if (!validateUniqueCode(friendUsername.trim())) {
      setFriendsMessage({ type: 'error', message: 'Please enter a valid unique code (format: EMBR-XXXXXXXX)' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await sendFriendRequest(friendUsername.trim());
      
      if (error) {
        throw error;
      }

      if (data?.success) {
        setFriendsMessage({ type: 'success', message: `Friend request sent to ${friendUsername}!` });
        setFriendUsername('');
        // The real-time subscription will handle the refresh automatically
      } else {
        throw new Error(data?.error || 'Failed to send friend request');
      }
    } catch (error: any) {
      console.error('Add friend error:', error);
      setFriendsMessage({ type: 'error', message: error.message || 'Failed to send friend request' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    // Clear previous messages
    setProfileMessage(null);

    if (!nickname.trim()) {
      setProfileMessage({ type: 'error', message: 'Nickname cannot be empty' });
      return;
    }
    
    try {
      const { error } = await updateProfile({ nickname: nickname.trim() });
      if (error) {
        throw error;
      }
      
      // Refresh the profile to get updated data
      await refreshProfile();
      
      setProfileMessage({ type: 'success', message: 'Profile updated successfully!' });
    } catch (error: any) {
      setProfileMessage({ type: 'error', message: error.message || 'Failed to update profile' });
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setLoading(true);
    setFriendsMessage(null);

    try {
      const { data, error } = await respondToFriendRequest(requestId, 'accepted');
      
      if (error) {
        throw error;
      }

      if (data?.success) {
        setFriendsMessage({ type: 'success', message: 'Friend request accepted successfully!' });
        // The real-time subscription will handle the refresh automatically
        console.log('Friend request accepted successfully');
      } else {
        throw new Error(data?.error || 'Failed to accept friend request');
      }
    } catch (error: any) {
      console.error('Accept request error:', error);
      setFriendsMessage({ type: 'error', message: error.message || 'Failed to accept friend request' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setLoading(true);
    setFriendsMessage(null);

    try {
      const { data, error } = await respondToFriendRequest(requestId, 'declined');
      
      if (error) {
        throw error;
      }

      if (data?.success) {
        setFriendsMessage({ type: 'success', message: 'Friend request declined successfully' });
        // The real-time subscription will handle the refresh automatically
        console.log('Friend request declined successfully');
      } else {
        throw new Error(data?.error || 'Failed to decline friend request');
      }
    } catch (error: any) {
      console.error('Decline request error:', error);
      setFriendsMessage({ type: 'error', message: error.message || 'Failed to decline friend request' });
    } finally {
      setLoading(false);
    }
  };

  const copyUniqueCode = () => {
    const codeToShare = profile?.unique_code || 'EMBR-XXXXXXXX';
    navigator.clipboard.writeText(codeToShare).then(() => {
      setCopySuccess(true);
      setProfileMessage({ type: 'success', message: 'Unique code copied to clipboard!' });
      setTimeout(() => setCopySuccess(false), 3000);
    }).catch(() => {
      setProfileMessage({ type: 'error', message: 'Failed to copy code. Please copy manually: ' + codeToShare });
    });
  };

  const handleLogout = async () => {
    setProfileMessage(null);

    if (confirm('Are you sure you want to log out?')) {
      try {
        await signOut();
        setProfileMessage({ type: 'success', message: 'Logged out successfully!' });
      } catch (error: any) {
        console.error('Logout error:', error);
        setProfileMessage({ type: 'error', message: 'Logout failed, forcing reload...' });
        // Force reload as fallback
        setTimeout(() => window.location.reload(), 1000);
      }
    }
  };

  const handleDeleteAccount = async () => {
    setProfileMessage(null);

    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      if (confirm('This will permanently delete all your data and connections. Are you absolutely sure?')) {
        try {
          await deleteAccount();
          setProfileMessage({ type: 'success', message: 'Account deletion initiated.' });
        } catch (error: any) {
          setProfileMessage({ type: 'error', message: error.message || 'Failed to delete account' });
        }
      }
    }
  };

  const handleFlameClick = (flameId: string) => {
    const connection = userConnections.find(c => c.id === flameId);
    if (connection) {
      setSelectedContact(connection);
      setShowChat(true);
      console.log(`Opening chat with ${connection.name}`);
    }
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedContact(null);
    // Refresh unread counts when closing chat
    if (friends.length > 0) {
      loadUnreadCounts(friends);
    }
    // Update flame strengths after closing chat
    setTimeout(() => {
      recalculateFlameStrengths();
    }, 1000);
  };

  // Enhanced refresh function that recalculates flame strengths
  const handleRefresh = async () => {
    console.log('Manual refresh triggered - recalculating flame strengths');
    setLoading(true);
    try {
      // First load the basic data
      await loadFriendsData();
      // Then recalculate flame strengths with current data
      await recalculateFlameStrengths();
    } catch (error) {
      console.error('Error during manual refresh:', error);
    } finally {
      setLoading(false);
    }
  };

  const incomingRequests = friendRequests.filter(req => req.request_type === 'incoming' && req.status === 'pending');
  const outgoingRequests = friendRequests.filter(req => req.request_type === 'outgoing' && req.status === 'pending');

  // User's nickname from profile or fallback
  const userNickname = profile?.nickname || nickname || 'User';

  // Enhanced user connections with unread indicators
  const enhancedUserConnections = userConnections.map(connection => ({
    ...connection,
    hasUnreadMessages: (unreadCounts[connection.id] || 0) > 0,
    unreadCount: unreadCounts[connection.id] || 0
  }));

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Enable scrolling for smaller screens */}
      <div className="min-h-screen overflow-auto">
        {/* Header Section - Fixed at top */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left side - empty for balance */}
            <div className="w-12"></div>
            
            {/* Center - User's Hearth Title and Flame */}
            <div className="flex items-center gap-3">
              <Flame strength={0.8} size={32} animated={true} interactive={true} />
              <SmallText className="bg-gradient-to-r from-ember via-carmine to-ember bg-clip-text text-transparent font-medium text-lg whitespace-nowrap">
                {userNickname}'s Hearth
              </SmallText>
            </div>
            
            {/* Right side - Settings Button */}
            <div className="flex justify-end">
              <IconedButton
                icon={<Settings className="w-5 h-5" />}
                label="Settings"
                size="md"
                onClick={() => setShowSettings(true)}
              />
            </div>
          </div>
        </header>

        {/* Main Content - Hearth Display or Chat */}
        <main className="pt-20 min-h-screen">
          {showChat && selectedContact ? (
            /* Live Chat Interface - Full Screen */
            <div className="w-full h-screen pt-4 px-4 pb-4">
              <div className="w-full h-full max-w-4xl mx-auto">
                <LiveChatBox
                  contactUserId={selectedContact.id}
                  contactName={selectedContact.name || 'Unknown'}
                  connectionStrength={selectedContact.strength}
                  onClose={handleCloseChat}
                  height={window.innerHeight - 120} // Account for header and padding
                />
              </div>
            </div>
          ) : (
            /* Hearth Display */
            <div className="w-full min-h-screen flex items-center justify-center px-4 overflow-auto bg-black">
              <div className="w-full h-full relative">
                {/* Empty Hearth State - Simplified */}
                {userConnections.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center z-30">
                    <IconedButton
                      icon={<UserPlus className="w-6 h-6" />}
                      label="Add Friends"
                      size="lg"
                      onClick={() => {
                        setActiveTab('friends');
                        setShowSettings(true);
                      }}
                    />
                  </div>
                )}

                {/* Responsive Hearth Component with scrolling support */}
                <div 
                  className="w-full h-full overflow-auto scrollbar-hide"
                  style={{
                    minWidth: `${hearthDimensions.width}px`,
                    minHeight: `${hearthDimensions.height}px`
                  }}
                >
                  <Hearth
                    flames={enhancedUserConnections}
                    width={hearthDimensions.width}
                    height={hearthDimensions.height}
                    onFlameClick={handleFlameClick}
                    onRefresh={handleRefresh}
                    className="w-full h-full"
                    showUnreadIndicators={true}
                  />
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md">
              <BurningPaperCard glowOnHover className="relative max-h-[600px] flex flex-col">
                {/* Close Button - Positioned safely within card bounds */}
                <div className="absolute top-6 right-6 z-60">
                  <IconedButton
                    icon={<X className="w-4 h-4" />}
                    label="Close Settings"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowSettings(false)}
                  />
                </div>

                {/* Header Section - Fixed */}
                <div className="flex-shrink-0 px-6 pt-6 pb-4">
                  {/* Interactive Tab Navigation with Ember Effects */}
                  <div className="flex mb-4 relative">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`flex-1 px-4 py-3 text-center font-medium transition-all duration-300 relative overflow-visible ${
                        activeTab === 'profile'
                          ? 'text-ember border-b-2 border-ember'
                          : 'text-ash hover:text-softwhite'
                      }`}
                    >
                      {/* Ember particles for active tab - Only show when tab is active */}
                      {activeTab === 'profile' && Array.from({ length: 12 }).map((_, i) => (
                        <span
                          key={`profile-ember-${i}`}
                          className="absolute rounded-full pointer-events-none z-10 animate-ember"
                          style={{
                            width: `${1 + Math.random()}px`,
                            height: `${1 + Math.random()}px`,
                            backgroundColor: `rgb(255,191,0)`,
                            left: `${10 + Math.random() * 80}%`,
                            top: `${10 + Math.random() * 80}%`,
                            filter: 'blur(0.5px) brightness(2)',
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                            boxShadow: '0 0 3px currentColor',
                            mixBlendMode: 'screen'
                          } as React.CSSProperties}
                        />
                      ))}
                      <User className="w-4 h-4 inline mr-2" />
                      Profile
                    </button>
                    <button
                      onClick={() => setActiveTab('friends')}
                      className={`flex-1 px-4 py-3 text-center font-medium transition-all duration-300 relative overflow-visible ${
                        activeTab === 'friends'
                          ? 'text-ember border-b-2 border-ember'
                          : 'text-ash hover:text-softwhite'
                      }`}
                    >
                      {/* Ember particles for active tab - Only show when tab is active */}
                      {activeTab === 'friends' && Array.from({ length: 12 }).map((_, i) => (
                        <span
                          key={`friends-ember-${i}`}
                          className="absolute rounded-full pointer-events-none z-10 animate-ember"
                          style={{
                            width: `${1 + Math.random()}px`,
                            height: `${1 + Math.random()}px`,
                            backgroundColor: `rgb(255,191,0)`,
                            left: `${10 + Math.random() * 80}%`,
                            top: `${10 + Math.random() * 80}%`,
                            filter: 'blur(0.5px) brightness(2)',
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                            boxShadow: '0 0 3px currentColor',
                            mixBlendMode: 'screen'
                          } as React.CSSProperties}
                        />
                      ))}
                      <UserPlus className="w-4 h-4 inline mr-2" />
                      Friends
                    </button>
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div 
                  className="flex-1 overflow-y-auto px-6 scrollbar-hide"
                  style={{ 
                    maxHeight: '400px',
                    minHeight: '200px'
                  }}
                >
                  {activeTab === 'profile' && (
                    <div className="space-y-6 pb-4">
                      {/* Profile Validation Message */}
                      {profileMessage && (
                        <div className={`p-3 rounded-soft border flex items-start gap-3 ${
                          profileMessage.type === 'success' 
                            ? 'bg-ember/20 border-ember/50' 
                            : 'bg-carmine/20 border-carmine/50'
                        }`}>
                          {profileMessage.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-ember flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-carmine flex-shrink-0 mt-0.5" />
                          )}
                          <SmallText className={profileMessage.type === 'success' ? 'text-ember' : 'text-carmine'}>
                            {profileMessage.message}
                          </SmallText>
                        </div>
                      )}

                      <div>
                        <Heading3 className="mb-4">Profile Settings</Heading3>
                        
                        {/* Nickname Section */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-softwhite mb-2">
                              Nickname
                            </label>
                            <InputBox
                              value={nickname}
                              onChange={setNickname}
                              placeholder="Your display name"
                            />
                          </div>
                          
                          <div className="pt-2">
                            <EmberButton size="sm" onClick={handleSaveProfile}>
                              Save Profile
                            </EmberButton>
                          </div>
                        </div>

                        {/* Unique Code Section */}
                        <div className="my-8 pt-6 border-t border-ember/30">
                          <Heading3 className="text-lg mb-4">Your Unique Code</Heading3>
                          <TextBlock className="text-sm text-ash mb-4">
                            Share this code with friends so they can add you to their hearth.
                          </TextBlock>
                          
                          <div className="flex items-center gap-3 p-3 bg-navy/40 rounded border border-ember/30">
                            <code className="flex-1 text-ember font-mono text-sm bg-dark/50 px-3 py-2 rounded">
                              {profile?.unique_code || 'Loading...'}
                            </code>
                            <IconedButton
                              icon={<Copy className="w-4 h-4" />}
                              label="Copy Code"
                              size="sm"
                              variant="ghost"
                              onClick={copyUniqueCode}
                            />
                          </div>
                        </div>

                        {/* Password Change Section */}
                        <div className="space-y-4 pt-6 border-t border-ember/30">
                          <Heading3 className="text-lg">Change Password</Heading3>
                          
                          <div>
                            <label className="block text-sm font-medium text-softwhite mb-2">
                              Current Password
                            </label>
                            <PasswordInput
                              value={currentPassword}
                              onChange={setCurrentPassword}
                              placeholder="Enter current password"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-softwhite mb-2">
                              New Password
                            </label>
                            <PasswordInput
                              value={newPassword}
                              onChange={setNewPassword}
                              placeholder="Enter new password"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-softwhite mb-2">
                              Confirm New Password
                            </label>
                            <PasswordInput
                              value={confirmPassword}
                              onChange={setConfirmPassword}
                              placeholder="Confirm new password"
                            />
                          </div>

                          <div className="pt-2">
                            <EmberButton size="sm" onClick={handlePasswordChange}>
                              Change Password
                            </EmberButton>
                          </div>
                        </div>

                        {/* Account Actions Section */}
                        <div className="space-y-4 pt-6 border-t border-ember/30">
                          <Heading3 className="text-lg">Account Actions</Heading3>
                          
                          <div className="space-y-3">
                            <button
                              onClick={handleLogout}
                              className="w-full px-4 py-2 text-sm bg-navy/40 text-softwhite border border-ember/30 rounded-soft hover:bg-navy/60 hover:border-ember/50 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                              Log Out
                            </button>
                            
                            <button
                              onClick={handleDeleteAccount}
                              className="w-full px-4 py-2 text-sm bg-carmine/20 text-carmine border border-carmine/50 rounded-soft hover:bg-carmine/30 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Account
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'friends' && (
                    <div className="space-y-6 pb-4">
                      {/* Friends Validation Message */}
                      {friendsMessage && (
                        <div className={`p-3 rounded-soft border flex items-start gap-3 ${
                          friendsMessage.type === 'success' 
                            ? 'bg-ember/20 border-ember/50' 
                            : 'bg-carmine/20 border-carmine/50'
                        }`}>
                          {friendsMessage.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-ember flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-carmine flex-shrink-0 mt-0.5" />
                          )}
                          <SmallText className={friendsMessage.type === 'success' ? 'text-ember' : 'text-carmine'}>
                            {friendsMessage.message}
                          </SmallText>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Heading3>Add Friend</Heading3>
                          <IconedButton
                            icon={<RefreshCw className="w-4 h-4" />}
                            label="Refresh"
                            size="sm"
                            variant="ghost"
                            onClick={handleRefresh}
                          />
                        </div>
                        <TextBlock className="text-sm text-ash mb-6">
                          Enter a username or unique code to send a friend request. Once accepted, their ember will appear in your hearth.
                        </TextBlock>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-softwhite mb-2">
                              Username or Unique Code
                            </label>
                            <InputBox
                              value={friendUsername}
                              onChange={setFriendUsername}
                              placeholder="Enter username or EMBR-XXXXXXXX"
                            />
                          </div>
                          
                          <div className="pt-2">
                            <EmberButton 
                              size="sm" 
                              onClick={handleAddFriend}
                              disabled={loading}
                            >
                              {loading ? 'Sending...' : 'Send Friend Request'}
                            </EmberButton>
                          </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                          <div className="mt-4 p-3 bg-carmine/20 border border-carmine/50 rounded">
                            <SmallText className="text-carmine">{error}</SmallText>
                          </div>
                        )}

                        {/* Incoming Friend Requests Section */}
                        <div className="mt-8 pt-6 border-t border-ember/30">
                          <Heading3 className="text-lg mb-4 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-ember" />
                            Incoming Requests
                          </Heading3>
                          
                          <div className="space-y-3">
                            {incomingRequests.length > 0 ? (
                              incomingRequests.map((request) => (
                                <div key={request.request_id} className="flex items-center justify-between p-3 bg-navy/40 rounded border border-ember/30 transition-all duration-300 hover:border-ember/50">
                                  <div>
                                    <SmallText className="font-medium text-softwhite">{request.sender_nickname}</SmallText>
                                    <TinyText className="text-ash block">{formatTimeAgo(request.created_at)}</TinyText>
                                  </div>
                                  <div className="flex gap-2">
                                    {request.status === 'pending' ? (
                                      <>
                                        <IconedButton
                                          icon={<CheckCircle className="w-4 h-4" />}
                                          label="Accept"
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleAcceptRequest(request.request_id)}
                                          className="text-ember hover:bg-ember/20"
                                        />
                                        <IconedButton
                                          icon={<XCircle className="w-4 h-4" />}
                                          label="Decline"
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleDeclineRequest(request.request_id)}
                                          className="text-carmine hover:bg-carmine/20"
                                        />
                                      </>
                                    ) : request.status === 'accepted' ? (
                                      <span className="px-3 py-1 text-xs bg-ember/20 text-ember rounded">Accepted</span>
                                    ) : (
                                      <span className="px-3 py-1 text-xs bg-carmine/20 text-carmine rounded">Declined</span>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6">
                                <UserPlus className="w-8 h-8 text-ash mx-auto mb-2 opacity-50" />
                                <SmallText className="text-ash">No incoming friend requests</SmallText>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Outgoing Friend Requests Section */}
                        <div className="pt-6 border-t border-ember/30">
                          <Heading3 className="text-lg mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-ember" />
                            Sent Requests
                          </Heading3>
                          
                          <div className="space-y-3">
                            {outgoingRequests.length > 0 ? (
                              outgoingRequests.map((request) => (
                                <div key={request.request_id} className="flex items-center justify-between p-3 bg-deepblue/40 rounded border border-ember/20 transition-all duration-300 hover:border-ember/40">
                                  <div>
                                    <SmallText className="font-medium text-softwhite">{request.receiver_nickname}</SmallText>
                                    <TinyText className="text-ash block">{formatTimeAgo(request.created_at)}</TinyText>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-ash" />
                                    <span className="px-3 py-1 text-xs bg-ash/20 text-ash rounded">Pending</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6">
                                <Clock className="w-8 h-8 text-ash mx-auto mb-2 opacity-50" />
                                <SmallText className="text-ash">No pending sent requests</SmallText>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer - Fixed at bottom */}
                <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-ember/30">
                  <SmallText className="text-center text-ash">
                    Your connections are private and secure.
                  </SmallText>
                </div>
              </BurningPaperCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};