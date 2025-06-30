import React, { useState, useEffect, useCallback } from 'react';
import { IconedButton } from './ui/IconedButton';
import { LiveChatBox } from './ui/LiveChatBox';
import { Hearth } from './ui/Hearth';
import { UserPlus } from 'lucide-react';
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
import { MainPageHeader } from './MainPageHeader';
import { SettingsModal } from './SettingsModal';

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

  // Background polling states
  const [backgroundPollingActive, setBackgroundPollingActive] = useState(true);
  const [friendRequestPollingActive, setFriendRequestPollingActive] = useState(true);
  const [periodicRefreshActive, setPeriodicRefreshActive] = useState(true);

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

  // Recalculate flame strengths and update display - no loading screen
  const recalculateFlameStrengths = useCallback(async () => {
    try {
      console.log('Recalculating flame strengths silently...');
      
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
      
      // Convert to updated flame data and display
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

  // Background polling for friend requests and their status changes
  useEffect(() => {
    if (friendRequestPollingActive) {
      console.log('Starting background polling for friend requests');
      
      const interval = setInterval(async () => {
        try {
          // Get current friend requests
          const { data: currentRequests, error } = await getFriendRequests();
          
          if (!error && currentRequests) {
            const previousRequestCount = friendRequests.length;
            const currentRequestCount = currentRequests.length;
            
            // Check for new incoming requests
            const newIncomingRequests = currentRequests.filter(req => 
              req.request_type === 'incoming' && 
              req.status === 'pending' &&
              !friendRequests.some(existing => existing.request_id === req.request_id)
            );
            
            // Check for accepted outgoing requests (new friendships)
            const acceptedRequests = friendRequests.filter(req => 
              req.request_type === 'outgoing' && 
              req.status === 'pending' &&
              !currentRequests.some(current => 
                current.request_id === req.request_id && current.status === 'pending'
              )
            );
            
            // Update friend requests state
            setFriendRequests(currentRequests);
            
            // If we have new incoming requests, show notification
            if (newIncomingRequests.length > 0) {
              console.log(`${newIncomingRequests.length} new friend request(s) received`);
              setFriendsMessage({ 
                type: 'success', 
                message: `${newIncomingRequests.length} new friend request(s) received!` 
              });
            }
            
            // If outgoing requests were accepted, refresh hearth
            if (acceptedRequests.length > 0) {
              console.log(`${acceptedRequests.length} friend request(s) accepted, refreshing hearth`);
              await loadFriendsData();
              await recalculateFlameStrengths();
              setFriendsMessage({ 
                type: 'success', 
                message: `${acceptedRequests.length} friend request(s) accepted! Hearth updated.` 
              });
            }
          }
        } catch (error) {
          console.error('Error in friend request polling:', error);
        }
      }, 10000); // Poll every 10 seconds for friend requests
      
      return () => {
        console.log('Stopping friend request polling');
        clearInterval(interval);
      };
    }
  }, [friendRequestPollingActive, friendRequests, loadFriendsData, recalculateFlameStrengths]);

  // Background polling for unread messages when chat is not open
  useEffect(() => {
    if (!showChat && backgroundPollingActive && friends.length > 0) {
      console.log('Starting background polling for unread messages');
      
      const interval = setInterval(async () => {
        try {
          // Check for new unread messages
          const newUnreadCounts: { [userId: string]: number } = {};
          let hasNewUnread = false;
          
          await Promise.all(
            friends.map(async (friend) => {
              const count = await getUnreadCountForUser(friend.friend_id);
              if (count > 0) {
                newUnreadCounts[friend.friend_id] = count;
                // Check if this is a new unread message
                if (count > (unreadCounts[friend.friend_id] || 0)) {
                  hasNewUnread = true;
                }
              }
            })
          );
          
          // Update unread counts
          setUnreadCounts(newUnreadCounts);
          
          // If there are new unread messages, recalculate flame strengths
          if (hasNewUnread) {
            console.log('New unread messages detected, updating flame strengths');
            recalculateFlameStrengths();
          }
        } catch (error) {
          console.error('Error in background polling:', error);
        }
      }, 5000); // Poll every 5 seconds
      
      return () => {
        console.log('Stopping background polling');
        clearInterval(interval);
      };
    }
  }, [showChat, backgroundPollingActive, friends, unreadCounts, recalculateFlameStrengths]);

  // Periodic hearth refresh every 30 minutes when chat is not open
  useEffect(() => {
    if (!showChat && periodicRefreshActive) {
      console.log('Starting periodic hearth refresh (30 minutes)');
      
      const interval = setInterval(async () => {
        console.log('Performing periodic hearth refresh...');
        try {
          await loadFriendsData();
          await recalculateFlameStrengths();
          console.log('Periodic hearth refresh completed');
        } catch (error) {
          console.error('Error in periodic refresh:', error);
        }
      }, 30 * 60 * 1000); // 30 minutes
      
      return () => {
        console.log('Stopping periodic refresh');
        clearInterval(interval);
      };
    }
  }, [showChat, periodicRefreshActive, loadFriendsData, recalculateFlameStrengths]);

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
        <SettingsModal
          showSettings={showSettings}
          activeTab={activeTab}
          onClose={() => setShowSettings(false)}
          onTabChange={setActiveTab}
          nickname={nickname}
          onNicknameChange={setNickname}
          currentPassword={currentPassword}
          onCurrentPasswordChange={setCurrentPassword}
          newPassword={newPassword}
          onNewPasswordChange={setNewPassword}
          confirmPassword={confirmPassword}
          onConfirmPasswordChange={setConfirmPassword}
          profileMessage={profileMessage}
          uniqueCode={profile?.unique_code || ''}
          onSaveProfile={handleSaveProfile}
          onChangePassword={handlePasswordChange}
          onCopyUniqueCode={copyUniqueCode}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
          friendUsername={friendUsername}
          onFriendUsernameChange={setFriendUsername}
          friendsMessage={friendsMessage}
          error={error}
          loading={loading}
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
          onAddFriend={handleAddFriend}
          onRefresh={handleRefresh}
          onAcceptRequest={handleAcceptRequest}
          onDeclineRequest={handleDeclineRequest}
        />
      </div>
    </div>
  );
};