import React from 'react';
import { Flame } from './ui/Flame';
import { IconedButton } from './ui/IconedButton';
import { SmallText } from './ui/Typography';
import { Settings } from 'lucide-react';

interface MainPageHeaderProps {
  userNickname: string;
  onSettingsClick: () => void;
}

export const MainPageHeader: React.FC<MainPageHeaderProps> = ({
  userNickname,
  onSettingsClick
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - empty for balance */}
        <div className="w-12"></div>
        
        {/* Center - User's Hearth Title and Flame */}
        <div className="flex items-center gap-3">
          <Flame strength={0.8} size={32} animated={true} interactive={true} />
          <SmallText className="bg-gradient-to-r from-ember via-carmine to-ember bg-clip-text text-transparent font-medium text-lg whitespace-nowrap">
            {userNickname}'s Hearth
          </SmallText>
        </div>
        
        {/* Right side - Settings Button */}
        <div className="flex justify-end">
          <IconedButton
            icon={<Settings className="w-5 h-5" />}
            label="Settings"
            size="md"
            onClick={onSettingsClick}
          />
        </div>
      </div>
    </header>
  );
}; 