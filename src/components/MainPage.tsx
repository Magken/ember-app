import React, { useState, useEffect } from 'react';
import { BurningPaperCard } from './ui/Card';
import { IconedButton } from './ui/IconedButton';
import { InputBox } from './ui/InputBox';
import { PasswordInput } from './ui/PasswordInput';
import { EmberButton } from './ui/Button';
import { Flame } from './ui/Flame';
import { Hearth } from './ui/Hearth';
import { ChatBox } from './ui/ChatBox';
import { Heading2, Heading3, TextBlock, SmallText, TinyText } from './ui/Typography';
import { Settings, User, UserPlus, X, Clock, CheckCircle, XCircle, Copy, LogOut, Trash2 } from 'lucide-react';

interface FriendRequest {
  id: string;
  username: string;
  type: 'incoming' | 'outgoing';
  timestamp: Date;
  status: 'pending' | 'accepted' | 'declined';
}

interface FlameData {
  id: string;
  x: number;
  y: number;
  strength: number;
  size?: number;
  name?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
  senderName: string;
  seen?: boolean;
}

export const MainPage: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedContact, setSelectedContact] = useState<FlameData | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'friends'>('profile');
  const [nickname, setNickname] = useState('Alex');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [friendUsername, setFriendUsername] = useState('');
  const [hearthDimensions, setHearthDimensions] = useState({ width: 800, height: 600 });

  // User's unique code for friend connections
  const [uniqueCode] = useState('EMBR-' + Math.random().toString(36).substr(2, 8).toUpperCase());

  // Sample friend requests data
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([
    {
      id: '1',
      username: 'sarah_m',
      type: 'incoming',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: 'pending'
    },
    {
      id: '2',
      username: 'mike_dev',
      type: 'incoming',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: 'pending'
    },
    {
      id: '3',
      username: 'emma_artist',
      type: 'outgoing',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      status: 'pending'
    },
    {
      id: '4',
      username: 'david_music',
      type: 'outgoing',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
      status: 'pending'
    }
  ]);

  // Sample user connections with increased spacing
  const [userConnections] = useState<FlameData[]>([
    { id: '1', x: 20, y: 25, strength: 0.9, size: 70, name: 'Sarah' },
    { id: '2', x: 60, y: 20, strength: 0.7, size: 60, name: 'Mike' },
    { id: '3', x: 85, y: 45, strength: 0.5, size: 50, name: 'Emma' },
    { id: '4', x: 15, y: 70, strength: 0.2, size: 40, name: 'Tom' },
    { id: '5', x: 45, y: 75, strength: 0.8, size: 65, name: 'Lisa' },
    { id: '6', x: 75, y: 65, strength: 0.3, size: 45, name: 'David' },
    { id: '7', x: 35, y: 40, strength: 0.6, size: 55, name: 'Anna' },
    { id: '8', x: 90, y: 80, strength: 0.15, size: 35, name: 'Jake' },
  ]);

  // Sample user data
  const userNickname = nickname || 'Alex';

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

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    // Simulate password change
    alert('Password changed successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleAddFriend = () => {
    if (!friendUsername.trim()) {
      alert('Please enter a username or unique code');
      return;
    }
    
    // Add new outgoing friend request
    const newRequest: FriendRequest = {
      id: Date.now().toString(),
      username: friendUsername.trim(),
      type: 'outgoing',
      timestamp: new Date(),
      status: 'pending'
    };
    
    setFriendRequests(prev => [newRequest, ...prev]);
    alert(`Friend request sent to ${friendUsername}!`);
    setFriendUsername('');
  };

  const handleSaveProfile = () => {
    if (!nickname.trim()) {
      alert('Nickname cannot be empty');
      return;
    }
    
    // Simulate saving profile
    alert('Profile updated successfully!');
  };

  const handleAcceptRequest = (requestId: string) => {
    setFriendRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'accepted' } : req
    ));
    
    // Remove accepted request after a short delay
    setTimeout(() => {
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    }, 1500);
  };

  const handleDeclineRequest = (requestId: string) => {
    setFriendRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'declined' } : req
    ));
    
    // Remove declined request after a short delay
    setTimeout(() => {
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    }, 1500);
  };

  const copyUniqueCode = () => {
    navigator.clipboard.writeText(uniqueCode).then(() => {
      alert('Unique code copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy code. Please copy manually: ' + uniqueCode);
    });
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      alert('Logged out successfully!');
      // Here you would typically redirect to login page
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      if (confirm('This will permanently delete all your data and connections. Are you absolutely sure?')) {
        alert('Account deletion initiated. You will receive a confirmation email.');
        // Here you would typically handle account deletion
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
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Generate sample messages for the selected contact
  const generateSampleMessages = (contactName: string): Message[] => {
    const messages: Message[] = [
      {
        id: '3',
        text: `Hey! How have you been? It's been a while since we last talked.`,
        sender: 'other',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        senderName: contactName,
        seen: true
      },
      {
        id: '2',
        text: `I've been good! Just busy with work. How about you?`,
        sender: 'user',
        timestamp: new Date(Date.now() - 1000 * 60 * 25),
        senderName: 'You',
        seen: true
      },
      {
        id: '1',
        text: `Same here! Our ember has been glowing nicely lately 🔥`,
        sender: 'other',
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        senderName: contactName,
        seen: true
      }
    ];
    return messages;
  };

  const incomingRequests = friendRequests.filter(req => req.type === 'incoming' && req.status === 'pending');
  const outgoingRequests = friendRequests.filter(req => req.type === 'outgoing' && req.status === 'pending');

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Enable scrolling for smaller screens */}
      <div className="min-h-screen overflow-auto">
        {/* Header Section - Fixed at top */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left side - empty for balance */}
            <div className="w-12"></div>
            
            {/* Center - User's Hearth Title and Flame */}
            <div className="flex items-center gap-3">
              <Flame strength={0.8} size={32} animated={true} interactive={true} />
              <SmallText className="bg-gradient-to-r from-ember via-carmine to-ember bg-clip-text text-transparent font-medium text-lg whitespace-nowrap">
                {userNickname}'s Hearth
              </SmallText>
            </div>
            
            {/* Right side - Settings Button */}
            <div className="flex justify-end">
              <IconedButton
                icon={<Settings className="w-5 h-5" />}
                label="Settings"
                size="md"
                onClick={() => setShowSettings(true)}
              />
            </div>
          </div>
        </header>

        {/* Main Content - Hearth Display or Chat */}
        <main className="pt-20 min-h-screen">
          {showChat && selectedContact ? (
            /* Chat Interface - Full Screen */
            <div className="w-full h-screen pt-4 px-4 pb-4">
              <div className="w-full h-full max-w-4xl mx-auto">
                <ChatBox
                  contactName={selectedContact.name || 'Unknown'}
                  connectionStrength={selectedContact.strength}
                  onClose={handleCloseChat}
                  height={window.innerHeight - 120} // Account for header and padding
                  initialMessages={generateSampleMessages(selectedContact.name || 'Unknown')}
                />
              </div>
            </div>
          ) : (
            /* Hearth Display */
            <div className="w-full min-h-screen flex items-center justify-center px-4 overflow-auto">
              <div className="w-full h-full">
                {/* Responsive Hearth Component with scrolling support */}
                <div 
                  className="w-full h-full overflow-auto scrollbar-hide"
                  style={{
                    minWidth: `${hearthDimensions.width}px`,
                    minHeight: `${hearthDimensions.height}px`
                  }}
                >
                  <Hearth
                    flames={userConnections}
                    width={hearthDimensions.width}
                    height={hearthDimensions.height}
                    onFlameClick={handleFlameClick}
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md">
              <BurningPaperCard glowOnHover className="relative max-h-[600px] flex flex-col">
                {/* Close Button - Positioned safely within card bounds */}
                <div className="absolute top-6 right-6 z-60">
                  <IconedButton
                    icon={<X className="w-4 h-4" />}
                    label="Close Settings"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowSettings(false)}
                  />
                </div>

                {/* Header Section - Fixed */}
                <div className="flex-shrink-0 px-6 pt-6 pb-4">
                  {/* Interactive Tab Navigation with Ember Effects */}
                  <div className="flex mb-4 relative">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`flex-1 px-4 py-3 text-center font-medium transition-all duration-300 relative overflow-visible ${
                        activeTab === 'profile'
                          ? 'text-ember border-b-2 border-ember'
                          : 'text-ash hover:text-softwhite'
                      }`}
                    >
                      {/* Ember particles for active tab */}
                      {activeTab === 'profile' && Array.from({ length: 12 }).map((_, i) => (
                        <span
                          key={`profile-ember-${i}`}
                          className="absolute rounded-full pointer-events-none z-10 animate-ember"
                          style={{
                            width: `${1 + Math.random()}px`,
                            height: `${1 + Math.random()}px`,
                            backgroundColor: `rgb(255,191,0)`,
                            left: `${10 + Math.random() * 80}%`,
                            top: `${10 + Math.random() * 80}%`,
                            filter: 'blur(0.5px) brightness(2)',
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                            boxShadow: '0 0 3px currentColor',
                            mixBlendMode: 'screen'
                          } as React.CSSProperties}
                        />
                      ))}
                      <User className="w-4 h-4 inline mr-2" />
                      Profile
                    </button>
                    <button
                      onClick={() => setActiveTab('friends')}
                      className={`flex-1 px-4 py-3 text-center font-medium transition-all duration-300 relative overflow-visible ${
                        activeTab === 'friends'
                          ? 'text-ember border-b-2 border-ember'
                          : 'text-ash hover:text-softwhite'
                      }`}
                    >
                      {/* Ember particles for active tab */}
                      {activeTab === 'friends' && Array.from({ length: 12 }).map((_, i) => (
                        <span
                          key={`friends-ember-${i}`}
                          className="absolute rounded-full pointer-events-none z-10 animate-ember"
                          style={{
                            width: `${1 + Math.random()}px`,
                            height: `${1 + Math.random()}px`,
                            backgroundColor: `rgb(255,191,0)`,
                            left: `${10 + Math.random() * 80}%`,
                            top: `${10 + Math.random() * 80}%`,
                            filter: 'blur(0.5px) brightness(2)',
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                            boxShadow: '0 0 3px currentColor',
                            mixBlendMode: 'screen'
                          } as React.CSSProperties}
                        />
                      ))}
                      <UserPlus className="w-4 h-4 inline mr-2" />
                      Friends
                    </button>
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div 
                  className="flex-1 overflow-y-auto px-6 scrollbar-hide"
                  style={{ 
                    maxHeight: '400px',
                    minHeight: '200px'
                  }}
                >
                  {activeTab === 'profile' && (
                    <div className="space-y-6 pb-4">
                      <div>
                        <Heading3 className="mb-4">Profile Settings</Heading3>
                        
                        {/* Nickname Section */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-softwhite mb-2">
                              Nickname
                            </label>
                            <InputBox
                              value={nickname}
                              onChange={setNickname}
                              placeholder="Your display name"
                            />
                          </div>
                          
                          <div className="pt-2">
                            <EmberButton size="sm" onClick={handleSaveProfile}>
                              Save Profile
                            </EmberButton>
                          </div>
                        </div>

                        {/* Unique Code Section */}
                        <div className="my-8 pt-6 border-t border-ember/30">
                          <Heading3 className="text-lg mb-4">Your Unique Code</Heading3>
                          <TextBlock className="text-sm text-ash mb-4">
                            Share this code with friends so they can add you to their hearth.
                          </TextBlock>
                          
                          <div className="flex items-center gap-3 p-3 bg-navy/40 rounded border border-ember/30">
                            <code className="flex-1 text-ember font-mono text-sm bg-dark/50 px-3 py-2 rounded">
                              {uniqueCode}
                            </code>
                            <IconedButton
                              icon={<Copy className="w-4 h-4" />}
                              label="Copy Code"
                              size="sm"
                              variant="ghost"
                              onClick={copyUniqueCode}
                            />
                          </div>
                        </div>

                        {/* Password Change Section */}
                        <div className="space-y-4 pt-6 border-t border-ember/30">
                          <Heading3 className="text-lg">Change Password</Heading3>
                          
                          <div>
                            <label className="block text-sm font-medium text-softwhite mb-2">
                              Current Password
                            </label>
                            <PasswordInput
                              value={currentPassword}
                              onChange={setCurrentPassword}
                              placeholder="Enter current password"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-softwhite mb-2">
                              New Password
                            </label>
                            <PasswordInput
                              value={newPassword}
                              onChange={setNewPassword}
                              placeholder="Enter new password"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-softwhite mb-2">
                              Confirm New Password
                            </label>
                            <PasswordInput
                              value={confirmPassword}
                              onChange={setConfirmPassword}
                              placeholder="Confirm new password"
                            />
                          </div>

                          <div className="pt-2">
                            <EmberButton size="sm" onClick={handlePasswordChange}>
                              Change Password
                            </EmberButton>
                          </div>
                        </div>

                        {/* Account Actions Section */}
                        <div className="space-y-4 pt-6 border-t border-ember/30">
                          <Heading3 className="text-lg">Account Actions</Heading3>
                          
                          <div className="space-y-3">
                            <button
                              onClick={handleLogout}
                              className="w-full px-4 py-2 text-sm bg-navy/40 text-softwhite border border-ember/30 rounded-soft hover:bg-navy/60 hover:border-ember/50 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                              Log Out
                            </button>
                            
                            <button
                              onClick={handleDeleteAccount}
                              className="w-full px-4 py-2 text-sm bg-carmine/20 text-carmine border border-carmine/50 rounded-soft hover:bg-carmine/30 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Account
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'friends' && (
                    <div className="space-y-6 pb-4">
                      <div>
                        <Heading3 className="mb-4">Add Friend</Heading3>
                        <TextBlock className="text-sm text-ash mb-6">
                          Enter a username or unique code to send a friend request. Once accepted, their ember will appear in your hearth.
                        </TextBlock>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-softwhite mb-2">
                              Username or Unique Code
                            </label>
                            <InputBox
                              value={friendUsername}
                              onChange={setFriendUsername}
                              placeholder="Enter username or EMBR-XXXXXXXX"
                            />
                          </div>
                          
                          <div className="pt-2">
                            <EmberButton size="sm" onClick={handleAddFriend}>
                              Send Friend Request
                            </EmberButton>
                          </div>
                        </div>

                        {/* Incoming Friend Requests Section */}
                        <div className="mt-8 pt-6 border-t border-ember/30">
                          <Heading3 className="text-lg mb-4 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-ember" />
                            Incoming Requests
                          </Heading3>
                          
                          <div className="space-y-3">
                            {incomingRequests.length > 0 ? (
                              incomingRequests.map((request) => (
                                <div key={request.id} className="flex items-center justify-between p-3 bg-navy/40 rounded border border-ember/30 transition-all duration-300 hover:border-ember/50">
                                  <div>
                                    <SmallText className="font-medium text-softwhite">{request.username}</SmallText>
                                    <TinyText className="text-ash block">{formatTimeAgo(request.timestamp)}</TinyText>
                                  </div>
                                  <div className="flex gap-2">
                                    {request.status === 'pending' ? (
                                      <>
                                        <IconedButton
                                          icon={<CheckCircle className="w-4 h-4" />}
                                          label="Accept"
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleAcceptRequest(request.id)}
                                          className="text-ember hover:bg-ember/20"
                                        />
                                        <IconedButton
                                          icon={<XCircle className="w-4 h-4" />}
                                          label="Decline"
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleDeclineRequest(request.id)}
                                          className="text-carmine hover:bg-carmine/20"
                                        />
                                      </>
                                    ) : request.status === 'accepted' ? (
                                      <span className="px-3 py-1 text-xs bg-ember/20 text-ember rounded">Accepted</span>
                                    ) : (
                                      <span className="px-3 py-1 text-xs bg-carmine/20 text-carmine rounded">Declined</span>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6">
                                <UserPlus className="w-8 h-8 text-ash mx-auto mb-2 opacity-50" />
                                <SmallText className="text-ash">No incoming friend requests</SmallText>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Outgoing Friend Requests Section */}
                        <div className="pt-6 border-t border-ember/30">
                          <Heading3 className="text-lg mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-ember" />
                            Sent Requests
                          </Heading3>
                          
                          <div className="space-y-3">
                            {outgoingRequests.length > 0 ? (
                              outgoingRequests.map((request) => (
                                <div key={request.id} className="flex items-center justify-between p-3 bg-deepblue/40 rounded border border-ember/20 transition-all duration-300 hover:border-ember/40">
                                  <div>
                                    <SmallText className="font-medium text-softwhite">{request.username}</SmallText>
                                    <TinyText className="text-ash block">{formatTimeAgo(request.timestamp)}</TinyText>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-ash" />
                                    <span className="px-3 py-1 text-xs bg-ash/20 text-ash rounded">Pending</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6">
                                <Clock className="w-8 h-8 text-ash mx-auto mb-2 opacity-50" />
                                <SmallText className="text-ash">No pending sent requests</SmallText>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer - Fixed at bottom */}
                <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-ember/30">
                  <SmallText className="text-center text-ash">
                    Your connections are private and secure.
                  </SmallText>
                </div>
              </BurningPaperCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};