import React from 'react';
import { UserPlus } from 'lucide-react';
import { IconedButton } from '../ui/IconedButton';
import { Hearth } from '../ui/Hearth';

interface FlameData {
  id: string;
  x: number;
  y: number;
  strength: number;
  size?: number;
  name?: string;
  hasUnreadMessages?: boolean;
  unreadCount?: number;
}

interface HearthDisplayProps {
  userConnections: FlameData[];
  hearthDimensions: { width: number; height: number };
  onFlameClick: (flameId: string) => void;
  onRefresh: () => void;
  onAddFriends: () => void;
  showUnreadIndicators: boolean;
}

export const HearthDisplay: React.FC<HearthDisplayProps> = ({
  userConnections,
  hearthDimensions,
  onFlameClick,
  onRefresh,
  onAddFriends,
  showUnreadIndicators
}) => {
  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 overflow-auto bg-black">
      <div className="w-full h-full relative">
        {/* Empty Hearth State - Simplified */}
        {userConnections.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <IconedButton
              icon={<UserPlus className="w-6 h-6" />}
              label="Add Friends"
              size="lg"
              onClick={onAddFriends}
            />
          </div>
        )}

        {/* Responsive Hearth Component with scrolling support */}
        <div 
          className="w-full h-full overflow-auto scrollbar-hide"
          style={{
            minWidth: `${hearthDimensions.width}px`,
            minHeight: `${hearthDimensions.height}px`
          }}
        >
          <Hearth
            flames={userConnections}
            width={hearthDimensions.width}
            height={hearthDimensions.height}
            onFlameClick={onFlameClick}
            onRefresh={onRefresh}
            className="w-full h-full"
            showUnreadIndicators={showUnreadIndicators}
          />
        </div>
      </div>
    </div>
  );
};