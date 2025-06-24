import React, { useState, useEffect, useCallback } from 'react';
import { LiveChatBox } from './ui/LiveChatBox';
import { MainPageHeader } from './main/MainPageHeader';
import { HearthDisplay } from './main/HearthDisplay';
import { SettingsModal } from './main/SettingsModal';
import { useAuth } from './auth/AuthProvider';
import { 
  sendFriendRequest, 
  respondToFriendRequest, 
  getFriendRequests, 
  getFriends, 
  convertFriendsToFlames,
  formatTimeAgo,
  validateUniqueCode,
  type FriendRequest,
  type Friend,
  type FlameData
} from '../lib/friends';
import { getUnreadCountForUser, messagingSubscriptionManager } from '../lib/messaging';
import { updateProfile, changePassword, signOut, deleteAccount } from '../lib/auth';
import { calculateFlameStrength } from '../lib/flameStrength';

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

  // Polling intervals
  const [friendsPollingActive, setFriendsPollingActive] = useState(false);
  const [unreadCountsPollingActive, setUnreadCountsPollingActive] = useState(true);
  const [flameStrengthPollingActive, setFlameStrengthPollingActive] = useState(true);

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

      // Convert friends to flame data for hearth
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
      
      // For each friend, calculate the actual strength based on the formula
      const updatedFriends = await Promise.all(
        friendsData.map(async (friend) => {
          try {
            // Calculate strength using the formula
            const strength = await calculateFlameStrength(friend.friend_id);
            return {
              ...friend,
              connection_strength: strength
            };
          } catch (err) {
            console.error(`Failed to calculate strength for ${friend.friend_id}:`, err);
            return friend; // Keep original strength on error
          }
        })
      );
      
      // Update friends with new strengths
      setFriends(updatedFriends);
      
      // Convert to updated flame data
      const updatedFlameData = convertFriendsToFlames(updatedFriends);
      setUserConnections(updatedFlameData);
      
      console.log('Flame strengths recalculated successfully');
    } catch (error) {
      console.error('Error recalculating flame strengths:', error);
    }
  }, []);

  // Set up real-time subscription for conversations
  useEffect(() => {
    const unsubscribe = messagingSubscriptionManager.subscribeToConversations(() => {
      console.log('Conversations updated, refreshing unread counts...');
      if (friends.length > 0) {
        loadUnreadCounts(friends);
      }
    });

    return unsubscribe;
  }, [friends]);

  // Load data on component mount
  useEffect(() => {
    loadFriendsData();
  }, [loadFriendsData]);

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
        loadFriendsData();
      }
    };

    window.addEventListener('friendRequestSent', handleFriendRequestSent);
    window.addEventListener('friendRequestResponded', handleFriendRequestResponded);

    return () => {
      window.removeEventListener('friendRequestSent', handleFriendRequestSent);
      window.removeEventListener('friendRequestResponded', handleFriendRequestResponded);
    };
  }, [activeTab, loadFriendsData]);

  // 5-second polling for friend requests when friends tab is open
  useEffect(() => {
    if (activeTab === 'friends' && !friendsPollingActive) {
      setFriendsPollingActive(true);
      
      const interval = setInterval(() => {
        console.log('Polling for friend requests...');
        getFriendRequests().then(({ data, error }) => {
          if (!error && data) {
            setFriendRequests(data);
          }
        });
      }, 5000); // 5 seconds
      
      return () => {
        clearInterval(interval);
        setFriendsPollingActive(false);
      };
    }
  }, [activeTab, friendsPollingActive]);

  // 5-second polling for unread message counts when hearth is visible
  useEffect(() => {
    if (!showChat && unreadCountsPollingActive) {
      const interval = setInterval(() => {
        console.log('Polling for unread message counts...');
        if (friends.length > 0) {
          loadUnreadCounts(friends);
        }
      }, 5000); // 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [showChat, unreadCountsPollingActive, friends]);

  // 30-minute polling for flame strength recalculation
  useEffect(() => {
    if (flameStrengthPollingActive) {
      // Initial calculation
      recalculateFlameStrengths();
      
      const interval = setInterval(() => {
        console.log('Recalculating flame strengths (30-minute interval)...');
        recalculateFlameStrengths();
      }, 30 * 60 * 1000); // 30 minutes
      
      return () => clearInterval(interval);
    }
  }, [flameStrengthPollingActive, recalculateFlameStrengths]);

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
        // The custom event will trigger refresh automatically
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
        // The custom event will trigger refresh automatically
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
        // The custom event will trigger refresh automatically
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
        <MainPageHeader
          userNickname={userNickname}
          onSettingsClick={() => setShowSettings(true)}
        />

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
            <HearthDisplay
              userConnections={enhancedUserConnections}
              hearthDimensions={hearthDimensions}
              onFlameClick={handleFlameClick}
              onRefresh={loadFriendsData}
              onAddFriends={() => {
                setActiveTab('friends');
                setShowSettings(true);
              }}
              showUnreadIndicators={true}
            />
          )}
        </main>

        {/* Settings Modal */}
        <SettingsModal
          showSettings={showSettings}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => setShowSettings(false)}
          
          // Profile props
          nickname={nickname}
          setNickname={setNickname}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          profileMessage={profileMessage}
          uniqueCode={profile?.unique_code || 'EMBR-XXXXXXXX'}
          copySuccess={copySuccess}
          onSaveProfile={handleSaveProfile}
          onPasswordChange={handlePasswordChange}
          onCopyUniqueCode={copyUniqueCode}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
          
          // Friends props
          friendUsername={friendUsername}
          setFriendUsername={setFriendUsername}
          friendsMessage={friendsMessage}
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
          loading={loading}
          error={error}
          onAddFriend={handleAddFriend}
          onRefresh={loadFriendsData}
          onAcceptRequest={handleAcceptRequest}
          onDeclineRequest={handleDeclineRequest}
          formatTimeAgo={formatTimeAgo}
        />
      </div>
    </div>
  );
};