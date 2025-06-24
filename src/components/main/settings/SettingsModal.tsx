import React from 'react';
import { BurningPaperCard } from '../../ui/Card';
import { IconedButton } from '../../ui/IconedButton';
import { SettingsTabs } from './SettingsTabs';
import { ProfileSettings } from './ProfileSettings';
import { FriendsSettings } from './FriendsSettings';
import { X } from 'lucide-react';

interface ValidationMessage {
  type: 'success' | 'error';
  message: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'profile' | 'friends';
  onTabChange: (tab: 'profile' | 'friends') => void;
  profileMessage: ValidationMessage | null;
  friendsMessage: ValidationMessage | null;
  // Profile props
  nickname: string;
  onNicknameChange: (value: string) => void;
  currentPassword: string;
  onCurrentPasswordChange: (value: string) => void;
  newPassword: string;
  onNewPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  onSaveProfile: () => void;
  onPasswordChange: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onCopyUniqueCode: () => void;
  uniqueCode: string;
  copySuccess: boolean;
  // Friends props
  friendUsername: string;
  onFriendUsernameChange: (value: string) => void;
  onAddFriend: () => void;
  onRefreshFriends: () => void;
  incomingRequests: any[];
  outgoingRequests: any[];
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  loading: boolean;
  error: string | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  profileMessage,
  friendsMessage,
  // Profile props
  nickname,
  onNicknameChange,
  currentPassword,
  onCurrentPasswordChange,
  newPassword,
  onNewPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  onSaveProfile,
  onPasswordChange,
  onLogout,
  onDeleteAccount,
  onCopyUniqueCode,
  uniqueCode,
  copySuccess,
  // Friends props
  friendUsername,
  onFriendUsernameChange,
  onAddFriend,
  onRefreshFriends,
  incomingRequests,
  outgoingRequests,
  onAcceptRequest,
  onDeclineRequest,
  loading,
  error
}) => {
  if (!isOpen) return null;

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
            <SettingsTabs
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
            {activeTab === 'profile' ? (
              <ProfileSettings
                message={profileMessage}
                nickname={nickname}
                onNicknameChange={onNicknameChange}
                currentPassword={currentPassword}
                onCurrentPasswordChange={onCurrentPasswordChange}
                newPassword={newPassword}
                onNewPasswordChange={onNewPasswordChange}
                confirmPassword={confirmPassword}
                onConfirmPasswordChange={onConfirmPasswordChange}
                onSaveProfile={onSaveProfile}
                onPasswordChange={onPasswordChange}
                onLogout={onLogout}
                onDeleteAccount={onDeleteAccount}
                onCopyUniqueCode={onCopyUniqueCode}
                uniqueCode={uniqueCode}
                copySuccess={copySuccess}
              />
            ) : (
              <FriendsSettings
                message={friendsMessage}
                friendUsername={friendUsername}
                onFriendUsernameChange={onFriendUsernameChange}
                onAddFriend={onAddFriend}
                onRefreshFriends={onRefreshFriends}
                incomingRequests={incomingRequests}
                outgoingRequests={outgoingRequests}
                onAcceptRequest={onAcceptRequest}
                onDeclineRequest={onDeclineRequest}
                loading={loading}
                error={error}
              />
            )}
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-ember/30">
            <div className="text-center text-ash text-sm">
              Your connections are private and secure.
            </div>
          </div>
        </BurningPaperCard>
      </div>
    </div>
  );
};