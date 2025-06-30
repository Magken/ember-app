import React from 'react';
import { BurningPaperCard } from '../ui/Card';
import { SmallText } from '../ui/Typography';
import type { FlameData } from '../../lib/friends';

interface QuickStatsProps {
  flames: FlameData[];
  totalUnreadCount: number;
}

/**
 * Quick statistics display for the hearth
 */
export const QuickStats: React.FC<QuickStatsProps> = ({
  flames,
  totalUnreadCount
}) => {
  if (flames.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
      <BurningPaperCard className="text-center">
        <div className="space-y-2">
          <div className="text-2xl font-bold text-ember">
            {flames.filter(f => f.strength >= 0.7).length}
          </div>
          <SmallText>Strong Connections</SmallText>
        </div>
      </BurningPaperCard>
      
      <BurningPaperCard className="text-center">
        <div className="space-y-2">
          <div className="text-2xl font-bold text-ember">
            {flames.filter(f => f.strength < 0.3).length}
          </div>
          <SmallText>Need Attention</SmallText>
        </div>
      </BurningPaperCard>
      
      <BurningPaperCard className="text-center">
        <div className="space-y-2">
          <div className="text-2xl font-bold text-ember">
            {totalUnreadCount}
          </div>
          <SmallText>Unread Messages</SmallText>
        </div>
      </BurningPaperCard>
    </div>
  );
};