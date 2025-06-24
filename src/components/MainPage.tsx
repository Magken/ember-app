import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './auth/AuthProvider';
import { BurningPaperCard } from './ui/Card';
import { EmberButton } from './ui/Button';
import { IconedButton } from './ui/IconedButton';
import { Hearth } from './ui/Hearth';
import { Heading1, Heading2, TextBlock, SmallText } from './ui/Typography';
import { Flame } from './ui/Flame';
import { 
  getFriends, 
  getFriendRequests, 
  convertFriendsToFlames,
  sendFriendRequest,
  respondToFriendRequest,
  checkUniqueCodeExists,
  validateUniqueCode,
  formatTimeAgo,
  useFriendRequestsSubscription,
  useFriendshipsSubscription,
  type Friend,
  type FriendRequest,
  type FlameData
} from '../lib/friends';
import { 
  getUserConversations,
  hasUnreadMessages,
  getUnreadCountForUser,
  messagingSubscriptionManager,
  type Conversation
} from '../lib/messaging';
import { calculateFlameStrengthsBatch } from '../lib/flameStrength';
import { 
  Users, 
  MessageCircle, 
  UserPlus, 
  Check, 
  X, 
  Send, 
  AlertCircle, 
  CheckCircle,
  Settings,
  LogOut,
  Copy,
  RefreshCw,
  Mail,
  Clock,
  Flame as FlameIcon
} from 'lucide-react';

