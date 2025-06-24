import React from 'react';
import { BurningPaperCard } from '../ui/Card';
import { IconedButton } from '../ui/IconedButton';
import { SmallText } from '../ui/Typography';
import { ProfileSettings } from './ProfileSettings';
import { FriendsSettings } from './FriendsSettings';
import { X, User, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

interface ValidationMessage {
  type: 'success' | 'error';
  message: string;
}

interface FriendRequest {
  request_id: string;
  sender_id: string;
  receiver_id: string;
  sender_nickname: string;
  receiver_nickname: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  created_at: string;
  request_type: 'incoming' | 'outgoing';
}

interface SettingsModalProps {
  showSettings: boolean;
  activeTab: 'profile' | 'friends';
  setActiveTab: (tab: 'profile' | 'friends') => void;
  onClose: () => void;
  
  // Profile props
  nickname: string;
  setNickname: (value: string) => void;
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  profileMessage: ValidationMessage | null;
  uniqueCode: string;
  copySuccess: boolean;
  onSaveProfile: () => void;
  onPasswordChange: () => void;
  onCopyUniqueCode: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  
  // Friends props
  friendUsername: string;
  setFriendUsername: (value: string) => void;
  friendsMessage: ValidationMessage | null;
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  loading: boolean;
  error: string | null;
  onAddFriend: () => void;
  onRefresh: () => void;
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  formatTimeAgo: (dateString: string) => string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  showSettings,
  activeTab,
  setActiveTab,
  onClose,
  
  // Profile props
  nickname,
  setNickname,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  profileMessage,
  uniqueCode,
  copySuccess,
  onSaveProfile,
  onPasswordChange,
  onCopyUniqueCode,
  onLogout,
  onDeleteAccount,
  
  // Friends props
  friendUsername,
  setFriendUsername,
  friendsMessage,
  incomingRequests,
  outgoingRequests,
  loading,
  error,
  onAddFriend,
  onRefresh,
  onAcceptRequest,
  onDeclineRequest,
  formatTimeAgo
}) => {
  if (!showSettings) return null;

  return (
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
              onClick={onClose}
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

          {/* Validation Messages */}
          {(profileMessage && activeTab === 'profile') && (
            <div className="px-6 pb-4">
              <div className={`p-3 rounded-soft border flex items-start gap-3 ${
                profileMessage.type === 'success' 
                  ? 'bg-ember/20 border-ember/50' 
                  : 'bg-carmine/20 border-carmine/50'
              }`}>
                {profileMessage.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-ember flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-carmine flex-shrink-0 mt-0.5" />
                )}
                <SmallText className={profileMessage.type === 'success' ? 'text-ember' : 'text-carmine'}>
                  {profileMessage.message}
                </SmallText>
              </div>
            </div>
          )}

          {(friendsMessage && activeTab === 'friends') && (
            <div className="px-6 pb-4">
              <div className={`p-3 rounded-soft border flex items-start gap-3 ${
                friendsMessage.type === 'success' 
                  ? 'bg-ember/20 border-ember/50' 
                  : 'bg-carmine/20 border-carmine/50'
              }`}>
                {friendsMessage.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-ember flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-carmine flex-shrink-0 mt-0.5" />
                )}
                <SmallText className={friendsMessage.type === 'success' ? 'text-ember' : 'text-carmine'}>
                  {friendsMessage.message}
                </SmallText>
              </div>
            </div>
          )}

          {/* Scrollable Content Area */}
          <div 
            className="flex-1 overflow-y-auto px-6 scrollbar-hide"
            style={{ 
              maxHeight: '400px',
              minHeight: '200px'
            }}
          >
            {activeTab === 'profile' && (
              <ProfileSettings
                nickname={nickname}
                setNickname={setNickname}
                currentPassword={currentPassword}
                setCurrentPassword={setCurrentPassword}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                profileMessage={profileMessage}
                uniqueCode={uniqueCode}
                copySuccess={copySuccess}
                onSaveProfile={onSaveProfile}
                onPasswordChange={onPasswordChange}
                onCopyUniqueCode={onCopyUniqueCode}
                onLogout={onLogout}
                onDeleteAccount={onDeleteAccount}
              />
            )}

            {activeTab === 'friends' && (
              <FriendsSettings
                friendUsername={friendUsername}
                setFriendUsername={setFriendUsername}
                friendsMessage={friendsMessage}
                incomingRequests={incomingRequests}
                outgoingRequests={outgoingRequests}
                loading={loading}
                error={error}
                onAddFriend={onAddFriend}
                onRefresh={onRefresh}
                onAcceptRequest={onAcceptRequest}
                onDeclineRequest={onDeclineRequest}
                formatTimeAgo={formatTimeAgo}
              />
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
  );
};