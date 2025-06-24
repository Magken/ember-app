import React from 'react';
import { EmberButton } from '../ui/Button';
import { IconedButton } from '../ui/IconedButton';
import { InputBox } from '../ui/InputBox';
import { PasswordInput } from '../ui/PasswordInput';
import { Heading3, TextBlock, SmallText } from '../ui/Typography';
import { Copy, LogOut, Trash2 } from 'lucide-react';

interface ValidationMessage {
  type: 'success' | 'error';
  message: string;
}

interface ProfileSettingsProps {
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
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
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
  onDeleteAccount
}) => {
  return (
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
            <EmberButton size="sm" onClick={onPasswordChange}>
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