import React from 'react';
import { EmberButton } from '../ui/Button';
import { LiveChatBox } from '../ui/LiveChatBox';
import { Heading2 } from '../ui/Typography';
import type { Friend } from '../../lib/friends';

interface ChatDisplayProps {
  selectedChatUser: { id: string; name: string };
  friends: Friend[];
  onClose: () => void;
}

/**
 * Chat display component for showing active conversation
 */
export const ChatDisplay: React.FC<ChatDisplayProps> = ({
  selectedChatUser,
  friends,
  onClose
}) => {
  const connectionStrength = friends.find(f => f.friend_id === selectedChatUser.id)?.connection_strength || 0.5;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 flex items-center gap-4">
        <EmberButton
          variant="ghost"
          onClick={onClose}
        >
          ← Back to Hearth
        </EmberButton>
        <Heading2>Chat with {selectedChatUser.name}</Heading2>
      </div>
      
      <LiveChatBox
        contactUserId={selectedChatUser.id}
        contactName={selectedChatUser.name}
        connectionStrength={connectionStrength}
        onClose={onClose}
        height={600}
      />
    </div>
  );
};