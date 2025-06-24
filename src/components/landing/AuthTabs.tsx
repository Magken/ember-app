import React from 'react';

const EMBER_COLORS = [
  '255,191,0',   // ember yellow
  '255,140,0',   // orange
  '150,0,24',    // carmine
  '153,101,21',  // amber
  '255,69,0',    // red-orange
];

const rand = (a: number, b: number) => Math.random() * (b - a) + a;
const randColor = (colors: string[]) =>
  colors[Math.floor(Math.random() * colors.length)];

interface AuthTabsProps {
  activeTab: 'signup' | 'login';
  onTabChange: (tab: 'signup' | 'login') => void;
}

export const AuthTabs: React.FC<AuthTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  const generateEmberParticles = (isActive: boolean) => {
    if (!isActive) return null;
    
    return Array.from({ length: 15 }).map((_, i) => (
      <span
        key={`ember-${i}`}
        className="absolute rounded-full pointer-events-none z-10 animate-ember"
        style={{
          width: `${rand(1, 2)}px`,
          height: `${rand(1, 2)}px`,
          backgroundColor: `rgb(${randColor(EMBER_COLORS)})`,
          left: `${rand(10, 90)}%`,
          top: `${rand(10, 90)}%`,
          filter: 'blur(0.5px) brightness(2)',
          animationDelay: `${rand(0, 2)}s`,
          animationDuration: `${rand(2, 4)}s`,
          boxShadow: '0 0 3px currentColor',
          mixBlendMode: 'screen'
        } as React.CSSProperties}
      />
    ));
  };

  return (
    <div className="flex mb-8 -mx-4 -mt-4 relative">
      <button
        onClick={() => onTabChange('signup')}
        className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-300 relative overflow-visible ${
          activeTab === 'signup'
            ? 'text-ember border-b-2 border-ember'
            : 'text-ash hover:text-softwhite'
        }`}
      >
        {generateEmberParticles(activeTab === 'signup')}
        Join Embr
      </button>
      <button
        onClick={() => onTabChange('login')}
        className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-300 relative overflow-visible ${
          activeTab === 'login'
            ? 'text-ember border-b-2 border-ember'
            : 'text-ash hover:text-softwhite'
        }`}
      >
        {generateEmberParticles(activeTab === 'login')}
        Welcome back
      </button>
    </div>
  );
};