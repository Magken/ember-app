import React, { useState, useEffect } from 'react';
import { EmberButton } from '../ui/Button';
import { InputBox } from '../ui/InputBox';
import { PasswordInput } from '../ui/PasswordInput';
import { Heading3, SmallText } from '../ui/Typography';
import { ValidationMessage } from './ValidationMessage';
import { AlertCircle, CheckCircle, RefreshCw, Trash2 } from 'lucide-react';
import { changePassword, updateProfile, deleteAccount, validatePasswordStrength } from '../../lib/auth';
import { useAuth } from '../auth/AuthProvider';
import type { UserProfile } from '../../lib/supabase';

interface ProfileTabProps {
  profile: UserProfile;
}

/**
 * Profile management tab component
 */
export const ProfileTab: React.FC<ProfileTabProps> = ({ profile }) => {
  const { refreshProfile } = useAuth();
  
  // Profile form state
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  
  // Account deletion state
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  // Real-time password validation
  useEffect(() => {
    if (newPassword) {
      const validation = validatePasswordStrength(newPassword);
      setPasswordErrors(validation.errors);
    } else {
      setPasswordErrors([]);
    }
    
    if (confirmPassword && newPassword) {
      setPasswordsMatch(newPassword === confirmPassword);
    } else {
      setPasswordsMatch(null);
    }
  }, [newPassword, confirmPassword]);

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!nickname.trim() || nickname.length < 2 || nickname.length > 50) {
      setProfileError('Nickname must be between 2 and 50 characters');
      return;
    }

    if (bio.length > 500) {
      setProfileError('Bio must be 500 characters or less');
      return;
    }

    try {
      setUpdatingProfile(true);
      setProfileError(null);
      setProfileSuccess(null);

      const { error } = await updateProfile({
        nickname: nickname.trim(),
        bio: bio.trim() || undefined
      });

      if (error) {
        throw error;
      }

      setProfileSuccess('Profile updated successfully!');
      await refreshProfile();

    } catch (error: any) {
      console.error('Error updating profile:', error);
      setProfileError(error.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }

    if (passwordErrors.length > 0) {
      setPasswordError('Please fix password requirements');
      return;
    }

    if (!passwordsMatch) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordError(null);
      setPasswordSuccess(null);

      const { error } = await changePassword(currentPassword, newPassword);

      if (error) {
        throw error;
      }

      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error: any) {
      console.error('Error changing password:', error);
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    if (!confirm('This will permanently delete all your data, including messages and friendships. Are you absolutely sure?')) {
      return;
    }

    try {
      setDeletingAccount(true);

      const { error } = await deleteAccount();

      if (error) {
        throw error;
      }

    } catch (error: any) {
      console.error('Error deleting account:', error);
      alert(error.message || 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

  // Clear success messages after delay
  useEffect(() => {
    if (profileSuccess) {
      const timer = setTimeout(() => setProfileSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [profileSuccess]);

  useEffect(() => {
    if (passwordSuccess) {
      const timer = setTimeout(() => setPasswordSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [passwordSuccess]);

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Profile Information */}
      <div>
        <Heading3 className="mb-4">Profile Information</Heading3>
        
        <ValidationMessage error={profileError} success={profileSuccess} />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-softwhite mb-2">
              Unique Code (Read-only)
            </label>
            <InputBox
              value={profile.unique_code}
              onChange={() => {}}
              className="bg-navy/50 cursor-not-allowed opacity-75"
            />
            <SmallText className="text-ash mt-1">
              Share this code with friends so they can add you
            </SmallText>
          </div>

          <div>
            <label className="block text-sm font-medium text-softwhite mb-2">
              Nickname *
            </label>
            <InputBox
              value={nickname}
              onChange={setNickname}
              placeholder="Your display name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-softwhite mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-2 bg-navy text-softwhite placeholder:text-ash border border-ember rounded-soft transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ember hover:shadow-ember resize-none"
            />
            <SmallText className="text-ash mt-1">
              {bio.length}/500 characters
            </SmallText>
          </div>

          <EmberButton
            onClick={handleUpdateProfile}
            disabled={updatingProfile}
          >
            {updatingProfile ? 'Updating...' : 'Update Profile'}
          </EmberButton>
        </div>
      </div>

      {/* Change Password */}
      <div>
        <Heading3 className="mb-4">Change Password</Heading3>
        
        <ValidationMessage error={passwordError} success={passwordSuccess} />

        <div className="space-y-4">
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
            {passwordErrors.length > 0 && (
              <div className="mt-2 space-y-1">
                {passwordErrors.map((error, index) => (
                  <SmallText key={index} className="text-carmine flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {error}
                  </SmallText>
                ))}
              </div>
            )}
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
            {passwordsMatch === false && (
              <SmallText className="text-carmine mt-1 flex items-center gap-2">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                Passwords do not match
              </SmallText>
            )}
          </div>

          <EmberButton
            onClick={handleChangePassword}
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword || passwordErrors.length > 0 || !passwordsMatch}
          >
            {changingPassword ? 'Changing...' : 'Change Password'}
          </EmberButton>
        </div>
      </div>

      {/* Danger Zone */}
      <div>
        <Heading3 className="mb-4 text-carmine">Danger Zone</Heading3>
        <div className="p-4 border border-carmine/50 rounded-soft bg-carmine/10">
          <div className="space-y-4">
            <div>
              <SmallText className="font-medium text-carmine">Delete Account</SmallText>
              <SmallText className="text-ash">
                Permanently delete your account and all associated data. This action cannot be undone.
              </SmallText>
            </div>
            <EmberButton
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="bg-carmine hover:bg-carmine/80"
            >
              {deletingAccount ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </>
              )}
            </EmberButton>
          </div>
        </div>
      </div>
    </div>
  );
};