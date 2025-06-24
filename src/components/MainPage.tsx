import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth/AuthProvider';
import { LiveChatBox } from './ui/LiveChatBox';
import { MainPageHeader } from './main/MainPageHeader';
import { HearthDisplay } from './main/HearthDisplay';
import { SettingsModal } from './main/settings/SettingsModal';
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
  
  // Profile state
  const [nickname, setNickname] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Friends state
  const [friendUsername, setFriendUsername] = useState('');
  const [hearthDimensions, setHearthDimensions] = useState({ width: 800, height: 600 });
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [userConnections, setUserConnections] = useState<FlameData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<{ [userId: string]: number }>({});

  // Validation messages for both tabs
  const [profileMessage, setProfileMessage] = useState<ValidationMessage | null>(null);
  const [friendsMessage, setFriendsMessage] = useState<ValidationMessage | null>(null);

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

  // Update hearth dimensions based on window size
  useEffect(() => {
    const updateDimensions = () => {
      const padding = 32;
      const headerHeight = 88;
      const bottomPadding = 32;
      
      const availableWidth = window.innerWidth - padding;
      const availableHeight = window.innerHeight - headerHeight - bottomPadding;
      
      setHearthDimensions({
        width: Math.max(320, availableWidth),
        height: Math.max(240, availableHeight)
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Load friends and friend requests
  const loadFriendsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

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

      setFriends(friendsData);
      setFriendRequests(requestsData);

      const flameData = convertFriendsToFlames(friendsData);
      setUserConnections(flameData);

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

  // Recalculate flame strengths
  const recalculateFlameStrengths = useCallback(async () => {
    try {
      const { data: friendsData, error } = await getFriends();
      
      if (error || !friendsData) {
        console.error('Failed to get friends for strength calculation:', error);
        return;
      }
      
      const updatedFriends = await Promise.all(
        friendsData.map(async (friend) => {
          try {
            const strength = await calculateFlameStrength(friend.friend_id);
            return {
              ...friend,
              connection_strength: strength
            };
          } catch (err) {
            console.error(`Failed to calculate strength for ${friend.friend_id}:`, err);
            return friend;
          }
        })
      );
      
      setFriends(updatedFriends);
      const updatedFlameData = convertFriendsToFlames(updatedFriends);
      setUserConnections(updatedFlameData);
      
    } catch (error) {
      console.error('Error recalculating flame strengths:', error);
    }
  }, []);

  // Set up real-time subscription for conversations
  useEffect(() => {
    const unsubscribe = messagingSubscriptionManager.subscribeToConversations(() => {
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
      if (activeTab === 'friends') {
        loadFriendsData();
      }
    };

    const handleFriendRequestResponded = () => {
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

  // Polling intervals
  useEffect(() => {
    if (activeTab === 'friends' && !friendsPollingActive) {
      setFriendsPollingActive(true);
      
      const interval = setInterval(() => {
        getFriendRequests().then(({ data, error }) => {
          if (!error && data) {
            setFriendRequests(data);
          }
        });
      }, 5000);
      
      return () => {
        clearInterval(interval);
        setFriendsPollingActive(false);
      };
    }
  }, [activeTab, friendsPollingActive]);

  useEffect(() => {
    if (!showChat && unreadCountsPollingActive) {
      const interval = setInterval(() => {
        if (friends.length > 0) {
          loadUnreadCounts(friends);
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [showChat, unreadCountsPollingActive, friends]);

  useEffect(() => {
    if (flameStrengthPollingActive) {
      recalculateFlameStrengths();
      
      const interval = setInterval(() => {
        recalculateFlameStrengths();
      }, 30 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [flameStrengthPollingActive, recalculateFlameStrengths]);

  // Event handlers
  const handlePasswordChange = async () => {
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
    setFriendsMessage(null);

    if (!friendUsername.trim()) {
      setFriendsMessage({ type: 'error', message: 'Please enter a username or unique code' });
      return;
    }
    
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
      } else {
        throw new Error(data?.error || 'Failed to send friend request');
      }
    } catch (error: any) {
      setFriendsMessage({ type: 'error', message: error.message || 'Failed to send friend request' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
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
      } else {
        throw new Error(data?.error || 'Failed to accept friend request');
      }
    } catch (error: any) {
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
      } else {
        throw new Error(data?.error || 'Failed to decline friend request');
      }
    } catch (error: any) {
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
    }
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedContact(null);
    if (friends.length > 0) {
      loadUnreadCounts(friends);
    }
  };

  const incomingRequests = friendRequests.filter(req => req.request_type === 'incoming' && req.status === 'pending');
  const outgoingRequests = friendRequests.filter(req => req.request_type === 'outgoing' && req.status === 'pending');

  const userNickname = profile?.nickname || nickname || 'User';

  const enhancedUserConnections = userConnections.map(connection => ({
    ...connection,
    hasUnreadMessages: (unreadCounts[connection.id] || 0) > 0,
    unreadCount: unreadCounts[connection.id] || 0
  }));

  return (
    <div className="min-h-screen bg-black text-white relative">
      <div className="min-h-screen overflow-auto">
        <MainPageHeader
          userNickname={userNickname}
          onSettingsClick={() => setShowSettings(true)}
        />

        <main className="pt-20 min-h-screen">
          {showChat && selectedContact ? (
            <div className="w-full h-screen pt-4 px-4 pb-4">
              <div className="w-full h-full max-w-4xl mx-auto">
                <LiveChatBox
                  contactUserId={selectedContact.id}
                  contactName={selectedContact.name || 'Unknown'}
                  connectionStrength={selectedContact.strength}
                  onClose={handleCloseChat}
                  height={window.innerHeight - 120}
                />
              </div>
            </div>
          ) : (
            <HearthDisplay
              userConnections={enhancedUserConnections}
              hearthDimensions={hearthDimensions}
              onFlameClick={handleFlameClick}
              onRefresh={loadFriendsData}
              onAddFriends={() => {
                setActiveTab('friends');
                setShowSettings(true);
              }}
            />
          )}
        </main>

        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          profileMessage={profileMessage}
          friendsMessage={friendsMessage}
          // Profile props
          nickname={nickname}
          onNicknameChange={setNickname}
          currentPassword={currentPassword}
          onCurrentPasswordChange={setCurrentPassword}
          newPassword={newPassword}
          onNewPasswordChange={setNewPassword}
          confirmPassword={confirmPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onSaveProfile={handleSaveProfile}
          onPasswordChange={handlePasswordChange}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
          onCopyUniqueCode={copyUniqueCode}
          uniqueCode={profile?.unique_code || ''}
          copySuccess={copySuccess}
          // Friends props
          friendUsername={friendUsername}
          onFriendUsernameChange={setFriendUsername}
          onAddFriend={handleAddFriend}
          onRefreshFriends={loadFriendsData}
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
          onAcceptRequest={handleAcceptRequest}
          onDeclineRequest={handleDeclineRequest}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};