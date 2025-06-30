import React from 'react';
import { BurningPaperCard } from './ui/Card';
import { IconedButton } from './ui/IconedButton';
import { SmallText } from './ui/Typography';
import { X } from 'lucide-react';
import { SettingsTabNavigation } from './SettingsTabNavigation';
import { ProfileTab } from './ProfileTab';
import { FriendsTab } from './FriendsTab';

interface ValidationMessage {
  type: 'success' | 'error';
  message: string;
}

interface FriendRequest {
  request_id: string;
  request_type: 'incoming' | 'outgoing';
  status: 'pending' | 'accepted' | 'declined';
  sender_nickname: string;
  receiver_nickname: string;
  created_at: string;
}

interface SettingsModalProps {
  showSettings: boolean;
  activeTab: 'profile' | 'friends';
  onClose: () => void;
  onTabChange: (tab: 'profile' | 'friends') => void;
  
  // Profile tab props
  nickname: string;
  onNicknameChange: (value: string) => void;
  currentPassword: string;
  onCurrentPasswordChange: (value: string) => void;
  newPassword: string;
  onNewPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  profileMessage: ValidationMessage | null;
  uniqueCode: string;
  onSaveProfile: () => void;
  onChangePassword: () => void;
  onCopyUniqueCode: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  
  // Friends tab props
  friendUsername: string;
  onFriendUsernameChange: (value: string) => void;
  friendsMessage: ValidationMessage | null;
  error: string | null;
  loading: boolean;
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  onAddFriend: () => void;
  onRefresh: () => void;
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  showSettings,
  activeTab,
  onClose,
  onTabChange,
  nickname,
  onNicknameChange,
  currentPassword,
  onCurrentPasswordChange,
  newPassword,
  onNewPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  profileMessage,
  uniqueCode,
  onSaveProfile,
  onChangePassword,
  onCopyUniqueCode,
  onLogout,
  onDeleteAccount,
  friendUsername,
  onFriendUsernameChange,
  friendsMessage,
  error,
  loading,
  incomingRequests,
  outgoingRequests,
  onAddFriend,
  onRefresh,
  onAcceptRequest,
  onDeclineRequest
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
            <SettingsTabNavigation
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
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
              <ProfileTab
                nickname={nickname}
                onNicknameChange={onNicknameChange}
                currentPassword={currentPassword}
                onCurrentPasswordChange={onCurrentPasswordChange}
                newPassword={newPassword}
                onNewPasswordChange={onNewPasswordChange}
                confirmPassword={confirmPassword}
                onConfirmPasswordChange={onConfirmPasswordChange}
                profileMessage={profileMessage}
                uniqueCode={uniqueCode}
                onSaveProfile={onSaveProfile}
                onChangePassword={onChangePassword}
                onCopyUniqueCode={onCopyUniqueCode}
                onLogout={onLogout}
                onDeleteAccount={onDeleteAccount}
              />
            )}

            {activeTab === 'friends' && (
              <FriendsTab
                friendUsername={friendUsername}
                onFriendUsernameChange={onFriendUsernameChange}
                friendsMessage={friendsMessage}
                error={error}
                loading={loading}
                incomingRequests={incomingRequests}
                outgoingRequests={outgoingRequests}
                onAddFriend={onAddFriend}
                onRefresh={onRefresh}
                onAcceptRequest={onAcceptRequest}
                onDeclineRequest={onDeclineRequest}
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