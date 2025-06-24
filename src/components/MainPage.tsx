import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './auth/AuthProvider';
import { BurningPaperCard } from './ui/Card';
import { EmberButton } from './ui/Button';
import { IconedButton } from './ui/IconedButton';
import { InputBox } from './ui/InputBox';
import { Hearth } from './ui/Hearth';
import { LiveChatBox } from './ui/LiveChatBox';
import { Heading1, Heading2, Heading3, TextBlock, SmallText, TinyText } from './ui/Typography';
import { 
  Users, 
  UserPlus, 
  MessageCircle, 
  Settings, 
  LogOut, 
  Copy, 
  Check, 
  AlertCircle,
  RefreshCw,
  X,
  Inbox,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react';
import { 
  getFriends, 
  getFriendRequests, 
  sendFriendRequest, 
  respondToFriendRequest, 
  checkUniqueCodeExists,
  convertFriendsToFlames,
  validateUniqueCode,
  formatTimeAgo,
  useFriendRequestsSubscription,
  useFriendshipsSubscription,
  type Friend,
  type FriendRequest,
  type FlameData
} from '../lib/friends';
import { calculateFlameStrengthsBatch } from '../lib/flameStrength';
import { hasUnreadMessages, getUnreadCountForUser } from '../lib/messaging';

export const MainPage: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<'hearth' | 'friends' | 'requests' | 'settings'>('hearth');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [flames, setFlames] = useState<FlameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState<{ [userId: string]: number }>({});
  
  // Add friend form state
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendCode, setFriendCode] = useState('');
  const [friendMessage, setFriendMessage] = useState('');
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const [addFriendError, setAddFriendError] = useState<string | null>(null);
  const [addFriendSuccess, setAddFriendSuccess] = useState<string | null>(null);

  // Polling intervals
  const hearthPollingRef = useRef<NodeJS.Timeout | null>(null);
  const requestsPollingRef = useRef<NodeJS.Timeout | null>(null);
  const unreadPollingRef = useRef<NodeJS.Timeout | null>(null);
  const periodicRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time subscriptions
  const friendRequestsSubscription = useFriendRequestsSubscription(() => {
    console.log('Friend requests changed, refreshing...');
    loadFriendRequests();
  });

  const friendshipsSubscription = useFriendshipsSubscription(() => {
    console.log('Friendships changed, refreshing hearth...');
    loadFriendsAndFlames();
  });

  // Load friends and calculate flame strengths
  const loadFriendsAndFlames = async () => {
    try {
      console.log('Loading friends and flames...');
      const { data: friendsData, error: friendsError } = await getFriends();
      
      if (friendsError) {
        throw friendsError;
      }

      if (friendsData && friendsData.length > 0) {
        console.log('Friends loaded:', friendsData.length);
        setFriends(friendsData);

        // Calculate flame strengths in batch
        const friendIds = friendsData.map(friend => friend.friend_id);
        const strengths = await calculateFlameStrengthsBatch(friendIds);
        
        // Update friends with calculated strengths
        const friendsWithStrengths = friendsData.map(friend => ({
          ...friend,
          connection_strength: strengths[friend.friend_id] || 0.1
        }));

        // Convert to flames with unread indicators
        const flamesData = convertFriendsToFlames(friendsWithStrengths);
        
        // Add unread message indicators
        const flamesWithUnread = await Promise.all(
          flamesData.map(async (flame) => {
            const unreadCount = await getUnreadCountForUser(flame.id);
            return {
              ...flame,
              hasUnreadMessages: unreadCount > 0,
              unreadCount
            };
          })
        );
        
        setFlames(flamesWithUnread);
        console.log('Flames updated with strengths and unread counts');
      } else {
        console.log('No friends found');
        setFriends([]);
        setFlames([]);
      }
    } catch (err: any) {
      console.error('Error loading friends and flames:', err);
      setError(err.message || 'Failed to load friends');
    }
  };

  // Load friend requests
  const loadFriendRequests = async () => {
    try {
      console.log('Loading friend requests...');
      const { data: requestsData, error: requestsError } = await getFriendRequests();
      
      if (requestsError) {
        throw requestsError;
      }

      setFriendRequests(requestsData || []);
      console.log('Friend requests loaded:', requestsData?.length || 0);
    } catch (err: any) {
      console.error('Error loading friend requests:', err);
      setError(err.message || 'Failed to load friend requests');
    }
  };

  // Check for unread messages
  const checkUnreadMessages = async () => {
    try {
      const { hasUnread: hasUnreadMessages, totalUnread: totalUnreadCount } = await hasUnreadMessages();
      setHasUnread(hasUnreadMessages);
      setTotalUnread(totalUnreadCount);

      // Update individual unread counts for each friend
      const counts: { [userId: string]: number } = {};
      for (const friend of friends) {
        const count = await getUnreadCountForUser(friend.friend_id);
        counts[friend.friend_id] = count;
      }
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error checking unread messages:', error);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          loadFriendsAndFlames(),
          loadFriendRequests(),
          checkUnreadMessages()
        ]);
      } catch (err: any) {
        console.error('Error loading initial data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Set up polling for unread messages (every 5 seconds)
  useEffect(() => {
    if (unreadPollingRef.current) {
      clearInterval(unreadPollingRef.current);
    }

    unreadPollingRef.current = setInterval(() => {
      if (!selectedChat) { // Only poll when no chat is open
        checkUnreadMessages();
      }
    }, 5000);

    return () => {
      if (unreadPollingRef.current) {
        clearInterval(unreadPollingRef.current);
      }
    };
  }, [selectedChat, friends]);

  // Set up polling for hearth refresh when new unread messages are detected
  useEffect(() => {
    if (hearthPollingRef.current) {
      clearInterval(hearthPollingRef.current);
    }

    hearthPollingRef.current = setInterval(async () => {
      if (!selectedChat) { // Only refresh when no chat is open
        const { hasUnread: currentHasUnread } = await hasUnreadMessages();
        if (currentHasUnread && !hasUnread) {
          console.log('New unread messages detected, refreshing hearth...');
          loadFriendsAndFlames();
        }
      }
    }, 3000);

    return () => {
      if (hearthPollingRef.current) {
        clearInterval(hearthPollingRef.current);
      }
    };
  }, [selectedChat, hasUnread]);

  // Set up polling for friend requests (every 10 seconds)
  useEffect(() => {
    if (requestsPollingRef.current) {
      clearInterval(requestsPollingRef.current);
    }

    requestsPollingRef.current = setInterval(() => {
      loadFriendRequests();
    }, 10000);

    return () => {
      if (requestsPollingRef.current) {
        clearInterval(requestsPollingRef.current);
      }
    };
  }, []);

  // Set up periodic hearth refresh (every 30 minutes when no chat is open)
  useEffect(() => {
    if (periodicRefreshRef.current) {
      clearInterval(periodicRefreshRef.current);
    }

    periodicRefreshRef.current = setInterval(() => {
      if (!selectedChat) {
        console.log('Periodic hearth refresh (30 min)...');
        loadFriendsAndFlames();
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => {
      if (periodicRefreshRef.current) {
        clearInterval(periodicRefreshRef.current);
      }
    };
  }, [selectedChat]);

  // Set up real-time subscriptions
  useEffect(() => {
    const unsubscribeRequests = friendRequestsSubscription.subscribe();
    const unsubscribeFriendships = friendshipsSubscription.subscribe();

    return () => {
      unsubscribeRequests();
      unsubscribeFriendships();
    };
  }, []);

  // Listen for custom events
  useEffect(() => {
    const handleFriendRequestSent = () => {
      console.log('Friend request sent event received');
      loadFriendRequests();
    };

    const handleFriendRequestResponded = (event: CustomEvent) => {
      console.log('Friend request responded event received:', event.detail);
      loadFriendRequests();
      if (event.detail.accepted) {
        loadFriendsAndFlames();
      }
    };

    const handleMessageSent = () => {
      console.log('Message sent event received');
      loadFriendsAndFlames(); // Refresh to update flame strengths
    };

    window.addEventListener('friendRequestSent', handleFriendRequestSent);
    window.addEventListener('friendRequestResponded', handleFriendRequestResponded as EventListener);
    window.addEventListener('messageSent', handleMessageSent);

    return () => {
      window.removeEventListener('friendRequestSent', handleFriendRequestSent);
      window.removeEventListener('friendRequestResponded', handleFriendRequestResponded as EventListener);
      window.removeEventListener('messageSent', handleMessageSent);
    };
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (hearthPollingRef.current) clearInterval(hearthPollingRef.current);
      if (requestsPollingRef.current) clearInterval(requestsPollingRef.current);
      if (unreadPollingRef.current) clearInterval(unreadPollingRef.current);
      if (periodicRefreshRef.current) clearInterval(periodicRefreshRef.current);
      friendRequestsSubscription.cleanup();
      friendshipsSubscription.cleanup();
    };
  }, []);

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

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFriendLoading(true);
    setAddFriendError(null);
    setAddFriendSuccess(null);

    try {
      // Validate format
      if (!validateUniqueCode(friendCode)) {
        throw new Error('Invalid unique code format. Must be EMBR-XXXXXXXX');
      }

      // Check if code exists and can be added
      const { data: checkData, error: checkError } = await checkUniqueCodeExists(friendCode);
      
      if (checkError) {
        throw checkError;
      }

      if (!checkData?.exists) {
        throw new Error('No user found with that unique code');
      }

      if (!checkData?.can_add) {
        throw new Error(checkData?.reason || 'Cannot add this user');
      }

      // Send friend request
      const { data, error } = await sendFriendRequest(friendCode, friendMessage);
      
      if (error) {
        throw error;
      }

      setAddFriendSuccess('Friend request sent successfully!');
      setFriendCode('');
      setFriendMessage('');
      setShowAddFriend(false);
      
      // Refresh friend requests
      loadFriendRequests();
    } catch (err: any) {
      setAddFriendError(err.message || 'Failed to send friend request');
    } finally {
      setAddFriendLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, response: 'accepted' | 'declined') => {
    try {
      const { data, error } = await respondToFriendRequest(requestId, response);
      
      if (error) {
        throw error;
      }

      // Refresh data
      loadFriendRequests();
      if (response === 'accepted') {
        loadFriendsAndFlames();
      }
    } catch (err: any) {
      console.error('Error responding to friend request:', err);
      setError(err.message || 'Failed to respond to friend request');
    }
  };

  const handleFlameClick = (flameId: string) => {
    console.log('Flame clicked:', flameId);
    setSelectedChat(flameId);
  };

  const handleCloseChat = () => {
    setSelectedChat(null);
    // Refresh hearth when chat is closed to update flame strengths
    loadFriendsAndFlames();
    checkUnreadMessages();
  };

  const getSelectedFriend = () => {
    return friends.find(friend => friend.friend_id === selectedChat);
  };

  // Get counts for badges
  const incomingRequestsCount = friendRequests.filter(req => req.request_type === 'incoming' && req.status === 'pending').length;
  const outgoingRequestsCount = friendRequests.filter(req => req.request_type === 'outgoing' && req.status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-ember rounded-full mx-auto animate-pulse mb-4" />
          <SmallText className="text-ash">Loading your hearth...</SmallText>
        </div>
      </div>
    );
  }

  if (selectedChat) {
    const selectedFriend = getSelectedFriend();
    if (!selectedFriend) {
      setSelectedChat(null);
      return null;
    }

    return (
      <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)]">
        {/* Bolt Logo */}
        <div className="fixed top-4 left-4 z-50">
          <a href="https://bolt.new" target="_blank" rel="noopener noreferrer">
            <img 
              src="/logotext_poweredby_360w.png" 
              alt="Powered by Bolt" 
              className="h-8 opacity-80 hover:opacity-100 transition-opacity"
            />
          </a>
        </div>

        <div className="w-full h-screen">
          <LiveChatBox
            contactUserId={selectedFriend.friend_id}
            contactName={selectedFriend.friend_nickname}
            connectionStrength={selectedFriend.connection_strength}
            onClose={handleCloseChat}
            height={window.innerHeight}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)]">
      {/* Bolt Logo */}
      <div className="fixed top-4 left-4 z-50">
        <a href="https://bolt.new" target="_blank" rel="noopener noreferrer">
          <img 
            src="/logotext_poweredby_360w.png" 
            alt="Powered by Bolt" 
            className="h-8 opacity-80 hover:opacity-100 transition-opacity"
          />
        </a>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Heading1 className="text-3xl bg-gradient-to-r from-ember to-carmine bg-clip-text text-transparent">
              Your Hearth
            </Heading1>
            <TextBlock className="text-ash mt-2">
              Welcome back, {profile?.nickname}
            </TextBlock>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Unread messages indicator */}
            {hasUnread && (
              <div className="flex items-center gap-2 px-3 py-2 bg-ember/20 border border-ember/50 rounded-soft">
                <Inbox className="w-4 h-4 text-ember" />
                <SmallText className="text-ember font-medium">
                  {totalUnread} unread message{totalUnread !== 1 ? 's' : ''}
                </SmallText>
              </div>
            )}
            
            <IconedButton
              icon={<LogOut className="w-4 h-4" />}
              label="Sign Out"
              onClick={signOut}
              variant="ghost"
              size="sm"
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

        {/* Success Display */}
        {addFriendSuccess && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-soft flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <SmallText className="text-green-500 font-medium">Success</SmallText>
              <SmallText className="text-green-500">{addFriendSuccess}</SmallText>
            </div>
            <button
              onClick={() => setAddFriendSuccess(null)}
              className="ml-auto text-green-500 hover:text-green-500/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          <EmberButton
            variant={activeSection === 'hearth' ? 'primary' : 'ghost'}
            onClick={() => setActiveSection('hearth')}
            size="sm"
          >
            <Users className="w-4 h-4 mr-2" />
            Hearth ({flames.length})
          </EmberButton>
          
          <EmberButton
            variant={activeSection === 'friends' ? 'primary' : 'ghost'}
            onClick={() => setActiveSection('friends')}
            size="sm"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Friends ({friends.length})
          </EmberButton>
          
          <div className="relative">
            <EmberButton
              variant={activeSection === 'requests' ? 'primary' : 'ghost'}
              onClick={() => setActiveSection('requests')}
              size="sm"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Requests
            </EmberButton>
            {(incomingRequestsCount > 0 || outgoingRequestsCount > 0) && (
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-carmine text-white text-xs rounded-full flex items-center justify-center">
                {incomingRequestsCount + outgoingRequestsCount}
              </div>
            )}
          </div>
          
          <EmberButton
            variant={activeSection === 'settings' ? 'primary' : 'ghost'}
            onClick={() => setActiveSection('settings')}
            size="sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </EmberButton>
        </div>

        {/* Content Sections */}
        {activeSection === 'hearth' && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <Heading2>Connection Hearth</Heading2>
              <div className="flex gap-2">
                <IconedButton
                  icon={<UserPlus className="w-4 h-4" />}
                  label="Add Friend"
                  onClick={() => setShowAddFriend(true)}
                  size="sm"
                />
                <IconedButton
                  icon={<RefreshCw className="w-4 h-4" />}
                  label="Refresh"
                  onClick={loadFriendsAndFlames}
                  size="sm"
                  variant="ghost"
                />
              </div>
            </div>
            
            {flames.length > 0 ? (
              <BurningPaperCard glowOnHover>
                <div className="flex justify-center bg-black rounded-soft p-4">
                  <Hearth
                    flames={flames}
                    width={800}
                    height={600}
                    onFlameClick={handleFlameClick}
                    showUnreadIndicators={true}
                    className="shadow-2xl"
                  />
                </div>
                <div className="mt-4 text-center">
                  <SmallText className="text-ash">
                    Click on any flame to start a conversation. Bright flames show active connections.
                  </SmallText>
                </div>
              </BurningPaperCard>
            ) : (
              <BurningPaperCard className="text-center py-12">
                <Users className="w-16 h-16 text-ash mx-auto mb-4" />
                <Heading3 className="text-ash mb-4">No connections yet</Heading3>
                <TextBlock className="text-ash mb-6 max-w-md mx-auto">
                  Your hearth is empty. Add friends to see their flames glow here.
                </TextBlock>
                <EmberButton onClick={() => setShowAddFriend(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Your First Friend
                </EmberButton>
              </BurningPaperCard>
            )}
          </section>
        )}

        {activeSection === 'friends' && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <Heading2>Friends ({friends.length})</Heading2>
              <IconedButton
                icon={<UserPlus className="w-4 h-4" />}
                label="Add Friend"
                onClick={() => setShowAddFriend(true)}
                size="sm"
              />
            </div>
            
            {friends.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {friends.map((friend) => (
                  <BurningPaperCard key={friend.friend_id} glowOnHover>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-ember to-carmine rounded-full flex items-center justify-center text-dark font-bold">
                        {friend.friend_nickname.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Heading3 className="text-lg">{friend.friend_nickname}</Heading3>
                          {unreadCounts[friend.friend_id] > 0 && (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          )}
                        </div>
                        <SmallText className="text-ash">{friend.friend_unique_code}</SmallText>
                        <SmallText className="text-ash">
                          Strength: {(friend.connection_strength * 100).toFixed(0)}%
                        </SmallText>
                        <TinyText className="text-ash">
                          Last interaction: {formatTimeAgo(friend.last_interaction_at)}
                        </TinyText>
                      </div>
                      <IconedButton
                        icon={<MessageCircle className="w-4 h-4" />}
                        label="Chat"
                        onClick={() => handleFlameClick(friend.friend_id)}
                        size="sm"
                      />
                    </div>
                  </BurningPaperCard>
                ))}
              </div>
            ) : (
              <BurningPaperCard className="text-center py-12">
                <Users className="w-16 h-16 text-ash mx-auto mb-4" />
                <Heading3 className="text-ash mb-4">No friends yet</Heading3>
                <TextBlock className="text-ash mb-6">
                  Add friends to start building connections.
                </TextBlock>
                <EmberButton onClick={() => setShowAddFriend(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Friend
                </EmberButton>
              </BurningPaperCard>
            )}
          </section>
        )}

        {activeSection === 'requests' && (
          <section>
            <Heading2 className="mb-6">Friend Requests</Heading2>
            
            <div className="space-y-6">
              {/* Incoming Requests */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Heading3>Incoming Requests</Heading3>
                  {incomingRequestsCount > 0 && (
                    <div className="w-6 h-6 bg-carmine text-white text-xs rounded-full flex items-center justify-center">
                      {incomingRequestsCount}
                    </div>
                  )}
                </div>
                
                {friendRequests.filter(req => req.request_type === 'incoming' && req.status === 'pending').length > 0 ? (
                  <div className="space-y-4">
                    {friendRequests
                      .filter(req => req.request_type === 'incoming' && req.status === 'pending')
                      .map((request) => (
                        <BurningPaperCard key={request.request_id} glowOnHover>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-navy to-deepblue rounded-full flex items-center justify-center text-ember font-bold border border-ember/30">
                                {request.sender_nickname.charAt(0)}
                              </div>
                              <div>
                                <Heading3 className="text-lg">{request.sender_nickname}</Heading3>
                                <SmallText className="text-ash">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {formatTimeAgo(request.created_at)}
                                </SmallText>
                                {request.message && (
                                  <SmallText className="text-softwhite mt-1">"{request.message}"</SmallText>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <IconedButton
                                icon={<UserCheck className="w-4 h-4" />}
                                label="Accept"
                                onClick={() => handleRespondToRequest(request.request_id, 'accepted')}
                                size="sm"
                              />
                              <IconedButton
                                icon={<UserX className="w-4 h-4" />}
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
                ) : (
                  <BurningPaperCard className="text-center py-8">
                    <UserPlus className="w-12 h-12 text-ash mx-auto mb-3" />
                    <SmallText className="text-ash">No incoming friend requests</SmallText>
                  </BurningPaperCard>
                )}
              </div>

              {/* Outgoing Requests */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Heading3>Sent Requests</Heading3>
                  {outgoingRequestsCount > 0 && (
                    <div className="w-6 h-6 bg-ember text-dark text-xs rounded-full flex items-center justify-center">
                      {outgoingRequestsCount}
                    </div>
                  )}
                </div>
                
                {friendRequests.filter(req => req.request_type === 'outgoing').length > 0 ? (
                  <div className="space-y-4">
                    {friendRequests
                      .filter(req => req.request_type === 'outgoing')
                      .map((request) => (
                        <BurningPaperCard key={request.request_id}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-ember to-carmine rounded-full flex items-center justify-center text-dark font-bold">
                                {request.receiver_nickname.charAt(0)}
                              </div>
                              <div>
                                <Heading3 className="text-lg">{request.receiver_nickname}</Heading3>
                                <SmallText className="text-ash">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {formatTimeAgo(request.created_at)}
                                </SmallText>
                                {request.message && (
                                  <SmallText className="text-softwhite mt-1">"{request.message}"</SmallText>
                                )}
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-soft text-xs font-medium ${
                              request.status === 'pending' 
                                ? 'bg-ember/20 text-ember' 
                                : request.status === 'accepted'
                                  ? 'bg-green-500/20 text-green-500'
                                  : 'bg-carmine/20 text-carmine'
                            }`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </div>
                          </div>
                        </BurningPaperCard>
                      ))}
                  </div>
                ) : (
                  <BurningPaperCard className="text-center py-8">
                    <UserPlus className="w-12 h-12 text-ash mx-auto mb-3" />
                    <SmallText className="text-ash">No sent friend requests</SmallText>
                  </BurningPaperCard>
                )}
              </div>
            </div>
          </section>
        )}

        {activeSection === 'settings' && (
          <section>
            <Heading2 className="mb-6">Settings</Heading2>
            
            <div className="space-y-6">
              <BurningPaperCard>
                <Heading3 className="mb-4">Your Unique Code</Heading3>
                <TextBlock className="text-ash mb-4">
                  Share this code with friends so they can add you to their hearth.
                </TextBlock>
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-3 bg-navy/60 border border-ember/30 rounded-soft font-mono text-ember">
                    {profile?.unique_code}
                  </div>
                  <IconedButton
                    icon={copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    label={copiedCode ? "Copied!" : "Copy"}
                    onClick={handleCopyCode}
                    size="sm"
                  />
                </div>
              </BurningPaperCard>

              <BurningPaperCard>
                <Heading3 className="mb-4">Profile Information</Heading3>
                <div className="space-y-3">
                  <div>
                    <SmallText className="text-ash">Nickname</SmallText>
                    <TextBlock>{profile?.nickname}</TextBlock>
                  </div>
                  <div>
                    <SmallText className="text-ash">Member since</SmallText>
                    <TextBlock>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}</TextBlock>
                  </div>
                </div>
              </BurningPaperCard>
            </div>
          </section>
        )}

        {/* Add Friend Modal */}
        {showAddFriend && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <BurningPaperCard glowOnHover className="w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <Heading3>Add Friend</Heading3>
                <IconedButton
                  icon={<X className="w-4 h-4" />}
                  label="Close"
                  onClick={() => {
                    setShowAddFriend(false);
                    setFriendCode('');
                    setFriendMessage('');
                    setAddFriendError(null);
                  }}
                  size="sm"
                  variant="ghost"
                />
              </div>

              {addFriendError && (
                <div className="mb-4 p-3 bg-carmine/20 border border-carmine/50 rounded-soft">
                  <SmallText className="text-carmine">{addFriendError}</SmallText>
                </div>
              )}

              <form onSubmit={handleAddFriend} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-softwhite mb-2">
                    Friend's Unique Code *
                  </label>
                  <InputBox
                    value={friendCode}
                    onChange={setFriendCode}
                    placeholder="EMBR-XXXXXXXX"
                    className="w-full"
                  />
                  <SmallText className="text-ash mt-1">
                    Ask your friend for their unique code from their settings.
                  </SmallText>
                </div>

                <div>
                  <label className="block text-sm font-medium text-softwhite mb-2">
                    Message (optional)
                  </label>
                  <InputBox
                    value={friendMessage}
                    onChange={setFriendMessage}
                    placeholder="Hi! I'd like to add you as a friend."
                    className="w-full"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <EmberButton
                    type="submit"
                    disabled={addFriendLoading || !friendCode.trim()}
                    className="flex-1"
                  >
                    {addFriendLoading ? 'Sending...' : 'Send Request'}
                  </EmberButton>
                  <EmberButton
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowAddFriend(false);
                      setFriendCode('');
                      setFriendMessage('');
                      setAddFriendError(null);
                    }}
                  >
                    Cancel
                  </EmberButton>
                </div>
              </form>
            </BurningPaperCard>
          </div>
        )}
      </div>
    </div>
  );
};