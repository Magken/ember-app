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
  getFriends, 
  getFriendRequests, 
  sendFriendRequest, 
  respondToFriendRequest, 
  checkUniqueCodeExists,
  convertFriendsToFlames,
  validateUniqueCode,
  formatTimeAgo,
  type Friend,
  type FriendRequest,
  type FlameData
} from '../lib/friends';
import { calculateFlameStrengthsBatch } from '../lib/flameStrength';
import { hasUnreadMessages, getUnreadCountForUser } from '../lib/messaging';
import { 
  LogOut, 
  UserPlus, 
  Users, 
  MessageCircle, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Copy,
  RefreshCw,
  Flame as FlameIcon,
  Settings
} from 'lucide-react';

export const MainPage: React.FC = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [activeSection, setActiveSection] = useState<'hearth' | 'friends' | 'requests' | 'chat'>('hearth');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [flames, setFlames] = useState<FlameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculatingStrength, setCalculatingStrength] = useState(false);
  
  // Friend request form state
  const [uniqueCode, setUniqueCode] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  
  // Chat state
  const [selectedChatUser, setSelectedChatUser] = useState<Friend | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<{ [userId: string]: number }>({});
  
  // Polling and refresh state
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const requestPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hearthRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  // Load initial data
  useEffect(() => {
    loadFriends();
    loadFriendRequests();
    checkUnreadMessages();
    
    // Set up polling intervals
    setupPolling();
    
    // Listen for custom events
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
        if (event.detail.accepted) {
          loadFriends();
        }
      }, 1000);
    };
    
    const handleMessageSent = () => {
      console.log('Message sent event received');
      // Refresh hearth after message is sent to update flame strength
      setTimeout(() => {
        loadFriends();
      }, 2000);
    };
    
    window.addEventListener('friendRequestSent', handleFriendRequestSent);
    window.addEventListener('friendRequestResponded', handleFriendRequestResponded as EventListener);
    window.addEventListener('messageSent', handleMessageSent);
    
    return () => {
      // Cleanup polling intervals
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (requestPollingIntervalRef.current) {
        clearInterval(requestPollingIntervalRef.current);
      }
      if (hearthRefreshIntervalRef.current) {
        clearInterval(hearthRefreshIntervalRef.current);
      }
      
      // Remove event listeners
      window.removeEventListener('friendRequestSent', handleFriendRequestSent);
      window.removeEventListener('friendRequestResponded', handleFriendRequestResponded as EventListener);
      window.removeEventListener('messageSent', handleMessageSent);
    };
  }, []);

  // Setup polling functions
  const setupPolling = () => {
    // Poll for unread messages every 5 seconds (only when chat is not open)
    pollingIntervalRef.current = setInterval(() => {
      if (activeSection !== 'chat') {
        checkUnreadMessages();
      }
    }, 5000);
    
    // Poll for friend request updates every 10 seconds
    requestPollingIntervalRef.current = setInterval(() => {
      loadFriendRequests();
    }, 10000);
    
    // Refresh hearth every 30 minutes (only when chat is not open)
    hearthRefreshIntervalRef.current = setInterval(() => {
      if (activeSection !== 'chat') {
        console.log('30-minute hearth refresh triggered');
        loadFriends();
      }
    }, 30 * 60 * 1000); // 30 minutes
  };

  // Check for unread messages
  const checkUnreadMessages = async () => {
    try {
      const { hasUnread: hasUnreadResult } = await hasUnreadMessages();
      setHasUnread(hasUnreadResult);
      
      // If we have unread messages and chat is not open, refresh hearth
      if (hasUnreadResult && activeSection !== 'chat') {
        console.log('Unread messages detected, refreshing hearth');
        loadFriends();
      }
      
      // Update unread counts for each friend
      if (friends.length > 0) {
        const counts: { [userId: string]: number } = {};
        for (const friend of friends) {
          const count = await getUnreadCountForUser(friend.friend_id);
          counts[friend.friend_id] = count;
        }
        setUnreadCounts(counts);
      }
    } catch (error) {
      console.error('Error checking unread messages:', error);
    }
  };

  const loadFriends = async () => {
    try {
      setError(null);
      console.log('Loading friends...');
      
      const { data: friendsData, error: friendsError } = await getFriends();
      
      if (friendsError) {
        throw friendsError;
      }
      
      if (friendsData) {
        console.log('Friends loaded:', friendsData.length);
        setFriends(friendsData);
        
        // Calculate flame strengths in batch
        if (friendsData.length > 0) {
          setCalculatingStrength(true);
          try {
            console.log('Calculating flame strengths...');
            const friendIds = friendsData.map(f => f.friend_id);
            const strengths = await calculateFlameStrengthsBatch(friendIds);
            
            // Update friends with calculated strengths
            const friendsWithStrength = friendsData.map(friend => ({
              ...friend,
              connection_strength: strengths[friend.friend_id] || 0.1
            }));
            
            setFriends(friendsWithStrength);
            
            // Convert to flames for hearth
            const flameData = convertFriendsToFlames(friendsWithStrength);
            setFlames(flameData);
            console.log('Flame strengths calculated and hearth updated');
          } catch (strengthError) {
            console.error('Error calculating flame strengths:', strengthError);
            // Use default strengths if calculation fails
            const flameData = convertFriendsToFlames(friendsData);
            setFlames(flameData);
          } finally {
            setCalculatingStrength(false);
          }
        } else {
          setFlames([]);
        }
      }
      
      setLastRefresh(Date.now());
    } catch (err: any) {
      console.error('Error loading friends:', err);
      setError(err.message || 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const loadFriendRequests = async () => {
    try {
      console.log('Loading friend requests...');
      const { data: requestsData, error: requestsError } = await getFriendRequests();
      
      if (requestsError) {
        console.error('Error loading friend requests:', requestsError);
        return;
      }
      
      if (requestsData) {
        console.log('Friend requests loaded:', requestsData.length);
        setFriendRequests(requestsData);
      }
    } catch (err: any) {
      console.error('Error loading friend requests:', err);
    }
  };

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      
      if (!checkData.can_add) {
        throw new Error(checkData.reason || 'Cannot send friend request to this user');
      }
      
      // Send the friend request
      const { data, error } = await sendFriendRequest(uniqueCode, requestMessage);
      
      if (error) {
        throw error;
      }
      
      setRequestSuccess('Friend request sent successfully!');
      setUniqueCode('');
      setRequestMessage('');
      
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

  const handleRespondToRequest = async (requestId: string, response: 'accepted' | 'declined') => {
    try {
      const { data, error } = await respondToFriendRequest(requestId, response);
      
      if (error) {
        throw error;
      }
      
      console.log(`Friend request ${response}:`, data);
      
      // Refresh both requests and friends
      setTimeout(() => {
        loadFriendRequests();
        if (response === 'accepted') {
          loadFriends();
        }
      }, 1000);
      
    } catch (err: any) {
      console.error(`Error ${response} friend request:`, err);
      setError(err.message || `Failed to ${response} friend request`);
    }
  };

  const handleFlameClick = (flameId: string) => {
    const friend = friends.find(f => f.friend_id === flameId);
    if (friend) {
      setSelectedChatUser(friend);
      setActiveSection('chat');
    }
  };

  const copyUniqueCode = () => {
    if (profile?.unique_code) {
      navigator.clipboard.writeText(profile.unique_code);
      // You could add a toast notification here
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadFriends();
    loadFriendRequests();
    checkUnreadMessages();
  };

  // Get counts for display
  const incomingRequests = friendRequests.filter(req => req.request_type === 'incoming' && req.status === 'pending');
  const outgoingRequests = friendRequests.filter(req => req.request_type === 'outgoing');

  if (loading && friends.length === 0) {
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
      {/* Powered by Bolt logo - Bottom Left */}
      <div className="fixed bottom-4 left-4 z-50">
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

      {/* Header */}
      <header className="border-b border-ember/20 bg-navy/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <FlameIcon className="w-8 h-8 text-ember" />
              <Heading2 className="text-xl">embr</Heading2>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center gap-4">
              {profile && (
                <div className="text-right">
                  <div className="text-sm font-medium text-softwhite">{profile.nickname}</div>
                  <div className="text-xs text-ash flex items-center gap-2">
                    <span>{profile.unique_code}</span>
                    <button
                      onClick={copyUniqueCode}
                      className="text-ember hover:text-carmine transition-colors"
                      title="Copy unique code"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
              
              <IconedButton
                icon={<RefreshCw className="w-4 h-4" />}
                label="Refresh"
                size="sm"
                onClick={handleRefresh}
              />
              
              <IconedButton
                icon={<LogOut className="w-4 h-4" />}
                label="Sign Out"
                variant="ghost"
                size="sm"
                onClick={signOut}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8">
          <EmberButton
            variant={activeSection === 'hearth' ? 'primary' : 'ghost'}
            onClick={() => setActiveSection('hearth')}
          >
            <FlameIcon className="w-4 h-4 mr-2" />
            Hearth ({friends.length})
          </EmberButton>
          
          <EmberButton
            variant={activeSection === 'friends' ? 'primary' : 'ghost'}
            onClick={() => setActiveSection('friends')}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Friends
          </EmberButton>
          
          <EmberButton
            variant={activeSection === 'requests' ? 'primary' : 'ghost'}
            onClick={() => setActiveSection('requests')}
          >
            <Users className="w-4 h-4 mr-2" />
            Requests ({incomingRequests.length})
          </EmberButton>
          
          {selectedChatUser && (
            <EmberButton
              variant={activeSection === 'chat' ? 'primary' : 'ghost'}
              onClick={() => setActiveSection('chat')}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat with {selectedChatUser.friend_nickname}
              {unreadCounts[selectedChatUser.friend_id] > 0 && (
                <span className="ml-2 bg-carmine text-white text-xs px-2 py-1 rounded-full">
                  {unreadCounts[selectedChatUser.friend_id]}
                </span>
              )}
            </EmberButton>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-carmine/20 border border-carmine/50 rounded-soft flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-carmine flex-shrink-0 mt-0.5" />
            <div>
              <SmallText className="text-carmine font-medium">Error</SmallText>
              <SmallText className="text-carmine">{error}</SmallText>
            </div>
          </div>
        )}

        {/* Content Sections */}
        {activeSection === 'hearth' && (
          <section>
            <div className="text-center mb-8">
              <Heading1 className="mb-4 bg-gradient-to-r from-ember to-carmine bg-clip-text text-transparent">
                Your Hearth
              </Heading1>
              <TextBlock className="text-ash max-w-2xl mx-auto">
                Each flame represents a connection. Click on a flame to start a conversation.
                {calculatingStrength && (
                  <span className="block mt-2 text-ember">
                    <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                    Calculating flame strengths...
                  </span>
                )}
              </TextBlock>
            </div>

            {flames.length > 0 ? (
              <div className="flex justify-center">
                <Hearth
                  flames={flames.map(flame => ({
                    ...flame,
                    hasUnreadMessages: unreadCounts[flame.id] > 0,
                    unreadCount: unreadCounts[flame.id] || 0
                  }))}
                  width={800}
                  height={600}
                  onFlameClick={handleFlameClick}
                  showUnreadIndicators={true}
                  className="shadow-2xl"
                />
              </div>
            ) : (
              <BurningPaperCard className="text-center py-12">
                <FlameIcon className="w-16 h-16 text-ash mx-auto mb-4" />
                <Heading3 className="text-ash mb-4">No connections yet</Heading3>
                <TextBlock className="text-ash mb-6">
                  Start building your hearth by adding friends using their unique codes.
                </TextBlock>
                <EmberButton onClick={() => setActiveSection('friends')}>
                  Add Your First Friend
                </EmberButton>
              </BurningPaperCard>
            )}
          </section>
        )}

        {activeSection === 'friends' && (
          <section>
            <div className="text-center mb-8">
              <Heading1 className="mb-4 bg-gradient-to-r from-ember to-carmine bg-clip-text text-transparent">
                Add Friends
              </Heading1>
              <TextBlock className="text-ash max-w-2xl mx-auto">
                Share your unique code or enter a friend's code to connect.
              </TextBlock>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Your Unique Code */}
              <BurningPaperCard>
                <Heading3 className="mb-4">Your Unique Code</Heading3>
                <TextBlock className="text-ash mb-4">
                  Share this code with friends so they can add you to their hearth.
                </TextBlock>
                <div className="flex items-center gap-3 p-3 bg-navy/50 rounded-soft border border-ember/30">
                  <code className="flex-1 text-ember font-mono text-lg">
                    {profile?.unique_code || 'Loading...'}
                  </code>
                  <IconedButton
                    icon={<Copy className="w-4 h-4" />}
                    label="Copy"
                    size="sm"
                    onClick={copyUniqueCode}
                  />
                </div>
              </BurningPaperCard>

              {/* Add Friend Form */}
              <BurningPaperCard>
                <Heading3 className="mb-4">Add a Friend</Heading3>
                <form onSubmit={handleSendFriendRequest} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-softwhite mb-2">
                      Friend's Unique Code
                    </label>
                    <InputBox
                      value={uniqueCode}
                      onChange={setUniqueCode}
                      placeholder="EMBR-XXXXXXXX"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-softwhite mb-2">
                      Message (Optional)
                    </label>
                    <InputBox
                      value={requestMessage}
                      onChange={setRequestMessage}
                      placeholder="Hi! I'd like to connect on Embr."
                      className="w-full"
                    />
                  </div>

                  {requestError && (
                    <div className="p-3 bg-carmine/20 border border-carmine/50 rounded-soft">
                      <SmallText className="text-carmine">{requestError}</SmallText>
                    </div>
                  )}

                  {requestSuccess && (
                    <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-soft">
                      <SmallText className="text-green-500">{requestSuccess}</SmallText>
                    </div>
                  )}

                  <EmberButton
                    type="submit"
                    disabled={sendingRequest || !uniqueCode.trim()}
                    className="w-full"
                  >
                    {sendingRequest ? 'Sending...' : 'Send Friend Request'}
                  </EmberButton>
                </form>
              </BurningPaperCard>
            </div>
          </section>
        )}

        {activeSection === 'requests' && (
          <section>
            <div className="text-center mb-8">
              <Heading1 className="mb-4 bg-gradient-to-r from-ember to-carmine bg-clip-text text-transparent">
                Friend Requests
              </Heading1>
              <TextBlock className="text-ash max-w-2xl mx-auto">
                Manage your incoming and outgoing friend requests.
              </TextBlock>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Incoming Requests */}
              <div>
                <Heading3 className="mb-4">Incoming Requests ({incomingRequests.length})</Heading3>
                <div className="space-y-4">
                  {incomingRequests.length > 0 ? (
                    incomingRequests.map((request) => (
                      <BurningPaperCard key={request.request_id}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-softwhite">
                              {request.sender_nickname}
                            </div>
                            <TinyText className="text-ash">
                              {formatTimeAgo(request.created_at)}
                            </TinyText>
                            {request.message && (
                              <SmallText className="text-ash mt-2">
                                "{request.message}"
                              </SmallText>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <IconedButton
                              icon={<Check className="w-4 h-4" />}
                              label="Accept"
                              size="sm"
                              onClick={() => handleRespondToRequest(request.request_id, 'accepted')}
                            />
                            <IconedButton
                              icon={<X className="w-4 h-4" />}
                              label="Decline"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRespondToRequest(request.request_id, 'declined')}
                            />
                          </div>
                        </div>
                      </BurningPaperCard>
                    ))
                  ) : (
                    <BurningPaperCard className="text-center py-8">
                      <SmallText className="text-ash">No incoming requests</SmallText>
                    </BurningPaperCard>
                  )}
                </div>
              </div>

              {/* Outgoing Requests */}
              <div>
                <Heading3 className="mb-4">Sent Requests ({outgoingRequests.length})</Heading3>
                <div className="space-y-4">
                  {outgoingRequests.length > 0 ? (
                    outgoingRequests.map((request) => (
                      <BurningPaperCard key={request.request_id}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-softwhite">
                              {request.receiver_nickname}
                            </div>
                            <TinyText className="text-ash">
                              {formatTimeAgo(request.created_at)}
                            </TinyText>
                            {request.message && (
                              <SmallText className="text-ash mt-2">
                                "{request.message}"
                              </SmallText>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {request.status === 'pending' && (
                              <span className="flex items-center gap-1 text-ember">
                                <RefreshCw className="w-3 h-3" />
                                <TinyText>Pending</TinyText>
                              </span>
                            )}
                            {request.status === 'accepted' && (
                              <span className="flex items-center gap-1 text-green-500">
                                <CheckCircle className="w-3 h-3" />
                                <TinyText>Accepted</TinyText>
                              </span>
                            )}
                            {request.status === 'declined' && (
                              <span className="flex items-center gap-1 text-carmine">
                                <X className="w-3 h-3" />
                                <TinyText>Declined</TinyText>
                              </span>
                            )}
                          </div>
                        </div>
                      </BurningPaperCard>
                    ))
                  ) : (
                    <BurningPaperCard className="text-center py-8">
                      <SmallText className="text-ash">No sent requests</SmallText>
                    </BurningPaperCard>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSection === 'chat' && selectedChatUser && (
          <section>
            <div className="text-center mb-8">
              <Heading1 className="mb-4 bg-gradient-to-r from-ember to-carmine bg-clip-text text-transparent">
                Chat with {selectedChatUser.friend_nickname}
              </Heading1>
              <div className="flex items-center justify-center gap-4">
                <EmberButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveSection('hearth')}
                >
                  ← Back to Hearth
                </EmberButton>
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              <LiveChatBox
                contactUserId={selectedChatUser.friend_id}
                contactName={selectedChatUser.friend_nickname}
                connectionStrength={selectedChatUser.connection_strength}
                onClose={() => {
                  setActiveSection('hearth');
                  setSelectedChatUser(null);
                  // Refresh unread counts after closing chat
                  setTimeout(() => {
                    checkUnreadMessages();
                  }, 1000);
                }}
                height={600}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
};