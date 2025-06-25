import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './auth/AuthProvider';
import { Hearth } from './ui/Hearth';
import { BurningPaperCard } from './ui/Card';
import { IconedButton } from './ui/IconedButton';
import { Heading1, Heading2, TextBlock, SmallText } from './ui/Typography';
import { Flame } from './ui/Flame';
import { 
  getFriends, 
  convertFriendsToFlames, 
  useFriendRequestsSubscription, 
  useFriendshipsSubscription,
  type Friend 
} from '../lib/friends';
import { calculateFlameStrengthsBatch } from '../lib/flameStrength';
import { 
  MessageCircle, 
  Users, 
  Settings, 
  LogOut, 
  Plus,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react';

export const MainPage: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [flameData, setFlameData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const hearthRef = useRef<HTMLDivElement>(null);

  // Real-time subscriptions
  const friendRequestsSubscription = useFriendRequestsSubscription(() => {
    console.log('Friend requests updated, refreshing friends list');
    loadFriends();
  });

  const friendshipsSubscription = useFriendshipsSubscription(() => {
    console.log('Friendships updated, refreshing friends list');
    loadFriends();
  });

  // Load friends and calculate flame strengths
  const loadFriends = async () => {
    try {
      setError(null);
      console.log('Loading friends...');
      
      const { data: friendsData, error: friendsError } = await getFriends();
      
      if (friendsError) {
        throw new Error(friendsError.message || 'Failed to load friends');
      }

      if (friendsData && friendsData.length > 0) {
        console.log('Friends loaded:', friendsData.length);
        setFriends(friendsData);

        // Calculate flame strengths for all friends
        const friendIds = friendsData.map(friend => friend.friend_id);
        const strengths = await calculateFlameStrengthsBatch(friendIds);

        // Convert to flame data with calculated strengths
        const flames = convertFriendsToFlames(friendsData).map(flame => ({
          ...flame,
          strength: strengths[flame.id] || 0.5
        }));

        setFlameData(flames);
        console.log('Flame data updated with strengths:', flames.length);
      } else {
        console.log('No friends found');
        setFriends([]);
        setFlameData([]);
      }
    } catch (err: any) {
      console.error('Error loading friends:', err);
      setError(err.message || 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  // Initialize data and subscriptions
  useEffect(() => {
    loadFriends();

    // Set up subscriptions
    const unsubscribeFriendRequests = friendRequestsSubscription.subscribe();
    const unsubscribeFriendships = friendshipsSubscription.subscribe();

    // Listen for custom events that trigger refreshes
    const handleFriendRequestSent = () => {
      console.log('Friend request sent event received');
      setTimeout(loadFriends, 1000);
    };

    const handleFriendRequestResponded = () => {
      console.log('Friend request responded event received');
      setTimeout(loadFriends, 1000);
    };

    const handleMessageSent = () => {
      console.log('Message sent event received');
      setTimeout(loadFriends, 500);
    };

    window.addEventListener('friendRequestSent', handleFriendRequestSent);
    window.addEventListener('friendRequestResponded', handleFriendRequestResponded);
    window.addEventListener('messageSent', handleMessageSent);

    return () => {
      unsubscribeFriendRequests();
      unsubscribeFriendships();
      friendRequestsSubscription.cleanup();
      friendshipsSubscription.cleanup();
      window.removeEventListener('friendRequestSent', handleFriendRequestSent);
      window.removeEventListener('friendRequestResponded', handleFriendRequestResponded);
      window.removeEventListener('messageSent', handleMessageSent);
    };
  }, []);

  const handleFlameClick = (flameId: string) => {
    console.log('Flame clicked:', flameId);
    // TODO: Open chat with this friend
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    setLoading(true);
    loadFriends();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)] flex items-center justify-center">
        <div className="text-center">
          <Flame strength={0.8} size={60} animated={true} />
          <SmallText className="text-ash mt-4">Loading your hearth...</SmallText>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)] overflow-hidden">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-dark)]/95 backdrop-blur-sm border-b border-ember/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and User Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Flame strength={0.9} size={32} animated={true} />
                <Heading1 className="text-xl bg-gradient-to-r from-ember to-carmine bg-clip-text text-transparent">
                  embr
                </Heading1>
              </div>
              
              {profile && (
                <div className="hidden md:flex items-center gap-3 ml-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-ember to-carmine rounded-full flex items-center justify-center text-dark font-bold text-sm">
                    {profile.nickname.charAt(0)}
                  </div>
                  <div>
                    <SmallText className="text-softwhite font-medium">{profile.nickname}</SmallText>
                    <SmallText className="text-ash text-xs">{profile.unique_code}</SmallText>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <IconedButton
                icon={<Users className="w-5 h-5" />}
                label="Friends"
                variant="ghost"
                size="md"
              />
              
              <IconedButton
                icon={<MessageCircle className="w-5 h-5" />}
                label="Messages"
                variant="ghost"
                size="md"
              />
              
              <div className="relative">
                <IconedButton
                  icon={<Bell className="w-5 h-5" />}
                  label="Notifications"
                  variant="ghost"
                  size="md"
                />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-carmine text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </div>
              
              <IconedButton
                icon={<Settings className="w-5 h-5" />}
                label="Settings"
                variant="ghost"
                size="md"
              />
              
              <IconedButton
                icon={<LogOut className="w-5 h-5" />}
                label="Sign Out"
                variant="ghost"
                size="md"
                onClick={handleSignOut}
              />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <IconedButton
                icon={showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                label="Menu"
                variant="ghost"
                size="md"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              />
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-[var(--color-dark)]/98 border-t border-ember/20">
            <div className="px-4 py-4 space-y-4">
              {profile && (
                <div className="flex items-center gap-3 pb-4 border-b border-ember/20">
                  <div className="w-10 h-10 bg-gradient-to-br from-ember to-carmine rounded-full flex items-center justify-center text-dark font-bold">
                    {profile.nickname.charAt(0)}
                  </div>
                  <div>
                    <SmallText className="text-softwhite font-medium">{profile.nickname}</SmallText>
                    <SmallText className="text-ash text-xs">{profile.unique_code}</SmallText>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <IconedButton
                  icon={<Users className="w-5 h-5" />}
                  label="Friends"
                  variant="ghost"
                  size="md"
                />
                
                <IconedButton
                  icon={<MessageCircle className="w-5 h-5" />}
                  label="Messages"
                  variant="ghost"
                  size="md"
                />
                
                <IconedButton
                  icon={<Bell className="w-5 h-5" />}
                  label="Notifications"
                  variant="ghost"
                  size="md"
                />
                
                <IconedButton
                  icon={<Settings className="w-5 h-5" />}
                  label="Settings"
                  variant="ghost"
                  size="md"
                />
              </div>
              
              <div className="pt-4 border-t border-ember/20">
                <IconedButton
                  icon={<LogOut className="w-5 h-5" />}
                  label="Sign Out"
                  variant="ghost"
                  size="md"
                  onClick={handleSignOut}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="pt-16 h-screen overflow-hidden">
        {/* Fixed Hearth Container - 100px below header */}
        <div 
          ref={hearthRef}
          className="fixed left-0 right-0 bottom-0"
          style={{ 
            top: '164px', // 64px header + 100px spacing
            height: 'calc(100vh - 164px)'
          }}
        >
          {error ? (
            <div className="h-full flex items-center justify-center">
              <BurningPaperCard className="text-center max-w-md mx-4">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-carmine/20 rounded-full mx-auto flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <Heading2 className="text-carmine">Error Loading Friends</Heading2>
                  <TextBlock className="text-ash">{error}</TextBlock>
                  <IconedButton
                    icon={<Plus className="w-5 h-5" />}
                    label="Retry"
                    onClick={handleRefresh}
                  />
                </div>
              </BurningPaperCard>
            </div>
          ) : flameData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <BurningPaperCard className="text-center max-w-md mx-4">
                <div className="space-y-6">
                  <Flame strength={0.3} size={80} animated={true} />
                  <div>
                    <Heading2 className="text-ember mb-4">Your Hearth Awaits</Heading2>
                    <TextBlock className="text-ash mb-6">
                      Your hearth is empty. Add friends to see their flames glow here.
                    </TextBlock>
                    <SmallText className="text-ash">
                      Share your unique code <strong className="text-ember">{profile?.unique_code}</strong> with friends to get started.
                    </SmallText>
                  </div>
                  <IconedButton
                    icon={<Plus className="w-5 h-5" />}
                    label="Add Friends"
                  />
                </div>
              </BurningPaperCard>
            </div>
          ) : (
            <Hearth
              flames={flameData}
              width={window.innerWidth}
              height={window.innerHeight - 164}
              onFlameClick={handleFlameClick}
              onRefresh={handleRefresh}
              className="w-full h-full"
            />
          )}
        </div>
      </main>
    </div>
  );
};