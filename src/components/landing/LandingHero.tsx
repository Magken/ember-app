import React, { useState, useMemo } from 'react';
import { Heading1, Heading2, TextBlock } from '../ui/Typography';
import { EmberButton } from '../ui/Button';

const EMBER_COLORS = [
  '255,191,0',   // ember yellow
  '255,140,0',   // orange
  '150,0,24',    // carmine
  '153,101,21',  // amber
  '255,69,0',    // red-orange
];

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const rand = (a: number, b: number) => Math.random() * (b - a) + a;
const randColor = (colors: string[]) =>
  colors[randInt(0, colors.length - 1)];

// Generate unique burning clip-path for each letter
const generateLetterClipPath = (seed: number) => {
  // Use seed for consistent randomness per letter
  const seededRand = (min: number, max: number) => {
    const x = Math.sin(seed) * 10000;
    const random = x - Math.floor(x);
    return min + random * (max - min);
  };

  const maxXCut = 3;
  const maxYCut = 8;
  
  const corners = [
    { x: seededRand(-maxXCut, maxXCut), y: seededRand(-maxYCut, maxYCut) },
    { x: seededRand(100 - maxXCut, 100 + maxXCut), y: seededRand(-maxYCut, maxYCut) },
    { x: seededRand(100 - maxXCut, 100 + maxXCut), y: seededRand(100 - maxYCut, 100 + maxYCut) },
    { x: seededRand(-maxXCut, maxXCut), y: seededRand(100 - maxYCut, 100 + maxYCut) }
  ];
  
  const mids = [
    { x: seededRand(20, 80), y: seededRand(-maxYCut - 2, 4) },
    { x: seededRand(100 - maxXCut, 100 + maxXCut), y: seededRand(20, 80) },
    { x: seededRand(20, 80), y: seededRand(96, 100 + maxYCut + 2) },
    { x: seededRand(-maxXCut, maxXCut), y: seededRand(20, 80) }
  ];
  
  const extras = [
    { x: seededRand(15, 35), y: seededRand(-6, 2) },
    { x: seededRand(65, 85), y: seededRand(-6, 2) },
    { x: seededRand(100 - maxXCut, 100 + maxXCut), y: seededRand(15, 35) },
    { x: seededRand(100 - maxXCut, 100 + maxXCut), y: seededRand(65, 85) },
    { x: seededRand(65, 85), y: seededRand(97, 106) },
    { x: seededRand(15, 35), y: seededRand(97, 106) },
    { x: seededRand(-maxXCut, maxXCut), y: seededRand(65, 85) },
    { x: seededRand(-maxXCut, maxXCut), y: seededRand(15, 35) }
  ];
  
  const pts = [
    corners[0], extras[0], mids[0], extras[1],
    corners[1], extras[2], mids[1], extras[3],
    corners[2], extras[4], mids[2], extras[5],
    corners[3], extras[6], mids[3], extras[7]
  ];
  
  return `polygon(${pts.map(p => `${p.x}% ${p.y}%`).join(', ')})`;
};

