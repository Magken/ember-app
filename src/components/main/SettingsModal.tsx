import React from 'react';
import { BurningPaperCard } from '../ui/Card';
import { IconedButton } from '../ui/IconedButton';
import { Heading2 } from '../ui/Typography';
import { TabNavigation } from './TabNavigation';
import { ProfileTab } from './ProfileTab';
import { FriendsTab } from './FriendsTab';
import { X, User, Users } from 'lucide-react';
import type { UserProfile } from '../../lib/supabase';
import type { Friend, FriendRequest } from '../../lib/friends';

interface SettingsModalProps {
  isOpen: boolean;
  activeTab: 'profile' | 'friends';
  profile: UserProfile;
  friends: Friend[];
  friendRequests: FriendRequest[];
  unreadCounts: { [userId: string]: number };
  onClose: () => void;
  onTabChange: (tab: 'profile' | 'friends') => void;
  onChatWithFriend: (friendId: string, friendName: string) => void;
  onRefreshData: () => void;
}

/**
 * Main settings modal containing profile and friends management
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  activeTab,
  profile,
  friends,
  friendRequests,
  unreadCounts,
  onClose,
  onTabChange,
  onChatWithFriend,
  onRefreshData
}) => {
  if (!isOpen) return null;

  const incomingRequests = friendRequests.filter(req => req.request_type === 'incoming' && req.status === 'pending');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <BurningPaperCard glowOnHover>
          <div className="flex flex-col h-full max-h-[80vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-ember/20">
              <Heading2>Settings</Heading2>
              <IconedButton
                icon={<X className="w-5 h-5" />}
                label="Close"
                variant="ghost"
                onClick={onClose}
              />
            </div>

            {/* Tab Navigation */}
            <TabNavigation
              activeTab={activeTab}
              onTabChange={onTabChange}
              incomingRequestsCount={incomingRequests.length}
            />

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'profile' ? (
                <ProfileTab profile={profile} />
              ) : (
                <FriendsTab
                  friends={friends}
                  friendRequests={friendRequests}
                  unreadCounts={unreadCounts}
                  onChatWithFriend={onChatWithFriend}
                  onRefreshData={onRefreshData}
                />
              )}
            </div>
          </div>
        </BurningPaperCard>
      </div>
    </div>
  );
};