export const MainPage: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [flames, setFlames] = useState<FlameData[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Friend request form state
  const [uniqueCode, setUniqueCode] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'hearth' | 'friends' | 'requests'>('hearth');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Unread messages state
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState<{ [userId: string]: number }>({});
  
  // Refs for cleanup
  const friendRequestsUnsubscribeRef = useRef<(() => void) | null>(null);
  const friendshipsUnsubscribeRef = useRef<(() => void) | null>(null);
  const conversationsUnsubscribeRef = useRef<(() => void) | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load friends and convert to flames with strength calculation
  const loadFriendsAndFlames = useCallback(async () => {
    try {
      console.log('Loading friends and flames...');
      const { data: friendsData, error: friendsError } = await getFriends();
      
      if (friendsError) {
        throw friendsError;
      }
      
      if (friendsData && friendsData.length > 0) {
        console.log('Friends loaded:', friendsData.length);
        setFriends(friendsData);
        
        // Calculate flame strengths for all friends
        const friendIds = friendsData.map(friend => friend.friend_id);
        const strengths = await calculateFlameStrengthsBatch(friendIds);
        
        // Convert to flames with calculated strengths
        const baseFlames = convertFriendsToFlames(friendsData);
        const flamesWithStrength = baseFlames.map(flame => ({
          ...flame,
          strength: strengths[flame.id] || 0.1 // Default to low strength if calculation fails
        }));
        
        console.log('Flames with calculated strengths:', flamesWithStrength);
        setFlames(flamesWithStrength);
        
        // Load unread counts for each friend
        const unreadPromises = friendsData.map(async (friend) => {
          const count = await getUnreadCountForUser(friend.friend_id);
          return { userId: friend.friend_id, count };
        });
        
        const unreadResults = await Promise.all(unreadPromises);
        const unreadMap: { [userId: string]: number } = {};
        unreadResults.forEach(({ userId, count }) => {
          unreadMap[userId] = count;
        });
        
        setUnreadCounts(unreadMap);
        console.log('Unread counts loaded:', unreadMap);
      } else {
        console.log('No friends found');
        setFriends([]);
        setFlames([]);
        setUnreadCounts({});
      }
    } catch (err: any) {
      console.error('Error loading friends:', err);
      setError(err.message || 'Failed to load friends');
    }
  }, []);

  // Load friend requests
  const loadFriendRequests = useCallback(async () => {
    try {
      console.log('Loading friend requests...');
      const { data: requestsData, error: requestsError } = await getFriendRequests();
      
      if (requestsError) {
        throw requestsError;
      }
      
      console.log('Friend requests loaded:', requestsData?.length || 0);
      setFriendRequests(requestsData || []);
    } catch (err: any) {
      console.error('Error loading friend requests:', err);
      setError(err.message || 'Failed to load friend requests');
    }
  }, []);

  // Initialize subscription managers
  const friendRequestsSubscription = useFriendRequestsSubscription(loadFriendRequests);
  const friendshipsSubscription = useFriendshipsSubscription(loadFriendsAndFlames);

  // Load conversations and unread counts
  const loadConversations = useCallback(async () => {
    try {
      console.log('Loading conversations...');
      const { data: conversationsData, error: conversationsError } = await getUserConversations();
      
      if (conversationsError) {
        throw conversationsError;
      }
      
      console.log('Conversations loaded:', conversationsData?.length || 0);
      setConversations(conversationsData || []);
      
      // Calculate total unread count
      const total = conversationsData?.reduce((sum, conv) => sum + conv.unread_count, 0) || 0;
      setTotalUnreadCount(total);
      console.log('Total unread messages:', total);
    } catch (err: any) {
      console.error('Error loading conversations:', err);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          loadFriendsAndFlames(),
          loadFriendRequests(),
          loadConversations()
        ]);
      } catch (err: any) {
        console.error('Error loading initial data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadInitialData();
    }
  }, [user, loadFriendsAndFlames, loadFriendRequests, loadConversations]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (user) {
      console.log('Setting up real-time subscriptions...');
      
      // Subscribe to friend requests changes
      friendRequestsUnsubscribeRef.current = friendRequestsSubscription.subscribe();
      
      // Subscribe to friendships changes
      friendshipsUnsubscribeRef.current = friendshipsSubscription.subscribe();
      
      // Subscribe to conversations changes
      conversationsUnsubscribeRef.current = messagingSubscriptionManager.subscribeToConversations(() => {
        console.log('Conversations updated, reloading...');
        loadConversations();
        loadFriendsAndFlames(); // Refresh flames when conversations change
      });
    }

    return () => {
      // Cleanup subscriptions
      if (friendRequestsUnsubscribeRef.current) {
        friendRequestsUnsubscribeRef.current();
      }
      if (friendshipsUnsubscribeRef.current) {
        friendshipsUnsubscribeRef.current();
      }
      if (conversationsUnsubscribeRef.current) {
        conversationsUnsubscribeRef.current();
      }
    };
  }, [user, loadConversations, loadFriendsAndFlames]);

  // Set up background polling for friend requests and conversations
  useEffect(() => {
    if (user) {
      console.log('Setting up background polling...');
      
      // Poll every 30 seconds for friend requests and conversations
      pollIntervalRef.current = setInterval(async () => {
        console.log('Background polling: checking for updates...');
        try {
          await Promise.all([
            loadFriendRequests(),
            loadConversations()
          ]);
        } catch (error) {
          console.error('Background polling error:', error);
        }
      }, 30000); // 30 seconds
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [user, loadFriendRequests, loadConversations]);

  // Set up hearth refresh every 30 minutes (only when not actively chatting)
  useEffect(() => {
    if (user && flames.length > 0) {
      console.log('Setting up hearth refresh timer...');
      
      // Refresh hearth every 30 minutes
      refreshIntervalRef.current = setInterval(async () => {
        console.log('Refreshing hearth (30 min timer)...');
        try {
          await loadFriendsAndFlames();
        } catch (error) {
          console.error('Hearth refresh error:', error);
        }
      }, 30 * 60 * 1000); // 30 minutes
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [user, flames.length, loadFriendsAndFlames]);

  // Listen for custom events (friend request sent/responded)
  useEffect(() => {
    const handleFriendRequestSent = () => {
      console.log('Friend request sent event received');
      setTimeout(() => {
        loadFriendRequests();
      }, 1000);
    };

    const handleFriendRequestResponded = (event: CustomEvent) => {
      console.log('Friend request responded event received:', event.detail);
      setTimeout(() => {
        loadFriendRequests();
        if (event.detail?.accepted) {
          loadFriendsAndFlames(); // Refresh friends if request was accepted
        }
      }, 1000);
    };

    const handleMessageSent = () => {
      console.log('Message sent event received');
      setTimeout(() => {
        loadFriendsAndFlames(); // Refresh flame strengths when messages are sent
        loadConversations(); // Refresh conversations
      }, 1000);
    };

    window.addEventListener('friendRequestSent', handleFriendRequestSent);
    window.addEventListener('friendRequestResponded', handleFriendRequestResponded as EventListener);
    window.addEventListener('messageSent', handleMessageSent);

    return () => {
      window.removeEventListener('friendRequestSent', handleFriendRequestSent);
      window.removeEventListener('friendRequestResponded', handleFriendRequestResponded as EventListener);
      window.removeEventListener('messageSent', handleMessageSent);
    };
  }, [loadFriendRequests, loadFriendsAndFlames, loadConversations]);

  // Handle sending friend request
  const handleSendFriendRequest = async () => {
    if (!uniqueCode.trim()) {
      setRequestError('Please enter a unique code');
      return;
    }

    if (!validateUniqueCode(uniqueCode)) {
      setRequestError('Invalid unique code format. Must be EMBR-XXXXXXXX');
      return;
    }

    setSendingRequest(true);
    setRequestError(null);
    setRequestSuccess(null);

    try {
      // First check if the code exists and can be added
      const { data: checkData, error: checkError } = await checkUniqueCodeExists(uniqueCode);
      
      if (checkError) {
        throw checkError;
      }

      if (!checkData?.exists) {
        throw new Error(checkData?.error || 'User not found with that unique code');
      }

      if (!checkData?.can_add) {
        throw new Error(checkData?.reason || 'Cannot send friend request to this user');
      }

      // Send the friend request
      const { data, error } = await sendFriendRequest(uniqueCode, requestMessage || undefined);
      
      if (error) {
        throw error;
      }

      setRequestSuccess('Friend request sent successfully!');
      setUniqueCode('');
      setRequestMessage('');
      setShowAddFriend(false);
      
      // Refresh friend requests after a short delay
      setTimeout(() => {
        loadFriendRequests();
      }, 1000);
      
    } catch (err: any) {
      setRequestError(err.message || 'Failed to send friend request');
    } finally {
      setSendingRequest(false);
    }
  };

  // Handle responding to friend request
  const handleRespondToRequest = async (requestId: string, response: 'accepted' | 'declined') => {
    try {
      const { data, error } = await respondToFriendRequest(requestId, response);
      
      if (error) {
        throw error;
      }

      console.log(`Friend request ${response}:`, data);
      
      // Refresh data after response
      setTimeout(() => {
        loadFriendRequests();
        if (response === 'accepted') {
          loadFriendsAndFlames(); // Refresh friends if accepted
        }
      }, 1000);
      
    } catch (err: any) {
      console.error(`Error ${response} friend request:`, err);
      setError(err.message || `Failed to ${response} friend request`);
    }
  };

  // Handle copying unique code
  const handleCopyCode = async () => {
    if (profile?.unique_code) {
      try {
        await navigator.clipboard.writeText(profile.unique_code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    }
  };

  // Handle flame click (start conversation)
  const handleFlameClick = (flameId: string) => {
    console.log('Flame clicked:', flameId);
    // Here you would typically open a chat interface
    // For now, we'll just log it
  };

  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadFriendsAndFlames(),
        loadFriendRequests(),
        loadConversations()
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Get pending friend requests counts
  const incomingRequests = friendRequests.filter(req => req.request_type === 'incoming' && req.status === 'pending');
  const outgoingRequests = friendRequests.filter(req => req.request_type === 'outgoing' && req.status === 'pending');

  // Enhanced flames with unread indicators
  const flamesWithUnread = flames.map(flame => ({
    ...flame,
    hasUnreadMessages: (unreadCounts[flame.id] || 0) > 0,
    unreadCount: unreadCounts[flame.id] || 0
  }));

  if (loading && flames.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-ember rounded-full mx-auto animate-pulse mb-4" />
          <SmallText className="text-ash">Loading your hearth...</SmallText>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Flame strength={0.8} size={40} animated={true} />
            <div>
              <Heading1 className="text-3xl bg-gradient-to-r from-ember via-carmine to-ember bg-clip-text text-transparent">
                Your Hearth
              </Heading1>
              <SmallText className="text-ash">
                Welcome back, {profile?.nickname}
              </SmallText>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Unread messages indicator */}
            {totalUnreadCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-ember/20 border border-ember/50 rounded-soft">
                <MessageCircle className="w-4 h-4 text-ember" />
                <SmallText className="text-ember font-medium">
                  {totalUnreadCount} unread
                </SmallText>
              </div>
            )}
            
            {/* Refresh button */}
            <IconedButton
              icon={<RefreshCw className="w-4 h-4" />}
              label="Refresh"
              size="sm"
              onClick={handleRefresh}
              variant="ghost"
            />
            
            {/* Settings button */}
            <IconedButton
              icon={<Settings className="w-4 h-4" />}
              label="Settings"
              size="sm"
              variant="ghost"
            />
            
            {/* Sign out button */}
            <IconedButton
              icon={<LogOut className="w-4 h-4" />}
              label="Sign Out"
              size="sm"
              onClick={signOut}
              variant="ghost"
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-carmine/20 border border-carmine/50 rounded-soft flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-carmine flex-shrink-0 mt-0.5" />
            <div>
              <SmallText className="text-carmine font-medium">Error</SmallText>
              <SmallText className="text-carmine">{error}</SmallText>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-carmine hover:text-carmine/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Message */}
        {requestSuccess && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-soft flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <SmallText className="text-green-500 font-medium">Success</SmallText>
              <SmallText className="text-green-500">{requestSuccess}</SmallText>
            </div>
            <button
              onClick={() => setRequestSuccess(null)}
              className="ml-auto text-green-500 hover:text-green-500/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mb-8 bg-navy/60 p-1 rounded-soft border border-ember/30">
          <button
            onClick={() => setActiveTab('hearth')}
            className={`flex items-center gap-2 px-4 py-2 rounded transition-all ${
              activeTab === 'hearth'
                ? 'bg-ember text-dark font-medium'
                : 'text-ash hover:text-softwhite'
            }`}
          >
            <FlameIcon className="w-4 h-4" />
            Hearth
          </button>
          
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-2 px-4 py-2 rounded transition-all ${
              activeTab === 'friends'
                ? 'bg-ember text-dark font-medium'
                : 'text-ash hover:text-softwhite'
            }`}
          >
            <Users className="w-4 h-4" />
            Friends ({friends.length})
          </button>
          
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2 rounded transition-all relative ${
              activeTab === 'requests'
                ? 'bg-ember text-dark font-medium'
                : 'text-ash hover:text-softwhite'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Requests
            {incomingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-carmine text-white text-xs rounded-full flex items-center justify-center">
                {incomingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'hearth' && (
          <div className="space-y-8">
            {/* Hearth Canvas */}
            <BurningPaperCard glowOnHover>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Heading2 className="mb-2">Connection Hearth</Heading2>
                    <TextBlock className="text-sm text-ash">
                      Your connections visualized as living flames. Bright flames show active relationships, 
                      while dim flames need your attention.
                    </TextBlock>
                  </div>
                  
                  {flames.length > 0 && (
                    <div className="text-right">
                      <SmallText className="text-ember font-medium">
                        {flames.length} connection{flames.length !== 1 ? 's' : ''}
                      </SmallText>
                      <SmallText className="text-ash block">
                        {flames.filter(f => f.strength < 0.3).length} need attention
                      </SmallText>
                    </div>
                  )}
                </div>
                
                {flames.length > 0 ? (
                  <div className="flex justify-center">
                    <Hearth
                      flames={flamesWithUnread}
                      width={800}
                      height={600}
                      onFlameClick={handleFlameClick}
                      onRefresh={handleRefresh}
                      showUnreadIndicators={true}
                      className="shadow-2xl"
                    />
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <FlameIcon className="w-16 h-16 text-ash mx-auto mb-4 opacity-50" />
                    <Heading2 className="text-ash mb-4">No connections yet</Heading2>
                    <TextBlock className="text-ash mb-6 max-w-md mx-auto">
                      Your hearth is empty. Start building connections by sending friend requests 
                      using unique codes.
                    </TextBlock>
                    <EmberButton onClick={() => setActiveTab('requests')}>
                      Add Friends
                    </EmberButton>
                  </div>
                )}
              </div>
            </BurningPaperCard>

            {/* Your Unique Code */}
            <BurningPaperCard>
              <div className="space-y-4">
                <Heading2 className="text-lg">Your Unique Code</Heading2>
                <TextBlock className="text-sm text-ash">
                  Share this code with others so they can send you friend requests.
                </TextBlock>
                
                <div className="flex items-center gap-3">
                  <div className="flex-1 p-3 bg-navy/60 border border-ember/30 rounded-soft">
                    <SmallText className="text-ember font-mono text-lg">
                      {profile?.unique_code || 'Loading...'}
                    </SmallText>
                  </div>
                  
                  <IconedButton
                    icon={copiedCode ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    label={copiedCode ? "Copied!" : "Copy Code"}
                    onClick={handleCopyCode}
                    size="sm"
                  />
                </div>
              </div>
            </BurningPaperCard>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Heading2>Your Friends ({friends.length})</Heading2>
              <EmberButton onClick={() => setActiveTab('requests')} size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Friends
              </EmberButton>
            </div>

            {friends.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {friends.map((friend) => {
                  const unreadCount = unreadCounts[friend.friend_id] || 0;
                  const flameStrength = flames.find(f => f.id === friend.friend_id)?.strength || 0.5;
                  
                  return (
                    <BurningPaperCard key={friend.friend_id}>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Flame strength={flameStrength} size={40} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <SmallText className="font-medium text-softwhite">
                                {friend.friend_nickname}
                              </SmallText>
                              {unreadCount > 0 && (
                                <span className="w-5 h-5 bg-green-500 text-dark text-xs font-bold rounded-full flex items-center justify-center">
                                  {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                              )}
                            </div>
                            <SmallText className="text-ash text-xs">
                              {friend.friend_unique_code}
                            </SmallText>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <SmallText className="text-ash">Connection Strength</SmallText>
                            <SmallText className="text-ember">
                              {Math.round(flameStrength * 100)}%
                            </SmallText>
                          </div>
                          <div className="w-full bg-navy/60 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-ember to-carmine h-2 rounded-full transition-all duration-500"
                              style={{ width: `${flameStrength * 100}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-ash">
                          <span>Friends since {formatTimeAgo(friend.friendship_created_at)}</span>
                          <span>Active {formatTimeAgo(friend.last_interaction_at)}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <EmberButton 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleFlameClick(friend.friend_id)}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat
                          </EmberButton>
                        </div>
                      </div>
                    </BurningPaperCard>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-ash mx-auto mb-4 opacity-50" />
                <Heading2 className="text-ash mb-4">No friends yet</Heading2>
                <TextBlock className="text-ash mb-6 max-w-md mx-auto">
                  Start building your network by sending friend requests using unique codes.
                </TextBlock>
                <EmberButton onClick={() => setActiveTab('requests')}>
                  Add Friends
                </EmberButton>
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-8">
            {/* Add Friend Section */}
            <BurningPaperCard>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Heading2 className="text-lg">Add New Friend</Heading2>
                  {!showAddFriend && (
                    <EmberButton onClick={() => setShowAddFriend(true)} size="sm">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </EmberButton>
                  )}
                </div>

                {showAddFriend && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-softwhite mb-2">
                        Friend's Unique Code
                      </label>
                      <input
                        type="text"
                        value={uniqueCode}
                        onChange={(e) => setUniqueCode(e.target.value.toUpperCase())}
                        placeholder="EMBR-XXXXXXXX"
                        className="w-full px-4 py-2 bg-navy text-softwhite border border-ember/30 rounded-soft focus:outline-none focus:ring-2 focus:ring-ember/40 focus:border-ember/60"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-softwhite mb-2">
                        Message (Optional)
                      </label>
                      <textarea
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        placeholder="Hi! I'd like to connect with you on Embr."
                        rows={3}
                        className="w-full px-4 py-2 bg-navy text-softwhite border border-ember/30 rounded-soft focus:outline-none focus:ring-2 focus:ring-ember/40 focus:border-ember/60 resize-none"
                      />
                    </div>

                    {requestError && (
                      <div className="p-3 bg-carmine/20 border border-carmine/50 rounded-soft flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-carmine flex-shrink-0 mt-0.5" />
                        <SmallText className="text-carmine">{requestError}</SmallText>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <EmberButton
                        onClick={handleSendFriendRequest}
                        disabled={sendingRequest || !uniqueCode.trim()}
                        className="flex-1"
                      >
                        {sendingRequest ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Request
                          </>
                        )}
                      </EmberButton>
                      
                      <EmberButton
                        onClick={() => {
                          setShowAddFriend(false);
                          setUniqueCode('');
                          setRequestMessage('');
                          setRequestError(null);
                        }}
                        variant="ghost"
                      >
                        Cancel
                      </EmberButton>
                    </div>
                  </div>
                )}
              </div>
            </BurningPaperCard>

            {/* Incoming Requests */}
            {incomingRequests.length > 0 && (
              <div className="space-y-4">
                <Heading2 className="text-lg">Incoming Requests ({incomingRequests.length})</Heading2>
                <div className="space-y-4">
                  {incomingRequests.map((request) => (
                    <BurningPaperCard key={request.request_id}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <SmallText className="font-medium text-softwhite">
                              {request.sender_nickname}
                            </SmallText>
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          </div>
                          
                          {request.message && (
                            <TextBlock className="text-sm text-ash mb-2">
                              "{request.message}"
                            </TextBlock>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-ash">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(request.created_at)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <IconedButton
                            icon={<Check className="w-4 h-4" />}
                            label="Accept"
                            onClick={() => handleRespondToRequest(request.request_id, 'accepted')}
                            size="sm"
                          />
                          <IconedButton
                            icon={<X className="w-4 h-4" />}
                            label="Decline"
                            onClick={() => handleRespondToRequest(request.request_id, 'declined')}
                            size="sm"
                            variant="ghost"
                          />
                        </div>
                      </div>
                    </BurningPaperCard>
                  ))}
                </div>
              </div>
            )}

            {/* Outgoing Requests */}
            {outgoingRequests.length > 0 && (
              <div className="space-y-4">
                <Heading2 className="text-lg">Sent Requests ({outgoingRequests.length})</Heading2>
                <div className="space-y-4">
                  {outgoingRequests.map((request) => (
                    <BurningPaperCard key={request.request_id}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <SmallText className="font-medium text-softwhite">
                              {request.receiver_nickname}
                            </SmallText>
                            <span className="px-2 py-1 bg-ember/20 text-ember text-xs rounded">
                              Pending
                            </span>
                          </div>
                          
                          {request.message && (
                            <TextBlock className="text-sm text-ash mb-2">
                              "{request.message}"
                            </TextBlock>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-ash">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              Sent {formatTimeAgo(request.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </BurningPaperCard>
                  ))}
                </div>
              </div>
            )}

            {/* No Requests */}
            {incomingRequests.length === 0 && outgoingRequests.length === 0 && !showAddFriend && (
              <div className="text-center py-16">
                <UserPlus className="w-16 h-16 text-ash mx-auto mb-4 opacity-50" />
                <Heading2 className="text-ash mb-4">No pending requests</Heading2>
                <TextBlock className="text-ash mb-6 max-w-md mx-auto">
                  You don't have any pending friend requests. Start connecting by adding friends 
                  using their unique codes.
                </TextBlock>
                <EmberButton onClick={() => setShowAddFriend(true)}>
                  Add Friend
                </EmberButton>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bolt Logo - Bottom */}
      <div className="w-full flex justify-center py-8">
        <a 
          href="https://bolt.new" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block hover:opacity-80 transition-opacity"
        >
          <img 
            src="/logotext_poweredby_360w.png" 
            alt="Powered by Bolt" 
            className="h-8 w-auto"
          />
        </a>
      </div>
    </div>
  );
};