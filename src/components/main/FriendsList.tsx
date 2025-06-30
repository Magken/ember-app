import React from 'react';
import { BurningPaperCard } from '../ui/Card';
import { IconedButton } from '../ui/IconedButton';
import { Heading3, SmallText, TinyText } from '../ui/Typography';
import { MessageCircle, Users } from 'lucide-react';
import { formatTimeAgo } from '../../lib/friends';
import type { Friend } from '../../lib/friends';

interface FriendsListProps {
  friends: Friend[];
  unreadCounts: { [userId: string]: number };
  onChatWithFriend: (friendId: string, friendName: string) => void;
}

/**
 * Friends list component
 */
export const FriendsList: React.FC<FriendsListProps> = ({
  friends,
  unreadCounts,
  onChatWithFriend
}) => {
  if (friends.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-ash mx-auto mb-4" />
        <Heading3 className="mb-2">No friends yet</Heading3>
        <SmallText className="text-ash">
          Add friends using their unique codes to start building connections
        </SmallText>
      </div>
    );
  }

  return (
    <div>
      <Heading3 className="mb-4">
        Friends ({friends.length})
      </Heading3>
      <div className="space-y-4">
        {friends.map((friend) => (
          <BurningPaperCard key={friend.friend_id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-ember to-carmine rounded-full flex items-center justify-center text-dark font-bold">
                  {friend.friend_nickname.charAt(0)}
                </div>
                <div>
                  <SmallText className="font-medium text-softwhite">
                    {friend.friend_nickname}
                  </SmallText>
                  <TinyText className="text-ash">
                    {friend.friend_unique_code}
                  </TinyText>
                  <TinyText className="text-ash">
                    Friends since {formatTimeAgo(friend.friendship_created_at)}
                  </TinyText>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Unread indicator */}
                {(unreadCounts[friend.friend_id] || 0) > 0 && (
                  <div className="w-6 h-6 bg-carmine text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCounts[friend.friend_id] > 9 ? '9+' : unreadCounts[friend.friend_id]}
                  </div>
                )}
                
                {/* Connection strength indicator */}
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: friend.connection_strength < 0.3 
                        ? '#960018' // carmine for weak
                        : friend.connection_strength < 0.7 
                          ? '#FFBF00' // ember for medium
                          : '#00FF00' // green for strong
                    }}
                  />
                  <TinyText className="text-ash">
                    {friend.connection_strength < 0.3 ? 'Weak' : 
                     friend.connection_strength < 0.7 ? 'Medium' : 'Strong'}
                  </TinyText>
                </div>
                
                <IconedButton
                  icon={<MessageCircle className="w-4 h-4" />}
                  label="Chat"
                  size="sm"
                  onClick={() => onChatWithFriend(friend.friend_id, friend.friend_nickname)}
                />
              </div>
            </div>
          </BurningPaperCard>
        ))}
      </div>
    </div>
  );
};