import React from 'react';
import { AddFriendSection } from './AddFriendSection';
import { FriendRequestsList } from './FriendRequestsList';
import { FriendsList } from './FriendsList';
import type { Friend, FriendRequest } from '../../lib/friends';

interface FriendsTabProps {
  friends: Friend[];
  friendRequests: FriendRequest[];
  unreadCounts: { [userId: string]: number };
  onChatWithFriend: (friendId: string, friendName: string) => void;
  onRefreshData: () => void;
}

/**
 * Friends management tab component
 */
export const FriendsTab: React.FC<FriendsTabProps> = ({
  friends,
  friendRequests,
  unreadCounts,
  onChatWithFriend,
  onRefreshData
}) => {
  return (
    <div className="space-y-8">
      <AddFriendSection onRefreshData={onRefreshData} />
      <FriendRequestsList 
        friendRequests={friendRequests} 
        onRefreshData={onRefreshData} 
      />
      <FriendsList 
        friends={friends} 
        unreadCounts={unreadCounts}
        onChatWithFriend={onChatWithFriend}
      />
    </div>
  );
};