interface LandingHeroProps {
  onScrollToAuth: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onScrollToAuth }) => {
  const [hoveredLetter, setHoveredLetter] = useState<string | null>(null);

  // Generate clip paths for each letter
  const letterClipPaths = React.useMemo(() => ({
    e: generateLetterClipPath(1),
    m: generateLetterClipPath(2),
    b: generateLetterClipPath(3),
    r: generateLetterClipPath(4)
  }), []);

  // Generate massive ember particle system
  const massiveEmberParticles = React.useMemo(() => {
    return Array.from({ length: 120 }).map((_, i) => ({
      left: `${rand(-10, 110)}%`,
      top: `${rand(-10, 110)}%`,
      delay: `${rand(0, 6)}s`,
      duration: `${rand(2, 5)}s`,
      size: `${rand(0.5, 3)}px`,
      color: randColor(EMBER_COLORS),
      intensity: rand(0.6, 1.2),
      drift: {
        x: `${rand(-20, 20)}px`,
        y: `${rand(-30, -10)}px`
      }
    }));
  }, []);

  // Generate flickering flame elements
  const flickeringFlames = React.useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      left: `${rand(5, 95)}%`,
      top: `${rand(5, 95)}%`,
      delay: `${rand(0, 3)}s`,
      duration: `${rand(0.4, 0.8)}s`,
      width: `${rand(2, 5)}px`,
      height: `${rand(6, 12)}px`,
      color: randColor(EMBER_COLORS.slice(0, 3)), // Only warm colors for flames
      intensity: rand(0.8, 1.5)
    }));
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-8 py-16">
      {/* Enhanced animated background embers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-ember rounded-full animate-ember opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
        {/* Individual Letter Burning Aesthetic Logo - 20% Larger */}
        <div className="mb-12 relative overflow-visible">
          <div className="inline-flex items-center justify-center gap-3 relative overflow-visible">
            
            {/* Massive ember particle system around entire logo */}
            {massiveEmberParticles.map((ember, i) => (
              <span
                key={`massive-ember-${i}`}
                className="absolute rounded-full pointer-events-none z-20 animate-ember"
                style={{
                  width: ember.size,
                  height: ember.size,
                  backgroundColor: `rgb(${ember.color})`,
                  left: ember.left,
                  top: ember.top,
                  filter: `blur(0.5px) brightness(${ember.intensity})`,
                  animationDelay: ember.delay,
                  animationDuration: ember.duration,
                  boxShadow: `0 0 4px rgb(${ember.color})`,
                  mixBlendMode: 'screen',
                  '--tx': ember.drift.x,
                  '--ty': ember.drift.y
                } as React.CSSProperties}
              />
            ))}

            {/* Flickering flame elements */}
            {flickeringFlames.map((flame, i) => (
              <div
                key={`flame-${i}`}
                className="absolute pointer-events-none z-15 flame-flicker"
                style={{
                  width: flame.width,
                  height: flame.height,
                  left: flame.left,
                  top: flame.top,
                  background: `linear-gradient(to top, rgb(${flame.color}), rgba(${flame.color}, 0.7), transparent)`,
                  borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                  animationDelay: flame.delay,
                  animationDuration: flame.duration,
                  filter: `blur(0.5px) brightness(${flame.intensity})`,
                  mixBlendMode: 'screen'
                } as React.CSSProperties}
              />
            ))}

            {/* Individual Letters with Burning Aesthetic - 20% Larger */}
            {['e', 'm', 'b', 'r'].map((letter, index) => (
              <div 
                key={letter} 
                className="relative inline-block overflow-visible cursor-pointer transition-all duration-500 ease-out"
                onMouseEnter={() => setHoveredLetter(letter)}
                onMouseLeave={() => setHoveredLetter(null)}
                style={{
                  transform: hoveredLetter === letter 
                    ? 'scale(1.3) rotate(8deg) translateY(-10px)' 
                    : 'scale(1)',
                  zIndex: hoveredLetter === letter ? 100 : 10,
                }}
              >
                {/* Charred background for each letter */}
                <div
                  className="absolute inset-0 pointer-events-none z-0"
                  style={{
                    clipPath: letterClipPaths[letter as keyof typeof letterClipPaths],
                    WebkitClipPath: letterClipPaths[letter as keyof typeof letterClipPaths],
                    background: `
                      linear-gradient(${45 + index * 30}deg, 
                        rgba(44, 24, 16, 0.9) 0%,
                        rgba(139, 69, 19, 0.8) 25%,
                        rgba(101, 67, 33, 0.7) 50%,
                        rgba(160, 82, 45, 0.6) 75%,
                        rgba(210, 180, 140, 0.4) 100%
                      ),
                      radial-gradient(circle at ${30 + index * 20}% ${70 - index * 15}%, rgba(255, 140, 0, 0.3), transparent 60%),
                      radial-gradient(circle at ${70 - index * 15}% ${30 + index * 20}%, rgba(255, 69, 0, 0.2), transparent 50%)
                    `,
                    filter: 'blur(6px)',
                    transform: `scale(1.15) rotate(${index * 2 - 3}deg)`,
                    mixBlendMode: 'multiply'
                  }}
                />

                {/* Individual ember glow behind each letter */}
                <div
                  className="absolute inset-0 pointer-events-none z-1 transition-all duration-500"
                  style={{
                    clipPath: letterClipPaths[letter as keyof typeof letterClipPaths],
                    WebkitClipPath: letterClipPaths[letter as keyof typeof letterClipPaths],
                    background: `radial-gradient(closest-side, rgba(255,140,0,${hoveredLetter === letter ? 0.8 : 0.4 + index * 0.1}), rgba(255,69,0,${hoveredLetter === letter ? 0.6 : 0.3 + index * 0.05}) 40%, transparent 70%)`,
                    filter: `blur(${hoveredLetter === letter ? 20 : 12}px)`,
                    transform: `scale(${hoveredLetter === letter ? 1.8 : 1.3}) rotate(${-index * 1.5 + 2}deg)`,
                    mixBlendMode: 'screen'
                  }}
                />

                {/* Main letter with original gradient coloration - 20% Larger */}
                <span 
                  className="relative z-10 text-7xl md:text-9xl font-bold font-[var(--font-display)] inline-block px-3 transition-all duration-500"
                  style={{
                    clipPath: letterClipPaths[letter as keyof typeof letterClipPaths],
                    WebkitClipPath: letterClipPaths[letter as keyof typeof letterClipPaths],
                    background: 'linear-gradient(135deg, rgba(31, 59, 115, 1) 0%, rgba(150, 0, 24, 0.9) 50%, rgba(255, 191, 0, 0.8) 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: `drop-shadow(0 0 ${hoveredLetter === letter ? 25 : 12 + index * 3}px rgba(255, 140, 0, ${hoveredLetter === letter ? 1 : 0.8}))`,
                    textShadow: `0 0 ${hoveredLetter === letter ? 40 : 25 + index * 8}px rgba(255, 191, 0, ${hoveredLetter === letter ? 0.9 : 0.6})`,
                    transform: `rotate(${index * 1.5 - 2.25}deg)`,
                  }}
                >
                  {letter}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Headlines */}
        <div className="space-y-6">
          <Heading1 className="text-2xl md:text-3xl bg-gradient-to-r from-ember via-carmine to-deepblue bg-clip-text text-transparent leading-tight">
            Keep the ember alive.
          </Heading1>
          
          <Heading2 className="text-2xl md:text-3xl text-softwhite/90 font-medium max-w-3xl mx-auto">
            Where connection glows, and conversation fuels the flame.
          </Heading2>
        </div>

        {/* Intro Paragraph */}
        <div className="max-w-2xl mx-auto">
          <TextBlock className="text-lg md:text-xl text-ash leading-relaxed">
            Embr is your minimalist canvas for connection. Here, each ember represents someone you care about—bright when you're in touch, dim when you haven't checked in. No endless threads. No noise. Just moments that matter, burning bright.
          </TextBlock>
        </div>

        {/* Start a spark button */}
        <div className="pt-8">
          <EmberButton size="lg" onClick={onScrollToAuth}>
            Start a spark
          </EmberButton>
        </div>
      </div>
    </section>
  );
};