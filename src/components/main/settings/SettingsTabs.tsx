import React from 'react';
import { User, UserPlus } from 'lucide-react';

interface SettingsTabsProps {
  activeTab: 'profile' | 'friends';
  onTabChange: (tab: 'profile' | 'friends') => void;
}

export const SettingsTabs: React.FC<SettingsTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  const generateEmberParticles = (isActive: boolean) => {
    if (!isActive) return null;
    
    return Array.from({ length: 12 }).map((_, i) => (
      <span
        key={`ember-${i}`}
        className="absolute rounded-full pointer-events-none z-10 animate-ember"
        style={{
          width: `${1 + Math.random()}px`,
          height: `${1 + Math.random()}px`,
          backgroundColor: `rgb(255,191,0)`,
          left: `${10 + Math.random() * 80}%`,
          top: `${10 + Math.random() * 80}%`,
          filter: 'blur(0.5px) brightness(2)',
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: `${2 + Math.random() * 2}s`,
          boxShadow: '0 0 3px currentColor',
          mixBlendMode: 'screen'
        } as React.CSSProperties}
      />
    ));
  };

  return (
    <div className="flex mb-4 relative">
      <button
        onClick={() => onTabChange('profile')}
        className={`flex-1 px-4 py-3 text-center font-medium transition-all duration-300 relative overflow-visible ${
          activeTab === 'profile'
            ? 'text-ember border-b-2 border-ember'
            : 'text-ash hover:text-softwhite'
        }`}
      >
        {generateEmberParticles(activeTab === 'profile')}
        <User className="w-4 h-4 inline mr-2" />
        Profile
      </button>
      <button
        onClick={() => onTabChange('friends')}
        className={`flex-1 px-4 py-3 text-center font-medium transition-all duration-300 relative overflow-visible ${
          activeTab === 'friends'
            ? 'text-ember border-b-2 border-ember'
            : 'text-ash hover:text-softwhite'
        }`}
      >
        {generateEmberParticles(activeTab === 'friends')}
        <UserPlus className="w-4 h-4 inline mr-2" />
        Friends
      </button>
    </div>
  );
};