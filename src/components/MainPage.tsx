import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth/AuthProvider';
import { BurningPaperCard } from './ui/Card';
import { EmberButton } from './ui/Button';
import { IconedButton } from './ui/IconedButton';
import { Hearth } from './ui/Hearth';
import { Heading1, Heading2, TextBlock, SmallText } from './ui/Typography';
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
import { calculateFlameStrengthsBatch } from '../lib/flameStrength';
import { 
  Users, 
  UserPlus, 
  MessageCircle, 
  Settings, 
  LogOut, 
  Send, 
  Check, 
  X, 
  AlertCircle,
  RefreshCw,
  Copy,
  CheckCircle,
  Clock,
  UserCheck,
  UserX,
  Flame as FlameIcon
} from 'lucide-react';

export const MainPage: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [flames, setFlames] = useState<FlameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [uniqueCode, setUniqueCode] = useState('');
  const [message, setMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [respondingToRequest, setRespondingToRequest] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load all data - moved before subscription hooks
  const loadData = useCallback(async () => {
    try {
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

      setFriends(friendsData);
      setFriendRequests(requestsData);

      // Calculate flame strengths for all friends
      if (friendsData.length > 0) {
        const friendIds = friendsData.map(friend => friend.friend_id);
        const strengths = await calculateFlameStrengthsBatch(friendIds);
        
        // Update friends with calculated strengths
        const friendsWithStrengths = friendsData.map(friend => ({
          ...friend,
          connection_strength: strengths[friend.friend_id] || friend.connection_strength
        }));
        
        setFriends(friendsWithStrengths);
        
        // Convert to flames for hearth display
        const flameData = convertFriendsToFlames(friendsWithStrengths);
        setFlames(flameData);
      } else {
        setFlames([]);
      }

    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time subscription hooks - now after loadData is defined
  const friendRequestsSubscription = useFriendRequestsSubscription(loadData);
  const friendshipsSubscription = useFriendshipsSubscription(loadData);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set up real-time subscriptions
  useEffect(() => {
    const unsubscribeFriendRequests = friendRequestsSubscription.subscribe();
    const unsubscribeFriendships = friendshipsSubscription.subscribe();

    return () => {
      unsubscribeFriendRequests();
      unsubscribeFriendships();
    };
  }, [friendRequestsSubscription, friendshipsSubscription]);

  // Listen for custom events (friend request sent/responded)
  useEffect(() => {
    const handleFriendRequestSent = () => {
      console.log('Friend request sent event received, refreshing data...');
      setTimeout(loadData, 1000); // Small delay to ensure data is updated
    };

    const handleFriendRequestResponded = (event: CustomEvent) => {
      console.log('Friend request responded event received:', event.detail);
      setTimeout(loadData, 1000); // Small delay to ensure data is updated
    };

    window.addEventListener('friendRequestSent', handleFriendRequestSent);
    window.addEventListener('friendRequestResponded', handleFriendRequestResponded as EventListener);

    return () => {
      window.removeEventListener('friendRequestSent', handleFriendRequestSent);
      window.removeEventListener('friendRequestResponded', handleFriendRequestResponded as EventListener);
    };
  }, [loadData]);

  // Background polling for friend requests and status updates
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        // Only poll if not currently loading and no modals are open
        if (!loading && !showAddFriend && !showRequests) {
          const requestsResult = await getFriendRequests();
          if (requestsResult.data) {
            setFriendRequests(requestsResult.data);
          }
        }
      } catch (error) {
        console.error('Background polling error:', error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [loading, showAddFriend, showRequests]);

  // Background refresh of hearth every 30 minutes
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        console.log('Background hearth refresh...');
        await loadData();
      } catch (error) {
        console.error('Background refresh error:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(refreshInterval);
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSendFriendRequest = async () => {
    if (!uniqueCode.trim()) {
      setError('Please enter a unique code');
      return;
    }

    if (!validateUniqueCode(uniqueCode)) {
      setError('Invalid unique code format. Must be EMBR-XXXXXXXX');
      return;
    }

    setSendingRequest(true);
    setError(null);

    try {
      // First check if the code exists and can be added
      const checkResult = await checkUniqueCodeExists(uniqueCode.trim().toUpperCase());
      
      if (checkResult.error) {
        throw new Error(checkResult.error);
      }

      if (!checkResult.data?.exists) {
        throw new Error('No user found with that unique code');
      }

      if (!checkResult.data?.can_add) {
        throw new Error(checkResult.data?.reason || 'Cannot send friend request to this user');
      }

      // Send the friend request
      const result = await sendFriendRequest(uniqueCode.trim().toUpperCase(), message.trim() || undefined);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to send friend request');
      }

      // Success - clear form and close modal
      setUniqueCode('');
      setMessage('');
      setShowAddFriend(false);
      
      // Refresh data to show the new outgoing request
      setTimeout(loadData, 500);
      
    } catch (err: any) {
      setError(err.message || 'Failed to send friend request');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, response: 'accepted' | 'declined') => {
    setRespondingToRequest(requestId);
    setError(null);

    try {
      const result = await respondToFriendRequest(requestId, response);
      
      if (result.error) {
        throw new Error(result.error.message || `Failed to ${response} friend request`);
      }

      // Refresh data to update the UI
      setTimeout(loadData, 500);
      
    } catch (err: any) {
      setError(err.message || `Failed to ${response} friend request`);
    } finally {
      setRespondingToRequest(null);
    }
  };

  const handleFlameClick = (flameId: string) => {
    const friend = friends.find(f => f.friend_id === flameId);
    if (friend) {
      console.log('Clicked on friend:', friend.friend_nickname);
      // TODO: Open chat with this friend
    }
  };

  const copyUniqueCode = async () => {
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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Count pending incoming requests
  const incomingRequestsCount = friendRequests.filter(req => 
    req.request_type === 'incoming' && req.status === 'pending'
  ).length;

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

  return (
    <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)]">
      {/* Header */}
      <header className="border-b border-ember/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FlameIcon className="w-8 h-8 text-ember" />
            <div>
              <Heading1 className="text-2xl bg-gradient-to-r from-ember to-carmine bg-clip-text text-transparent">
                embr
              </Heading1>
              <SmallText className="text-ash">Welcome back, {profile?.nickname}</SmallText>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Your Unique Code */}
            <div className="flex items-center gap-2">
              <SmallText className="text-ash">Your code:</SmallText>
              <div className="flex items-center gap-2 bg-navy/60 px-3 py-1 rounded-soft border border-ember/30">
                <SmallText className="text-ember font-mono">{profile?.unique_code}</SmallText>
                <button
                  onClick={copyUniqueCode}
                  className="text-ash hover:text-ember transition-colors"
                  title="Copy code"
                >
                  {copiedCode ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <IconedButton
              icon={<UserPlus className="w-5 h-5" />}
              label="Add Friend"
              onClick={() => setShowAddFriend(true)}
            />
            
            <div className="relative">
              <IconedButton
                icon={<Users className="w-5 h-5" />}
                label="Friend Requests"
                onClick={() => setShowRequests(true)}
              />
              {incomingRequestsCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-carmine text-white text-xs rounded-full flex items-center justify-center">
                  {incomingRequestsCount}
                </div>
              )}
            </div>

            <IconedButton
              icon={<RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />}
              label="Refresh"
              onClick={handleRefresh}
              variant="ghost"
            />

            <IconedButton
              icon={<LogOut className="w-5 h-5" />}
              label="Sign Out"
              onClick={handleSignOut}
              variant="ghost"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-8">
        {error && (
          <div className="mb-6 p-4 bg-carmine/20 border border-carmine/50 rounded-soft flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-carmine flex-shrink-0" />
            <SmallText className="text-carmine">{error}</SmallText>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-carmine hover:text-carmine/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Hearth Section */}
        <div className="text-center mb-8">
          <Heading2 className="mb-4 bg-gradient-to-r from-ember to-carmine bg-clip-text text-transparent">
            Your Connection Hearth
          </Heading2>
          <TextBlock className="text-ash max-w-2xl mx-auto mb-8">
            Each flame represents a friend. Bright flames show active connections, 
            while dim flames need your attention.
          </TextBlock>
        </div>

        {/* Hearth Display */}
        <div className="flex justify-center mb-8">
          {flames.length > 0 ? (
            <Hearth
              flames={flames}
              width={800}
              height={600}
              onFlameClick={handleFlameClick}
              className="shadow-2xl"
            />
          ) : (
            <BurningPaperCard className="w-[800px] h-[600px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <FlameIcon className="w-16 h-16 text-ash mx-auto" />
                <Heading2 className="text-ash">No connections yet</Heading2>
                <TextBlock className="text-ash">
                  Add friends to see their flames in your hearth
                </TextBlock>
                <EmberButton onClick={() => setShowAddFriend(true)}>
                  Add Your First Friend
                </EmberButton>
              </div>
            </BurningPaperCard>
          )}
        </div>

        {/* Stats */}
        {flames.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <BurningPaperCard className="text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-ember">{friends.length}</div>
                <SmallText className="text-ash">Total Friends</SmallText>
              </div>
            </BurningPaperCard>
            
            <BurningPaperCard className="text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-ember">
                  {flames.filter(f => f.strength >= 0.7).length}
                </div>
                <SmallText className="text-ash">Strong Connections</SmallText>
              </div>
            </BurningPaperCard>
            
            <BurningPaperCard className="text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-carmine">
                  {flames.filter(f => f.strength < 0.3).length}
                </div>
                <SmallText className="text-ash">Need Attention</SmallText>
              </div>
            </BurningPaperCard>
          </div>
        )}
      </main>

      {/* Bolt Logo - Bottom Center */}
      <div className="flex justify-center pb-8">
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

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <BurningPaperCard glowOnHover className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <Heading2 className="text-ember">Add Friend</Heading2>
              <button
                onClick={() => {
                  setShowAddFriend(false);
                  setUniqueCode('');
                  setMessage('');
                  setError(null);
                }}
                className="text-ash hover:text-softwhite transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

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
                  className="w-full px-4 py-2 bg-navy text-softwhite border border-ember/30 rounded-soft focus:outline-none focus:ring-2 focus:ring-ember/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-softwhite mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Say hello..."
                  rows={3}
                  className="w-full px-4 py-2 bg-navy text-softwhite border border-ember/30 rounded-soft focus:outline-none focus:ring-2 focus:ring-ember/40 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
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
              </div>
            </div>
          </BurningPaperCard>
        </div>
      )}

      {/* Friend Requests Modal */}
      {showRequests && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <BurningPaperCard glowOnHover className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <Heading2 className="text-ember">Friend Requests</Heading2>
              <button
                onClick={() => {
                  setShowRequests(false);
                  setError(null);
                }}
                className="text-ash hover:text-softwhite transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[60vh] space-y-4">
              {friendRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-ash mx-auto mb-4" />
                  <TextBlock className="text-ash">No friend requests</TextBlock>
                </div>
              ) : (
                friendRequests.map((request) => (
                  <div
                    key={request.request_id}
                    className="p-4 bg-navy/40 rounded-soft border border-ember/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <SmallText className="font-medium text-softwhite">
                            {request.request_type === 'incoming' 
                              ? `From: ${request.sender_nickname}`
                              : `To: ${request.receiver_nickname}`
                            }
                          </SmallText>
                          <div className={`px-2 py-1 rounded text-xs ${
                            request.status === 'pending' 
                              ? 'bg-ember/20 text-ember'
                              : request.status === 'accepted'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-carmine/20 text-carmine'
                          }`}>
                            {request.status}
                          </div>
                          <div className={`px-2 py-1 rounded text-xs ${
                            request.request_type === 'incoming'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {request.request_type}
                          </div>
                        </div>
                        
                        {request.message && (
                          <TextBlock className="text-sm text-ash mb-2">
                            "{request.message}"
                          </TextBlock>
                        )}
                        
                        <SmallText className="text-ash">
                          {formatTimeAgo(request.created_at)}
                        </SmallText>
                      </div>

                      {request.request_type === 'incoming' && request.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleRespondToRequest(request.request_id, 'accepted')}
                            disabled={respondingToRequest === request.request_id}
                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-soft transition-colors disabled:opacity-50"
                            title="Accept"
                          >
                            {respondingToRequest === request.request_id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleRespondToRequest(request.request_id, 'declined')}
                            disabled={respondingToRequest === request.request_id}
                            className="p-2 bg-carmine hover:bg-carmine/80 text-white rounded-soft transition-colors disabled:opacity-50"
                            title="Decline"
                          >
                            {respondingToRequest === request.request_id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserX className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}

                      {request.request_type === 'outgoing' && request.status === 'pending' && (
                        <div className="ml-4 flex items-center">
                          <Clock className="w-4 h-4 text-ash" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </BurningPaperCard>
        </div>
      )}
    </div>
  );
};