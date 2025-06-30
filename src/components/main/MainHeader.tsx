import React from 'react';
import { Heading1, SmallText, TinyText } from '../ui/Typography';
import { IconedButton } from '../ui/IconedButton';
import { Settings, MessageCircle, LogOut } from 'lucide-react';
import type { UserProfile } from '../../lib/supabase';

interface MainHeaderProps {
  profile: UserProfile;
  totalUnreadCount: number;
  onSettingsClick: () => void;
  onSignOut: () => void;
}

/**
 * Header component for the main page containing logo, user info, and action buttons
 */
export const MainHeader: React.FC<MainHeaderProps> = ({
  profile,
  totalUnreadCount,
  onSettingsClick,
  onSignOut
}) => {
  return (
    <header className="border-b border-ember/20 bg-navy/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and User Info */}
          <div className="flex items-center gap-4">
            <Heading1 className="text-2xl bg-gradient-to-r from-ember to-carmine bg-clip-text text-transparent">
              embr
            </Heading1>
            <div className="hidden sm:block">
              <SmallText className="text-ash">Welcome back, {profile.nickname}</SmallText>
              <TinyText className="text-ash/60">{profile.unique_code}</TinyText>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {/* Messages indicator */}
            {totalUnreadCount > 0 && (
              <div className="relative">
                <IconedButton
                  icon={<MessageCircle className="w-5 h-5" />}
                  label="Messages"
                  onClick={onSettingsClick}
                />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-carmine text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                </div>
              </div>
            )}

            {/* Settings */}
            <IconedButton
              icon={<Settings className="w-5 h-5" />}
              label="Settings"
              onClick={onSettingsClick}
            />

            {/* Sign Out */}
            <IconedButton
              icon={<LogOut className="w-5 h-5" />}
              label="Sign Out"
              variant="ghost"
              onClick={onSignOut}
            />
          </div>
        </div>
      </div>
    </header>
  );
};