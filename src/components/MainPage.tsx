import React, { useState, useEffect } from 'react';
import { useAuth } from './auth/AuthProvider';
import { BurningPaperCard } from './ui/Card';
import { EmberButton } from './ui/Button';
import { IconedButton } from './ui/IconedButton';
import { Flame } from './ui/Flame';
import { Hearth } from './ui/Hearth';
import { ChatBox } from './ui/ChatBox';
import { Heading1, Heading2, Heading3, TextBlock, SmallText } from './ui/Typography';
import { 
  getFriends, 
  convertFriendsToFlames, 
  sendFriendRequest, 
  getFriendRequests, 
  respondToFriendRequest,
  validateUniqueCode,
  useFriendRequestsSubscription,
  useFriendshipsSubscription,
  type Friend,
  type FriendRequest,
  type FlameData
} from '../lib/friends';
import { calculateFlameStrengthsBatch } from '../lib/flameStrength';
import { 
  Users, 
  MessageCircle, 
  Settings, 
  Plus, 
  Check, 
  X, 
  Send,
  UserPlus,
  Heart,
  Flame as FlameIcon,
  LogOut,
  User,
  Mail,
  Shield,
  Trash2,
  RefreshCw
} from 'lucide-react';

export const MainPage: React.FC = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'hearth' | 'friends' | 'profile'>('hearth');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [flames, setFlames] = useState<FlameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  
  // Friend request form state
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [uniqueCode, setUniqueCode] = useState('');
  const [friendMessage, setFriendMessage] = useState('');
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const [addFriendError, setAddFriendError] = useState<string | null>(null);

  // Real-time subscriptions
  const friendRequestsSubscription = useFriendRequestsSubscription(() => {
    console.log('Friend requests updated, refreshing...');
    loadFriendRequests();
  });

  const friendshipsSubscription = useFriendshipsSubscription(() => {
    console.log('Friendships updated, refreshing...');
    loadFriends();
  });

  // Set up real-time subscriptions
  useEffect(() => {
    const unsubscribeFriendRequests = friendRequestsSubscription.subscribe();
    const unsubscribeFriendships = friendshipsSubscription.subscribe();

    // Listen for custom events from friend actions
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

    window.addEventListener('friendRequestSent', handleFriendRequestSent);
    window.addEventListener('friendRequestResponded', handleFriendRequestResponded as EventListener);

    return () => {
      unsubscribeFriendRequests();
      unsubscribeFriendships();
      window.removeEventListener('friendRequestSent', handleFriendRequestSent);
      window.removeEventListener('friendRequestResponded', handleFriendRequestResponded as EventListener);
    };
  }, []);

  // Load friends data
  const loadFriends = async () => {
    try {
      console.log('Loading friends...');
      const { data: friendsData, error: friendsError } = await getFriends();
      
      if (friendsError) {
        throw friendsError;
      }

      console.log('Friends loaded:', friendsData?.length || 0);
      setFriends(friendsData || []);

      // Calculate flame strengths for all friends
      if (friendsData && friendsData.length > 0) {
        console.log('Calculating flame strengths...');
        const friendIds = friendsData.map(friend => friend.friend_id);
        const strengths = await calculateFlameStrengthsBatch(friendIds);
        
        // Update friends with calculated strengths
        const friendsWithStrengths = friendsData.map(friend => ({
          ...friend,
          connection_strength: strengths[friend.friend_id] || 0.1
        }));

        setFriends(friendsWithStrengths);
        
        // Convert to flames for hearth
        const flameData = convertFriendsToFlames(friendsWithStrengths);
        console.log('Flame data generated:', flameData.length);
        setFlames(flameData);
      } else {
        setFlames([]);
      }
    } catch (err: any) {
      console.error('Error loading friends:', err);
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

      console.log('Friend requests loaded:', requestsData?.length || 0);
      setFriendRequests(requestsData || []);
    } catch (err: any) {
      console.error('Error loading friend requests:', err);
      setError(err.message || 'Failed to load friend requests');
    }
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          loadFriends(),
          loadFriendRequests()
        ]);
      } catch (err: any) {
        console.error('Error loading initial data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  // Handle adding a friend
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

    try {
      const { data, error } = await sendFriendRequest(uniqueCode, friendMessage || undefined);
      
      if (error) {
        throw error;
      }

      console.log('Friend request sent successfully:', data);
      
      // Reset form
      setUniqueCode('');
      setFriendMessage('');
      setShowAddFriend(false);
      
      // Refresh friend requests
      setTimeout(() => {
        loadFriendRequests();
      }, 500);
      
    } catch (err: any) {
      console.error('Error sending friend request:', err);
      setAddFriendError(err.message || 'Failed to send friend request');
    } finally {
      setAddFriendLoading(false);
    }
  };

  // Handle responding to friend request
  const handleRespondToRequest = async (requestId: string, response: 'accepted' | 'declined') => {
    try {
      console.log('Responding to friend request:', requestId, response);
      const { data, error } = await respondToFriendRequest(requestId, response);
      
      if (error) {
        throw error;
      }

      console.log('Friend request response successful:', data);
      
      // Refresh data
      setTimeout(() => {
        loadFriendRequests();
        if (response === 'accepted') {
          loadFriends();
        }
      }, 500);
      
    } catch (err: any) {
      console.error('Error responding to friend request:', err);
      setError(err.message || 'Failed to respond to friend request');
    }
  };

  // Handle flame click in hearth
  const handleFlameClick = (flameId: string) => {
    console.log('Flame clicked:', flameId);
    setSelectedChat(flameId);
  };

  // Handle refresh
  const handleRefresh = () => {
    console.log('Refreshing data...');
    loadFriends();
    loadFriendRequests();
  };

  // Get pending friend requests counts
  const incomingRequests = friendRequests.filter(req => req.request_type === 'incoming' && req.status === 'pending');
  const outgoingRequests = friendRequests.filter(req => req.request_type === 'outgoing' && req.status === 'pending');

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
      <header className="border-b border-ember/30 bg-navy/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <Flame strength={0.8} size={32} />
              <Heading2 className="text-ember">embr</Heading2>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab('hearth')}
                className={`flex items-center gap-2 px-3 py-2 rounded-soft transition-colors ${
                  activeTab === 'hearth' 
                    ? 'text-ember bg-ember/20' 
                    : 'text-ash hover:text-softwhite'
                }`}
              >
                <FlameIcon className="w-4 h-4" />
                <span>Hearth</span>
              </button>
              
              <button
                onClick={() => setActiveTab('friends')}
                className={`flex items-center gap-2 px-3 py-2 rounded-soft transition-colors relative ${
                  activeTab === 'friends' 
                    ? 'text-ember bg-ember/20' 
                    : 'text-ash hover:text-softwhite'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Friends</span>
                {incomingRequests.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-carmine text-white text-xs rounded-full flex items-center justify-center">
                    {incomingRequests.length}
                  </div>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-3 py-2 rounded-soft transition-colors ${
                  activeTab === 'profile' 
                    ? 'text-ember bg-ember/20' 
                    : 'text-ash hover:text-softwhite'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </button>
            </nav>

            {/* User Info and Sign Out */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-softwhite">{profile?.nickname}</div>
                <div className="text-xs text-ash">{profile?.unique_code}</div>
              </div>
              <IconedButton
                icon={<LogOut className="w-4 h-4" />}
                label="Sign Out"
                onClick={signOut}
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
          <div className="mb-6 p-4 bg-carmine/20 border border-carmine/50 rounded-soft flex items-center gap-3">
            <X className="w-5 h-5 text-carmine flex-shrink-0" />
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

        {/* Hearth Tab */}
        {activeTab === 'hearth' && (
          <div className="space-y-8">
            <div className="text-center">
              <Heading1 className="mb-4 bg-gradient-to-r from-ember to-carmine bg-clip-text text-transparent">
                Your Hearth
              </Heading1>
              <TextBlock className="text-ash max-w-2xl mx-auto">
                Each flame represents a connection. Bright flames show active relationships, 
                while dim flames need your attention.
              </TextBlock>
            </div>

            {/* Hearth Canvas */}
            <div className="flex justify-center" style={{ paddingTop: '100px' }}>
              <Hearth
                flames={flames}
                width={800}
                height={600}
                onFlameClick={handleFlameClick}
                onRefresh={handleRefresh}
                className="shadow-2xl"
              />
            </div>

            {/* Connection Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-navy/60 p-6 rounded-soft border border-ember/30 text-center">
                <div className="text-3xl font-bold text-ember mb-2">{friends.length}</div>
                <div className="text-softwhite">Total Connections</div>
              </div>
              <div className="bg-navy/60 p-6 rounded-soft border border-ember/30 text-center">
                <div className="text-3xl font-bold text-ember mb-2">
                  {flames.filter(f => f.strength > 0.7).length}
                </div>
                <div className="text-softwhite">Strong Flames</div>
              </div>
              <div className="bg-navy/60 p-6 rounded-soft border border-ember/30 text-center">
                <div className="text-3xl font-bold text-carmine mb-2">
                  {flames.filter(f => f.strength < 0.3).length}
                </div>
                <div className="text-softwhite">Dying Flames</div>
              </div>
            </div>
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <Heading1 className="mb-2 bg-gradient-to-r from-ember to-carmine bg-clip-text text-transparent">
                  Friends
                </Heading1>
                <TextBlock className="text-ash">
                  Manage your connections and friend requests
                </TextBlock>
              </div>
              <EmberButton onClick={() => setShowAddFriend(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Friend
              </EmberButton>
            </div>

            {/* Add Friend Form */}
            {showAddFriend && (
              <div className="bg-navy/60 p-6 rounded-soft border border-ember/30">
                <form onSubmit={handleAddFriend} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-softwhite mb-2">
                      Friend's Unique Code
                    </label>
                    <input
                      type="text"
                      value={uniqueCode}
                      onChange={(e) => setUniqueCode(e.target.value.toUpperCase())}
                      placeholder="EMBR-XXXXXXXX"
                      className="w-full px-4 py-2 bg-dark text-softwhite border border-ember/30 rounded-soft focus:outline-none focus:ring-2 focus:ring-ember"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-softwhite mb-2">
                      Message (Optional)
                    </label>
                    <textarea
                      value={friendMessage}
                      onChange={(e) => setFriendMessage(e.target.value)}
                      placeholder="Say hello..."
                      rows={3}
                      className="w-full px-4 py-2 bg-dark text-softwhite border border-ember/30 rounded-soft focus:outline-none focus:ring-2 focus:ring-ember resize-none"
                    />
                  </div>
                  {addFriendError && (
                    <div className="text-carmine text-sm">{addFriendError}</div>
                  )}
                  <div className="flex gap-3">
                    <EmberButton type="submit" disabled={addFriendLoading}>
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
                      }}
                    >
                      Cancel
                    </EmberButton>
                  </div>
                </form>
              </div>
            )}

            {/* Friend Requests */}
            {incomingRequests.length > 0 && (
              <div>
                <Heading3 className="mb-4 text-ember">Incoming Requests</Heading3>
                <div className="space-y-4">
                  {incomingRequests.map((request) => (
                    <div key={request.request_id} className="bg-navy/60 p-4 rounded-soft border border-ember/30 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-softwhite">{request.sender_nickname}</div>
                        {request.message && (
                          <div className="text-sm text-ash mt-1">{request.message}</div>
                        )}
                        <div className="text-xs text-ash mt-1">
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
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
                          variant="ghost"
                          size="sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outgoing Requests */}
            {outgoingRequests.length > 0 && (
              <div>
                <Heading3 className="mb-4 text-ember">Sent Requests</Heading3>
                <div className="space-y-4">
                  {outgoingRequests.map((request) => (
                    <div key={request.request_id} className="bg-navy/60 p-4 rounded-soft border border-ember/30 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-softwhite">{request.receiver_nickname}</div>
                        {request.message && (
                          <div className="text-sm text-ash mt-1">{request.message}</div>
                        )}
                        <div className="text-xs text-ash mt-1">
                          Sent {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm text-ash">Pending</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div>
              <Heading3 className="mb-4 text-ember">Your Friends ({friends.length})</Heading3>
              {friends.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-ash mx-auto mb-4" />
                  <TextBlock className="text-ash">No friends yet. Add some friends to get started!</TextBlock>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends.map((friend) => (
                    <div key={friend.friend_id} className="bg-navy/60 p-4 rounded-soft border border-ember/30 flex items-center gap-4">
                      <Flame strength={friend.connection_strength} size={40} />
                      <div className="flex-1">
                        <div className="font-medium text-softwhite">{friend.friend_nickname}</div>
                        <div className="text-xs text-ash">{friend.friend_unique_code}</div>
                        <div className="text-xs text-ash">
                          Connected {new Date(friend.friendship_created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <IconedButton
                        icon={<MessageCircle className="w-4 h-4" />}
                        label="Chat"
                        onClick={() => setSelectedChat(friend.friend_id)}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-8">
            <div>
              <Heading1 className="mb-2 bg-gradient-to-r from-ember to-carmine bg-clip-text text-transparent">
                Profile
              </Heading1>
              <TextBlock className="text-ash">
                Manage your account settings and information
              </TextBlock>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Profile Info */}
              <div className="bg-navy/60 p-6 rounded-soft border border-ember/30">
                <Heading3 className="mb-4 text-ember">Profile Information</Heading3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-softwhite mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Nickname
                    </label>
                    <div className="text-lg text-softwhite">{profile?.nickname}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-softwhite mb-2">
                      <Shield className="w-4 h-4 inline mr-2" />
                      Unique Code
                    </label>
                    <div className="text-lg text-ember font-mono">{profile?.unique_code}</div>
                    <SmallText className="text-ash mt-1">
                      Share this code with friends so they can add you
                    </SmallText>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-softwhite mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email
                    </label>
                    <div className="text-lg text-softwhite">{user?.email}</div>
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div className="bg-navy/60 p-6 rounded-soft border border-ember/30">
                <Heading3 className="mb-4 text-ember">Account Actions</Heading3>
                <div className="space-y-4">
                  <EmberButton onClick={refreshProfile} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Profile
                  </EmberButton>
                  <EmberButton onClick={signOut} variant="ghost" className="w-full">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </EmberButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Chat Modal */}
      {selectedChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl h-[80vh]">
            <ChatBox
              contactUserId={selectedChat}
              contactName={friends.find(f => f.friend_id === selectedChat)?.friend_nickname || 'Friend'}
              connectionStrength={friends.find(f => f.friend_id === selectedChat)?.connection_strength || 0.5}
              onClose={() => setSelectedChat(null)}
              height={600}
            />
          </div>
        </div>
      )}
    </div>
  );
};