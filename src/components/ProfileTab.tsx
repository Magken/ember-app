import React from 'react';
import { InputBox } from './ui/InputBox';
import { PasswordInput } from './ui/PasswordInput';
import { EmberButton } from './ui/Button';
import { IconedButton } from './ui/IconedButton';
import { Heading3, TextBlock, SmallText } from './ui/Typography';
import { Copy, Trash2 } from 'lucide-react';
import { ValidationMessage } from './ValidationMessage';

interface ProfileTabProps {
  nickname: string;
  onNicknameChange: (value: string) => void;
  currentPassword: string;
  onCurrentPasswordChange: (value: string) => void;
  newPassword: string;
  onNewPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  profileMessage: { type: 'success' | 'error'; message: string } | null;
  uniqueCode: string;
  onSaveProfile: () => void;
  onChangePassword: () => void;
  onCopyUniqueCode: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
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
  onDeleteAccount
}) => {
  return (
    <div className="space-y-6 pb-4">
      {/* Profile Validation Message */}
      <ValidationMessage message={profileMessage} />

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
              onChange={onNicknameChange}
              placeholder="Your display name"
            />
          </div>
          
          <div className="pt-2">
            <EmberButton size="sm" onClick={onSaveProfile}>
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
              {uniqueCode || 'Loading...'}
            </code>
            <IconedButton
              icon={<Copy className="w-4 h-4" />}
              label="Copy Code"
              size="sm"
              variant="ghost"
              onClick={onCopyUniqueCode}
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
              onChange={onCurrentPasswordChange}
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-softwhite mb-2">
              New Password
            </label>
            <PasswordInput
              value={newPassword}
              onChange={onNewPasswordChange}
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-softwhite mb-2">
              Confirm New Password
            </label>
            <PasswordInput
              value={confirmPassword}
              onChange={onConfirmPasswordChange}
              placeholder="Confirm new password"
            />
          </div>

          <div className="pt-2">
            <EmberButton size="sm" onClick={onChangePassword}>
              Change Password
            </EmberButton>
          </div>
        </div>

        {/* Account Actions Section */}
        <div className="space-y-4 pt-6 border-t border-ember/30">
          <Heading3 className="text-lg">Account Actions</Heading3>
          
          <div className="space-y-3">
            <button
              onClick={onLogout}
              className="w-full px-4 py-2 text-sm bg-navy/40 text-softwhite border border-ember/30 rounded-soft hover:bg-navy/60 hover:border-ember/50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Log Out
            </button>
            
            <button
              onClick={onDeleteAccount}
              className="w-full px-4 py-2 text-sm bg-carmine/20 text-carmine border border-carmine/50 rounded-soft hover:bg-carmine/30 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 