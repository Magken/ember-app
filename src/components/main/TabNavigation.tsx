import React from 'react';
import { User, Users } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'profile' | 'friends';
  onTabChange: (tab: 'profile' | 'friends') => void;
  incomingRequestsCount: number;
}

/**
 * Tab navigation component for the settings modal
 */
export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  incomingRequestsCount
}) => {
  return (
    <div className="flex border-b border-ember/20">
      <button
        onClick={() => onTabChange('profile')}
        className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
          activeTab === 'profile'
            ? 'text-ember border-b-2 border-ember bg-ember/10'
            : 'text-ash hover:text-softwhite'
        }`}
      >
        <User className="w-5 h-5 mx-auto mb-1" />
        Profile
      </button>
      <button
        onClick={() => onTabChange('friends')}
        className={`flex-1 px-6 py-4 text-center font-medium transition-colors relative ${
          activeTab === 'friends'
            ? 'text-ember border-b-2 border-ember bg-ember/10'
            : 'text-ash hover:text-softwhite'
        }`}
      >
        <Users className="w-5 h-5 mx-auto mb-1" />
        Friends
        {incomingRequestsCount > 0 && (
          <div className="absolute top-2 right-2 w-3 h-3 bg-carmine rounded-full" />
        )}
      </button>
    </div>
  );
};