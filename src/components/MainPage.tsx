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
  Plus, 
  Users, 
  MessageCircle, 
  Settings, 
  LogOut, 
  UserPlus, 
  Check, 
  X, 
  RefreshCw,
  Search,
  Copy,
  CheckCircle,
  AlertCircle,
  Flame as FlameIcon,
  Mail
} from 'lucide-react';
import { 
  getFriends, 
  getFriendRequests, 
  sendFriendRequest, 
  respondToFriendRequest, 
  checkUniqueCodeExists,
  convertFriendsToFlames,
  formatTimeAgo,
  validateUniqueCode,
  useFriendRequestsSubscription,
  useFriendshipsSubscription,
  type Friend,
  type FriendRequest,
  type FlameData
} from '../lib/friends';
import { calculateFlameStrengthsBatch } from '../lib/flameStrength';
import { getUserConversations, hasUnreadMessages, type Conversation } from '../lib/messaging';

export const MainPage: React.FC = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [activeView, setActiveView] = useState<'hearth' | 'friends' | 'messages' | 'settings'>('hearth');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [flames, setFlames] = useState<FlameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  
  // Add friend state
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [uniqueCode, setUniqueCode] = useState('');
  const [friendMessage, setFriendMessage] = useState('');
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const [addFriendError, setAddFriendError] = useState<string | null>(null);
  const [addFriendSuccess, setAddFriendSuccess] = useState<string | null>(null);
  
  // Chat state
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [selectedChatUserName, setSelectedChatUserName] = useState<string>('');
  const [selectedChatConnectionStrength, setSelectedChatConnectionStrength] = useState<number>(0.5);
  
  // Copy unique code state
  const [codeCopied, setCodeCopied] = useState(false);
  
  // Stable flame positions
  const [stableFlamePositions, setStableFlamePositions] = useState<Array<{id: string, x: number, y: number}>>([]);
  const [lastFlameCount, setLastFlameCount] = useState(0);
  const [flameStrengthsCalculated, setFlameStrengthsCalculated] = useState(false);
  
  // Polling intervals
  const unreadPollingRef = useRef<NodeJS.Timeout | null>(null);
  const friendRequestPollingRef = useRef<NodeJS.Timeout | null>(null);
  const hearthRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time subscriptions
  const friendRequestsSubscription = useFriendRequestsSubscription(() => {
    console.log('Friend requests updated via real-time');
    loadFriendRequests();
  });

  const friendshipsSubscription = useFriendshipsSubscription(() => {
    console.log('Friendships updated via real-time');
    loadFriends();
  });

  // Generate stable positions for flames
  const generateStablePositions = (
    flameCount: number, 
    existingPositions?: Array<{id: string, x: number, y: number}>
  ): Array<{x: number, y: number}> => {
    if (flameCount === 0) return [];
    
    const positions: Array<{x: number, y: number}> = [];
    const centerX = 50;
    const centerY = 50;
    const minDistance = 15; // Minimum distance percentage between flames (100px requirement)
    
    // If we have existing positions and the count hasn't changed, reuse them
    if (existingPositions && existingPositions.length === flameCount) {
      return existingPositions.map(pos => ({ x: pos.x, y: pos.y }));
    }
    
    // Generate positions using spiral algorithm with collision detection
    for (let index = 0; index < flameCount; index++) {
      let x, y;
      let attempts = 0;
      const maxAttempts = 100;
      let placed = false;
      
      while (!placed && attempts < maxAttempts) {
        if (attempts < 50) {
          // Strategy 1: Deterministic spiral pattern
          const spiralIndex = index + (attempts * 0.1);
          const angle = spiralIndex * 2.4; // Golden angle for even distribution
          const radius = Math.sqrt(spiralIndex + 1) * (minDistance * 0.8);
          
          x = centerX + Math.cos(angle) * radius;
          y = centerY + Math.sin(angle) * radius;
        } else {
          // Strategy 2: Random placement with bias toward center
          const maxRadius = Math.min(40, 100 - minDistance);
          const angle = Math.random() * 2 * Math.PI;
          const radius = Math.random() * maxRadius;
          
          x = centerX + Math.cos(angle) * radius;
          y = centerY + Math.sin(angle) * radius;
        }
        
        // Keep within safe bounds
        const margin = minDistance / 2;
        x = Math.max(margin, Math.min(100 - margin, x));
        y = Math.max(margin, Math.min(100 - margin, y));
        
        // Check collision with existing positions
        const hasCollision = positions.some(pos => {
          const distance = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
          return distance < minDistance;
        });
        
        if (!hasCollision) {
          placed = true;
        }
        
        attempts++;
      }
      
      // If we couldn't place without collision, use fallback position
      if (!placed) {
        console.warn(`Could not place flame ${index} without collision after ${maxAttempts} attempts`);
        const gridSize = Math.ceil(Math.sqrt(flameCount));
        const gridX = (index % gridSize) * (80 / gridSize) + 10;
        const gridY = Math.floor(index / gridSize) * (80 / gridSize) + 10;
        x = gridX;
        y = gridY;
      }
      
      positions.push({ x, y });
    }
    
    return positions;
  };

  // Load friends and calculate flame strengths
  const loadFriends = async () => {
    try {
      console.log('Loading friends...');
      const { data: friendsData, error: friendsError } = await getFriends();
      
      if (friendsError) {
        throw friendsError;
      }
      
      if (friendsData) {
        console.log('Friends loaded:', friendsData.length);
        setFriends(friendsData);
        
        // Check if flame count changed
        const currentFlameCount = friendsData.length;
        const shouldRegeneratePositions = currentFlameCount !== lastFlameCount;
        
        if (shouldRegeneratePositions) {
          console.log(`Flame count changed: ${lastFlameCount} -> ${currentFlameCount}`);
          const newPositions = generateStablePositions(currentFlameCount, stableFlamePositions);
          
          // Map positions to friend IDs
          const positionsWithIds = friendsData.map((friend, index) => ({
            id: friend.friend_id,
            x: newPositions[index]?.x || 50,
            y: newPositions[index]?.y || 50
          }));
          
          setStableFlamePositions(positionsWithIds);
          setLastFlameCount(currentFlameCount);
        }
        
        // Calculate flame strengths in background
        if (friendsData.length > 0) {
          setFlameStrengthsCalculated(false);
          
          try {
            console.log('Calculating flame strengths...');
            const friendIds = friendsData.map(f => f.friend_id);
            const strengths = await calculateFlameStrengthsBatch(friendIds);
            
            // Convert to flames with calculated strengths and stable positions
            const flamesWithStrengths = friendsData.map((friend, index) => {
              const position = stableFlamePositions.find(pos => pos.id === friend.friend_id) || 
                              { x: 50, y: 50 }; // Fallback position
              
              return {
                id: friend.friend_id,
                x: position.x,
                y: position.y,
                strength: strengths[friend.friend_id] || 0.5,
                size: 60,
                name: friend.friend_nickname
              };
            });
            
            setFlames(flamesWithStrengths);
            setFlameStrengthsCalculated(true);
            console.log('Flame strengths calculated and applied');
          } catch (strengthError) {
            console.error('Error calculating flame strengths:', strengthError);
            // Fallback to default strengths
            const defaultFlames = convertFriendsToFlames(friendsData);
            setFlames(defaultFlames);
            setFlameStrengthsCalculated(true);
          }
        } else {
          setFlames([]);
          setFlameStrengthsCalculated(true);
        }
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      setError('Failed to load friends');
    }
  };

  // Load friend requests
  const loadFriendRequests = async () => {
    try {
      const { data, error } = await getFriendRequests();
      if (error) {
        throw error;
      }
      setFriendRequests(data || []);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  // Load conversations
  const loadConversations = async () => {
    try {
      const { data, error } = await getUserConversations();
      if (error) {
        throw error;
      }
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Check for unread messages
  const checkUnreadMessages = async () => {
    try {
      const { hasUnread: hasUnreadMessages, totalUnread: totalUnreadCount } = await hasUnreadMessages();
      setHasUnread(hasUnreadMessages);
      setTotalUnread(totalUnreadCount);
      
      // If there are new unread messages and no chat is open, refresh hearth
      if (hasUnreadMessages && !selectedChatUserId) {
        console.log('New unread messages detected, refreshing hearth...');
        loadFriends();
      }
    } catch (error) {
      console.error('Error checking unread messages:', error);
    }
  };

  // Start background polling
  const startBackgroundPolling = () => {
    // Poll for unread messages every 5 seconds
    unreadPollingRef.current = setInterval(() => {
      if (!selectedChatUserId) { // Only poll when no chat is open
        checkUnreadMessages();
      }
    }, 5000);

    // Poll for friend requests every 10 seconds
    friendRequestPollingRef.current = setInterval(() => {
      loadFriendRequests();
    }, 10000);

    // Refresh hearth every 30 minutes if no chat is open
    hearthRefreshRef.current = setInterval(() => {
      if (!selectedChatUserId) {
        console.log('30-minute hearth refresh...');
        loadFriends();
      }
    }, 30 * 60 * 1000); // 30 minutes
  };

  // Stop background polling
  const stopBackgroundPolling = () => {
    if (unreadPollingRef.current) {
      clearInterval(unreadPollingRef.current);
      unreadPollingRef.current = null;
    }
    if (friendRequestPollingRef.current) {
      clearInterval(friendRequestPollingRef.current);
      friendRequestPollingRef.current = null;
    }
    if (hearthRefreshRef.current) {
      clearInterval(hearthRefreshRef.current);
      hearthRefreshRef.current = null;
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          loadFriends(),
          loadFriendRequests(),
          loadConversations(),
          checkUnreadMessages()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
      startBackgroundPolling();
    }

    return () => {
      stopBackgroundPolling();
    };
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (user) {
      const unsubscribeFriendRequests = friendRequestsSubscription.subscribe();
      const unsubscribeFriendships = friendshipsSubscription.subscribe();

      return () => {
        unsubscribeFriendRequests();
        unsubscribeFriendships();
      };
    }
  }, [user]);

  // Listen for custom events (friend request sent/responded, message sent)
  useEffect(() => {
    const handleFriendRequestSent = () => {
      console.log('Friend request sent event received');
      setTimeout(() => loadFriendRequests(), 500);
    };

    const handleFriendRequestResponded = (event: CustomEvent) => {
      console.log('Friend request responded event received:', event.detail);
      setTimeout(() => {
        loadFriendRequests();
        if (event.detail.accepted) {
          loadFriends(); // Refresh hearth when request is accepted
        }
      }, 500);
    };

    const handleMessageSent = () => {
      console.log('Message sent event received');
      // Refresh hearth to update flame strength
      setTimeout(() => loadFriends(), 1000);
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

  // Handle adding friend
  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uniqueCode.trim()) {
      setAddFriendError('Please enter a unique code');
      return;
    }

    if (!validateUniqueCode(uniqueCode)) {
      setAddFriendError('Invalid unique code format. Must be EMBR-XXXXXXXX');
      return;
    }

    setAddFriendLoading(true);
    setAddFriendError(null);
    setAddFriendSuccess(null);

    try {
      // First check if the code exists and can be added
      const { data: checkData, error: checkError } = await checkUniqueCodeExists(uniqueCode.toUpperCase());
      
      if (checkError) {
        throw checkError;
      }

      if (!checkData?.exists) {
        throw new Error(checkData?.error || 'User not found with that unique code');
      }

      if (!checkData?.can_add) {
        throw new Error(checkData?.reason || 'Cannot add this user');
      }

      // Send the friend request
      const { data, error } = await sendFriendRequest(uniqueCode.toUpperCase(), friendMessage.trim() || undefined);
      
      if (error) {
        throw error;
      }

      setAddFriendSuccess('Friend request sent successfully!');
      setUniqueCode('');
      setFriendMessage('');
      
      // Refresh friend requests
      setTimeout(() => {
        loadFriendRequests();
        setShowAddFriend(false);
        setAddFriendSuccess(null);
      }, 2000);

    } catch (error: any) {
      setAddFriendError(error.message || 'Failed to send friend request');
    } finally {
      setAddFriendLoading(false);
    }
  };

  // Handle friend request response
  const handleFriendRequestResponse = async (requestId: string, response: 'accepted' | 'declined') => {
    try {
      const { data, error } = await respondToFriendRequest(requestId, response);
      
      if (error) {
        throw error;
      }

      // Refresh data
      await Promise.all([
        loadFriendRequests(),
        response === 'accepted' ? loadFriends() : Promise.resolve()
      ]);

    } catch (error: any) {
      console.error('Error responding to friend request:', error);
      setError(error.message || 'Failed to respond to friend request');
    }
  };

  // Handle flame click
  const handleFlameClick = (flameId: string) => {
    const friend = friends.find(f => f.friend_id === flameId);
    if (friend) {
      const flame = flames.find(f => f.id === flameId);
      setSelectedChatUserId(flameId);
      setSelectedChatUserName(friend.friend_nickname);
      setSelectedChatConnectionStrength(flame?.strength || 0.5);
      setActiveView('messages');
    }
  };

  // Handle copy unique code
  const handleCopyUniqueCode = async () => {
    if (profile?.unique_code) {
      try {
        await navigator.clipboard.writeText(profile.unique_code);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy code:', error);
      }
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      stopBackgroundPolling();
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading && !flameStrengthsCalculated) {
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
      {/* Header */}
      <header className="border-b border-ember/20 bg-navy/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Bolt Logo - Top Left */}
            <div className="flex items-center gap-4">
              <a 
                href="https://bolt.new" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block hover:opacity-80 transition-opacity"
              >
                <img 
                  src="/logotext_poweredby_360w.png" 
                  alt="Powered by Bolt" 
                  className="h-6 w-auto"
                />
              </a>
              
              <div className="flex items-center gap-2">
                <FlameIcon className="w-6 h-6 text-ember" />
                <Heading1 className="text-xl bg-gradient-to-r from-ember to-carmine bg-clip-text text-transparent">
                  embr
                </Heading1>
              </div>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center gap-4">
              {profile && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-softwhite">{profile.nickname}</div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-ash font-mono">{profile.unique_code}</code>
                      <button
                        onClick={handleCopyUniqueCode}
                        className="text-ash hover:text-ember transition-colors"
                        title="Copy unique code"
                      >
                        {codeCopied ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-ember to-carmine rounded-full flex items-center justify-center text-dark font-bold">
                    {profile.nickname.charAt(0)}
                  </div>
                </div>
              )}
              
              <IconedButton
                icon={<LogOut className="w-4 h-4" />}
                label="Sign Out"
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-carmine/20 border border-carmine/50 rounded-soft flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-carmine flex-shrink-0 mt-0.5" />
            <div>
              <SmallText className="text-carmine font-medium">Error</SmallText>
              <SmallText className="text-carmine">{error}</SmallText>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2">
            <EmberButton
              variant={activeView === 'hearth' ? 'primary' : 'ghost'}
              onClick={() => setActiveView('hearth')}
              size="sm"
            >
              <FlameIcon className="w-4 h-4 mr-2" />
              Hearth
            </EmberButton>
            
            <EmberButton
              variant={activeView === 'friends' ? 'primary' : 'ghost'}
              onClick={() => setActiveView('friends')}
              size="sm"
            >
              <Users className="w-4 h-4 mr-2" />
              Friends
              {friendRequests.filter(req => req.request_type === 'incoming' && req.status === 'pending').length > 0 && (
                <span className="ml-2 w-2 h-2 bg-carmine rounded-full" />
              )}
            </EmberButton>
            
            <EmberButton
              variant={activeView === 'messages' ? 'primary' : 'ghost'}
              onClick={() => setActiveView('messages')}
              size="sm"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Messages
              {hasUnread && (
                <span className="ml-2 px-1.5 py-0.5 bg-carmine text-white text-xs rounded-full min-w-[1rem] text-center">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </EmberButton>
          </div>

          {activeView === 'friends' && (
            <EmberButton
              onClick={() => setShowAddFriend(true)}
              size="sm"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Friend
            </EmberButton>
          )}
        </div>

        {/* Content Views */}
        {activeView === 'hearth' && (
          <div className="space-y-8">
            <div className="text-center">
              <Heading2 className="mb-4">Your Connection Hearth</Heading2>
              <TextBlock className="text-ash max-w-2xl mx-auto">
                Each flame represents a friend. Click on a flame to start a conversation and keep the ember burning bright.
              </TextBlock>
            </div>

            <div className="flex justify-center">
              <BurningPaperCard glowOnHover className="inline-block">
                <Hearth
                  flames={flames}
                  width={800}
                  height={600}
                  onFlameClick={handleFlameClick}
                  className="shadow-2xl"
                />
              </BurningPaperCard>
            </div>

            {flames.length === 0 && (
              <div className="text-center py-12">
                <FlameIcon className="w-16 h-16 text-ash mx-auto mb-4" />
                <Heading3 className="text-ash mb-2">No connections yet</Heading3>
                <TextBlock className="text-ash mb-6">
                  Add friends to see their flames appear in your hearth
                </TextBlock>
                <EmberButton onClick={() => setActiveView('friends')}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Your First Friend
                </EmberButton>
              </div>
            )}
          </div>
        )}

        {activeView === 'friends' && (
          <div className="space-y-8">
            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <div>
                <Heading2 className="mb-6">Friend Requests</Heading2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friendRequests.map((request) => (
                    <BurningPaperCard key={request.request_id}>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-softwhite">
                              {request.request_type === 'incoming' ? request.sender_nickname : request.receiver_nickname}
                            </div>
                            <SmallText className="text-ash">
                              {request.request_type === 'incoming' ? 'Wants to connect' : 'Request sent'}
                            </SmallText>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs ${
                            request.status === 'pending' ? 'bg-ember/20 text-ember' :
                            request.status === 'accepted' ? 'bg-green-500/20 text-green-500' :
                            'bg-carmine/20 text-carmine'
                          }`}>
                            {request.status}
                          </div>
                        </div>
                        
                        {request.message && (
                          <TextBlock className="text-sm text-ash italic">
                            "{request.message}"
                          </TextBlock>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <SmallText className="text-ash">
                            {formatTimeAgo(request.created_at)}
                          </SmallText>
                          
                          {request.request_type === 'incoming' && request.status === 'pending' && (
                            <div className="flex gap-2">
                              <IconedButton
                                icon={<Check className="w-4 h-4" />}
                                label="Accept"
                                onClick={() => handleFriendRequestResponse(request.request_id, 'accepted')}
                                size="sm"
                              />
                              <IconedButton
                                icon={<X className="w-4 h-4" />}
                                label="Decline"
                                onClick={() => handleFriendRequestResponse(request.request_id, 'declined')}
                                variant="ghost"
                                size="sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </BurningPaperCard>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div>
              <Heading2 className="mb-6">Your Friends ({friends.length})</Heading2>
              {friends.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends.map((friend) => {
                    const flame = flames.find(f => f.id === friend.friend_id);
                    return (
                      <BurningPaperCard key={friend.friend_id} glowOnHover>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-ember to-carmine rounded-full flex items-center justify-center text-dark font-bold">
                                {friend.friend_nickname.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-softwhite">{friend.friend_nickname}</div>
                                <SmallText className="text-ash">{friend.friend_unique_code}</SmallText>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-ember to-carmine flex items-center justify-center">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: flame?.strength && flame.strength > 0.7 ? '#FFBF00' : 
                                                   flame?.strength && flame.strength > 0.3 ? '#FF8C00' : '#960018'
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <SmallText className="text-ash">
                              Last interaction: {formatTimeAgo(friend.last_interaction_at)}
                            </SmallText>
                            <EmberButton
                              size="sm"
                              onClick={() => handleFlameClick(friend.friend_id)}
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Chat
                            </EmberButton>
                          </div>
                        </div>
                      </BurningPaperCard>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-ash mx-auto mb-4" />
                  <Heading3 className="text-ash mb-2">No friends yet</Heading3>
                  <TextBlock className="text-ash">
                    Add friends using their unique codes to start building connections
                  </TextBlock>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'messages' && (
          <div className="space-y-6">
            {selectedChatUserId ? (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <EmberButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedChatUserId(null);
                      setSelectedChatUserName('');
                      setSelectedChatConnectionStrength(0.5);
                    }}
                  >
                    ← Back to Conversations
                  </EmberButton>
                  <Heading2>Chat with {selectedChatUserName}</Heading2>
                </div>
                
                <LiveChatBox
                  contactUserId={selectedChatUserId}
                  contactName={selectedChatUserName}
                  connectionStrength={selectedChatConnectionStrength}
                  height={600}
                />
              </div>
            ) : (
              <div>
                <Heading2 className="mb-6">Conversations</Heading2>
                {conversations.length > 0 ? (
                  <div className="space-y-4">
                    {conversations.map((conversation) => (
                      <BurningPaperCard 
                        key={conversation.conversation_id} 
                        glowOnHover
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedChatUserId(conversation.other_user_id);
                          setSelectedChatUserName(conversation.other_user_nickname);
                          // Find connection strength from friends list
                          const friend = friends.find(f => f.friend_id === conversation.other_user_id);
                          const flame = flames.find(f => f.id === conversation.other_user_id);
                          setSelectedChatConnectionStrength(flame?.strength || friend?.connection_strength || 0.5);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-ember to-carmine rounded-full flex items-center justify-center text-dark font-bold">
                              {conversation.other_user_nickname.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-softwhite">{conversation.other_user_nickname}</div>
                                {conversation.unread_count > 0 && (
                                  <span className="px-2 py-1 bg-carmine text-white text-xs rounded-full">
                                    {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-ash truncate">
                                {conversation.last_message_content || 'No messages yet'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <SmallText className="text-ash">
                              {formatTimeAgo(conversation.last_message_at)}
                            </SmallText>
                          </div>
                        </div>
                      </BurningPaperCard>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-ash mx-auto mb-4" />
                    <Heading3 className="text-ash mb-2">No conversations yet</Heading3>
                    <TextBlock className="text-ash">
                      Start a conversation by clicking on a friend's flame in your hearth
                    </TextBlock>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <BurningPaperCard className="w-full max-w-md">
            <form onSubmit={handleAddFriend} className="space-y-6">
              <div className="flex items-center justify-between">
                <Heading2>Add Friend</Heading2>
                <IconedButton
                  icon={<X className="w-4 h-4" />}
                  label="Close"
                  onClick={() => {
                    setShowAddFriend(false);
                    setUniqueCode('');
                    setFriendMessage('');
                    setAddFriendError(null);
                    setAddFriendSuccess(null);
                  }}
                  variant="ghost"
                  size="sm"
                />
              </div>

              {addFriendError && (
                <div className="p-3 bg-carmine/20 border border-carmine/50 rounded-soft">
                  <SmallText className="text-carmine">{addFriendError}</SmallText>
                </div>
              )}

              {addFriendSuccess && (
                <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-soft">
                  <SmallText className="text-green-500">{addFriendSuccess}</SmallText>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-softwhite mb-2">
                  Friend's Unique Code *
                </label>
                <InputBox
                  value={uniqueCode}
                  onChange={setUniqueCode}
                  placeholder="EMBR-XXXXXXXX"
                  className="w-full"
                />
                <SmallText className="text-ash mt-1">
                  Ask your friend for their unique code from their profile
                </SmallText>
              </div>

              <div>
                <label className="block text-sm font-medium text-softwhite mb-2">
                  Message (Optional)
                </label>
                <InputBox
                  value={friendMessage}
                  onChange={setFriendMessage}
                  placeholder="Hi! I'd like to connect with you on Embr"
                  className="w-full"
                />
              </div>

              <div className="flex gap-3">
                <EmberButton
                  type="submit"
                  disabled={addFriendLoading || !uniqueCode.trim()}
                  className="flex-1"
                >
                  {addFriendLoading ? 'Sending...' : 'Send Request'}
                </EmberButton>
                <EmberButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowAddFriend(false);
                    setUniqueCode('');
                    setFriendMessage('');
                    setAddFriendError(null);
                    setAddFriendSuccess(null);
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
  );
};