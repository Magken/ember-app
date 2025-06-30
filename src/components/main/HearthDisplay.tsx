import React from 'react';
import { Heading1, TextBlock } from '../ui/Typography';
import { Hearth } from '../ui/Hearth';
import { BurningPaperCard } from '../ui/Card';
import type { FlameData } from '../../lib/friends';

interface HearthDisplayProps {
  flames: FlameData[];
  onFlameClick: (flameId: string) => void;
  onRefresh: () => void;
}

/**
 * Main hearth display component showing user's connections as flames
 */
export const HearthDisplay: React.FC<HearthDisplayProps> = ({
  flames,
  onFlameClick,
  onRefresh
}) => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <Heading1 className="mb-4">Your Hearth</Heading1>
        <TextBlock className="text-ash max-w-2xl mx-auto">
          {flames.length === 0 
            ? "Your hearth is empty. Add friends to see their flames glow here."
            : `${flames.length} connection${flames.length === 1 ? '' : 's'} burning bright. Click a flame to start a conversation.`
          }
        </TextBlock>
      </div>

      {/* Hearth Display */}
      <div className="flex justify-center">
        <Hearth
          flames={flames}
          width={800}
          height={600}
          onFlameClick={onFlameClick}
          onRefresh={onRefresh}
          showUnreadIndicators={true}
          className="shadow-2xl"
        />
      </div>
    </div>
  );
};