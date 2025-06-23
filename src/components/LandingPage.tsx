import React, { useState, useMemo } from 'react';
import { BurningPaperCard } from './ui/Card';
import { EmberButton } from './ui/Button';
import { InputBox } from './ui/InputBox';
import { PasswordInput } from './ui/PasswordInput';
import { CheckButton } from './ui/CheckButton';
import { IconedButton } from './ui/IconedButton';
import { Heading1, Heading2, Heading3, TextBlock, SmallText } from './ui/Typography';
import { Hearth } from './ui/Hearth';
import { Sparkles, Eye, MessageCircle, Zap, Users } from 'lucide-react';

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
    { x: seededRand(65, 85), y: seededRand(98, 106) },
    { x: seededRand(15, 35), y: seededRand(98, 106) },
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

export const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [hoveredLetter, setHoveredLetter] = useState<string | null>(null);
  
  // Feature card expansion states - separate for each feature
  const [expandedCanvas, setExpandedCanvas] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState(false);
  const [expandedMetrics, setExpandedMetrics] = useState(false);

  // Scroll to auth section
  const scrollToAuth = () => {
    const authSection = document.getElementById('auth-section');
    if (authSection) {
      authSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Generate clip paths for each letter
  const letterClipPaths = useMemo(() => ({
    e: generateLetterClipPath(1),
    m: generateLetterClipPath(2),
    b: generateLetterClipPath(3),
    r: generateLetterClipPath(4)
  }), []);

  // Generate massive ember particle system
  const massiveEmberParticles = useMemo(() => {
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
  const flickeringFlames = useMemo(() => {
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

  // Sample flames for the example hearth - increased spacing
  const exampleFlames = [
    { id: '1', x: 15, y: 25, strength: 0.9, size: 70, name: 'Sarah' },
    { id: '2', x: 50, y: 15, strength: 0.7, size: 60, name: 'Mike' },
    { id: '3', x: 85, y: 35, strength: 0.5, size: 50, name: 'Emma' },
    { id: '4', x: 25, y: 75, strength: 0.2, size: 40, name: 'Alex' },
    { id: '5', x: 75, y: 80, strength: 0.8, size: 65, name: 'David' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)]">
      {/* Hero Section */}
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

                  {/* Massive hover explosion effect */}
                  {hoveredLetter === letter && (
                    <>
                      {/* Primary explosion glow */}
                      <div
                        className="absolute inset-0 pointer-events-none z-2"
                        style={{
                          clipPath: letterClipPaths[letter as keyof typeof letterClipPaths],
                          WebkitClipPath: letterClipPaths[letter as keyof typeof letterClipPaths],
                          background: `radial-gradient(closest-side, rgba(255,191,0,1), rgba(255,140,0,0.8) 30%, rgba(255,69,0,0.6) 60%, transparent 80%)`,
                          filter: 'blur(25px)',
                          transform: 'scale(2.2)',
                          mixBlendMode: 'screen',
                          animation: 'emberPulse 0.3s ease-in-out infinite'
                        }}
                      />
                      
                      {/* Secondary explosion ring */}
                      <div
                        className="absolute inset-0 pointer-events-none z-1"
                        style={{
                          clipPath: letterClipPaths[letter as keyof typeof letterClipPaths],
                          WebkitClipPath: letterClipPaths[letter as keyof typeof letterClipPaths],
                          background: `radial-gradient(closest-side, transparent 20%, rgba(255,191,0,0.4) 40%, rgba(255,140,0,0.3) 70%, transparent 90%)`,
                          filter: 'blur(35px)',
                          transform: 'scale(3)',
                          mixBlendMode: 'screen',
                          animation: 'emberPulse 0.4s ease-in-out infinite reverse'
                        }}
                      />
                    </>
                  )}

                  {/* Individual letter ember particles - Enhanced on hover */}
                  {Array.from({ length: hoveredLetter === letter ? 40 : 15 }).map((_, i) => (
                    <span
                      key={`letter-ember-${letter}-${i}`}
                      className="absolute rounded-full pointer-events-none z-10 animate-ember"
                      style={{
                        width: `${rand(1, hoveredLetter === letter ? 4 : 2.5)}px`,
                        height: `${rand(1, hoveredLetter === letter ? 4 : 2.5)}px`,
                        backgroundColor: `rgb(${randColor(EMBER_COLORS)})`,
                        left: `${rand(-10, 110)}%`,
                        top: `${rand(-10, 110)}%`,
                        filter: `blur(0.5px) brightness(${rand(hoveredLetter === letter ? 3 : 1, hoveredLetter === letter ? 4 : 2)})`,
                        animationDelay: `${rand(0, 4)}s`,
                        animationDuration: `${rand(hoveredLetter === letter ? 0.5 : 2, hoveredLetter === letter ? 1 : 4)}s`,
                        boxShadow: `0 0 ${hoveredLetter === letter ? 8 : 3}px currentColor`,
                        mixBlendMode: 'screen'
                      } as React.CSSProperties}
                    />
                  ))}

                  {/* Individual letter flame licks - Enhanced on hover */}
                  {Array.from({ length: hoveredLetter === letter ? 20 : 8 }).map((_, i) => (
                    <div
                      key={`letter-flame-${letter}-${i}`}
                      className="absolute pointer-events-none z-12 flame-lick"
                      style={{
                        width: `${rand(1.5, hoveredLetter === letter ? 6 : 3)}px`,
                        height: `${rand(4, hoveredLetter === letter ? 18 : 8)}px`,
                        left: `${rand(10, 90)}%`,
                        top: `${rand(5, 95)}%`,
                        background: `linear-gradient(to top, rgb(${randColor(EMBER_COLORS.slice(0, 3))}), rgba(${randColor(EMBER_COLORS.slice(0, 3))}, 0.6), transparent)`,
                        borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                        animationDelay: `${rand(0, 2)}s`,
                        animationDuration: `${rand(0.2, hoveredLetter === letter ? 0.4 : 1)}s`,
                        filter: `blur(0.5px) brightness(${hoveredLetter === letter ? 3 : 1})`,
                        mixBlendMode: 'screen'
                      } as React.CSSProperties}
                    />
                  ))}

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

                  {/* Individual pulsing glow overlay for each letter - Enhanced */}
                  <span 
                    className="absolute inset-0 text-7xl md:text-9xl font-bold font-[var(--font-display)] inline-block px-3 animate-pulse opacity-30 blur-sm pointer-events-none z-5 transition-all duration-500"
                    style={{
                      clipPath: letterClipPaths[letter as keyof typeof letterClipPaths],
                      WebkitClipPath: letterClipPaths[letter as keyof typeof letterClipPaths],
                      color: '#FFBF00',
                      animationDelay: `${index * 0.3}s`,
                      animationDuration: `${hoveredLetter === letter ? 0.2 : 2 + index * 0.2}s`,
                      filter: `brightness(${hoveredLetter === letter ? 4 : 1}) blur(${hoveredLetter === letter ? 3 : 1}px)`
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
            <EmberButton size="lg" onClick={scrollToAuth}>
              Start a spark
            </EmberButton>
          </div>
        </div>
      </section>

      {/* Sign Up / Login Section */}
      <section id="auth-section" className="py-16 px-8 relative">
        <div className="max-w-md mx-auto">
          <BurningPaperCard glowOnHover className="overflow-visible">
            {/* Interactive Tab Navigation with Ember Effects */}
            <div className="flex mb-8 -mx-4 -mt-4 relative">
              <button
                onClick={() => setActiveTab('signup')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-300 relative overflow-visible ${
                  activeTab === 'signup'
                    ? 'text-ember border-b-2 border-ember'
                    : 'text-ash hover:text-softwhite'
                }`}
              >
                {/* Ember particles for active tab */}
                {activeTab === 'signup' && Array.from({ length: 15 }).map((_, i) => (
                  <span
                    key={`signup-ember-${i}`}
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
                ))}
                Join Embr
              </button>
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-300 relative overflow-visible ${
                  activeTab === 'login'
                    ? 'text-ember border-b-2 border-ember'
                    : 'text-ash hover:text-softwhite'
                }`}
              >
                {/* Ember particles for active tab */}
                {activeTab === 'login' && Array.from({ length: 15 }).map((_, i) => (
                  <span
                    key={`login-ember-${i}`}
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
                ))}
                Welcome back
              </button>
            </div>

            {/* Form Content */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-softwhite mb-2">
                  Email or username
                </label>
                <InputBox
                  value={email}
                  onChange={setEmail}
                  placeholder="your@email.com"
                />
              </div>

              {activeTab === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-softwhite mb-2">
                    Nickname
                  </label>
                  <InputBox
                    value={nickname}
                    onChange={setNickname}
                    placeholder="Your display name"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-softwhite mb-2">
                  Password
                </label>
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                />
              </div>

              {activeTab === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-softwhite mb-2">
                    Confirm password
                  </label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="••••••••"
                  />
                </div>
              )}

              {activeTab === 'signup' && (
                <div className="pt-2">
                  <CheckButton
                    checked={agreeToTerms}
                    onChange={setAgreeToTerms}
                    label="I agree to the terms and conditions"
                  />
                </div>
              )}

              <div className="pt-4">
                <EmberButton className="w-full">
                  {activeTab === 'signup' ? 'Join Embr' : 'Welcome back'}
                </EmberButton>
              </div>

              <SmallText className="text-center text-ash">
                No spam. No ads. Your connections are yours alone.
              </SmallText>
            </div>
          </BurningPaperCard>
        </div>
      </section>

      {/* About Embr Section */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Heading2 className="text-4xl md:text-5xl mb-6 bg-gradient-to-r from-ember to-carmine bg-clip-text text-transparent">
              A different kind of inbox
            </Heading2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-6">
              <TextBlock className="text-lg leading-relaxed">
                Embr isn't another feed. It's a hearth where your relationships glow. Every message, photo, or note is kindling—fueling the warmth and brightness of each ember.
              </TextBlock>
              <TextBlock className="text-lg leading-relaxed">
                Bright embers pulse with recent, rich interaction. Fading embers drift apart, reminding you to check in. Here, you don't scroll—you spark. You don't message everyone—you ember the ones that count.
              </TextBlock>
            </div>

            {/* Example Hearth with Live Flames */}
            <div className="relative">
              <BurningPaperCard glowOnHover className="text-center">
                <div className="space-y-4">
                  <Heading3 className="mb-4">Your connections, visualized as living embers</Heading3>
                  <div className="flex justify-center">
                    <Hearth
                      flames={exampleFlames}
                      width={400}
                      height={300}
                      onFlameClick={(flameId) => console.log(`Clicked ${flameId}`)}
                      className="shadow-2xl"
                    />
                  </div>
                  <SmallText className="text-ash">
                    Each flame represents a friend. Bright flames show active connections, 
                    while dim flames need your attention.
                  </SmallText>
                </div>
              </BurningPaperCard>
            </div>
          </div>

          {/* Canvas View Feature - Separate Section */}
          <section className="mb-16">
            <div className="max-w-2xl mx-auto">
              <BurningPaperCard className="text-center">
                <div className="space-y-4">
                  {/* Design System Style Icon Button with correct color */}
                  <div className="w-16 h-16 mx-auto flex items-center justify-center">
                    <IconedButton
                      icon={<Eye className="w-6 h-6 text-softwhite" />}
                      label="Learn more about Canvas View"
                      size="lg"
                      onClick={() => setExpandedCanvas(!expandedCanvas)}
                      className={`transition-all duration-300 ${
                        expandedCanvas ? 'scale-110' : ''
                      }`}
                    />
                  </div>
                  
                  <Heading3>Canvas View</Heading3>
                  
                  {/* Short description - always visible */}
                  <TextBlock className="text-sm">
                    A dark, ambient backdrop dotted with glowing embers, each pulsing to life as connections grow.
                  </TextBlock>
                  
                  {/* Expanded content - conditionally visible */}
                  {expandedCanvas && (
                    <div className="mt-6 pt-6 border-t border-ember/30 text-left">
                      <TextBlock className="text-sm leading-relaxed whitespace-pre-line">
                        {`The Canvas View is your personal constellation of connections. Each ember represents someone important in your life, positioned organically across a dark, starlit backdrop. The brighter the ember, the stronger your connection.

Key Features:
• Interactive zoom and pan to explore your network
• Dynamic positioning based on relationship strength
• Ambient particle effects that respond to activity
• Intuitive visual hierarchy showing connection priorities
• Smooth animations that bring your network to life

The canvas adapts to your interaction patterns, subtly repositioning embers based on recent conversations and shared moments. It's not just a contact list—it's a living map of your relationships.`}
                      </TextBlock>
                      
                      <div className="mt-4 flex justify-center">
                        <button
                          onClick={() => setExpandedCanvas(false)}
                          className="text-xs text-ember hover:text-carmine transition-colors"
                        >
                          Show less
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Show more button when not expanded */}
                  {!expandedCanvas && (
                    <button
                      onClick={() => setExpandedCanvas(true)}
                      className="text-xs text-ember hover:text-carmine transition-colors mt-2"
                    >
                      Learn more
                    </button>
                  )}
                </div>
              </BurningPaperCard>
            </div>
          </section>

          {/* Ephemeral Messages Feature - Separate Section */}
          <section className="mb-16">
            <div className="max-w-2xl mx-auto">
              <BurningPaperCard className="text-center">
                <div className="space-y-4">
                  {/* Design System Style Icon Button */}
                  <div className="w-16 h-16 mx-auto flex items-center justify-center">
                    <IconedButton
                      icon={<MessageCircle className="w-6 h-6 text-softwhite" />}
                      label="Learn more about Ephemeral Messages"
                      size="lg"
                      onClick={() => setExpandedMessages(!expandedMessages)}
                      className={`transition-all duration-300 ${
                        expandedMessages ? 'scale-110' : ''
                      }`}
                    />
                  </div>
                  
                  <Heading3>Ephemeral Messages</Heading3>
                  
                  {/* Short description - always visible */}
                  <TextBlock className="text-sm">
                    Notes and photos that burst into view—and burn out on your terms.
                  </TextBlock>
                  
                  {/* Expanded content - conditionally visible */}
                  {expandedMessages && (
                    <div className="mt-6 pt-6 border-t border-ember/30 text-left">
                      <TextBlock className="text-sm leading-relaxed whitespace-pre-line">
                        {`Ephemeral Messages reimagine how we share moments. Instead of permanent archives, your conversations flow like sparks from a fire—bright, meaningful, and naturally fading.

Message Types:
• Text messages with ember particle effects
• Photos that glow and fade over time
• Voice notes that crackle like fire
• GIFs with flame-like animations
• Disappearing media with customizable timers

Each message adds fuel to your connection's flame. The more you interact, the brighter your ember burns. Messages don't just disappear—they transform into the warmth that keeps your relationships glowing.

Privacy by design: No permanent storage, no data mining, just authentic moments shared between people who matter.`}
                      </TextBlock>
                      
                      <div className="mt-4 flex justify-center">
                        <button
                          onClick={() => setExpandedMessages(false)}
                          className="text-xs text-ember hover:text-carmine transition-colors"
                        >
                          Show less
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Show more button when not expanded */}
                  {!expandedMessages && (
                    <button
                      onClick={() => setExpandedMessages(true)}
                      className="text-xs text-ember hover:text-carmine transition-colors mt-2"
                    >
                      Learn more
                    </button>
                  )}
                </div>
              </BurningPaperCard>
            </div>
          </section>

          {/* Glow Metrics Feature - Separate Section */}
          <section className="mb-16">
            <div className="max-w-2xl mx-auto">
              <BurningPaperCard className="text-center">
                <div className="space-y-4">
                  {/* Design System Style Icon Button */}
                  <div className="w-16 h-16 mx-auto flex items-center justify-center">
                    <IconedButton
                      icon={<Users className="w-6 h-6 text-softwhite" />}
                      label="Learn more about Glow Metrics"
                      size="lg"
                      onClick={() => setExpandedMetrics(!expandedMetrics)}
                      className={`transition-all duration-300 ${
                        expandedMetrics ? 'scale-110' : ''
                      }`}
                    />
                  </div>
                  
                  <Heading3>Glow Metrics</Heading3>
                  
                  {/* Short description - always visible */}
                  <TextBlock className="text-sm">
                    See at a glance which friendships need tending, thanks to dynamic brightness and gentle flickers.
                  </TextBlock>
                  
                  {/* Expanded content - conditionally visible */}
                  {expandedMetrics && (
                    <div className="mt-6 pt-6 border-t border-ember/30 text-left">
                      <TextBlock className="text-sm leading-relaxed whitespace-pre-line">
                        {`Glow Metrics transform relationship maintenance from a chore into an intuitive experience. Your connections naturally show their health through visual cues.

Visual Indicators:
• Flame brightness reflects interaction frequency
• Particle density shows conversation depth
• Color temperature indicates relationship warmth
• Flickering patterns reveal communication rhythms
• Dying embers highlight neglected connections

Smart Insights:
• Gentle reminders for friends you haven't contacted
• Celebration animations for strengthening bonds
• Seasonal patterns in your social energy
• Connection quality over quantity metrics
• Personalized suggestions for meaningful outreach

No numbers, no scores, no social pressure—just beautiful, intuitive feedback that helps you nurture the relationships that matter most.`}
                      </TextBlock>
                      
                      <div className="mt-4 flex justify-center">
                        <button
                          onClick={() => setExpandedMetrics(false)}
                          className="text-xs text-ember hover:text-carmine transition-colors"
                        >
                          Show less
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Show more button when not expanded */}
                  {!expandedMetrics && (
                    <button
                      onClick={() => setExpandedMetrics(true)}
                      className="text-xs text-ember hover:text-carmine transition-colors mt-2"
                    >
                      Learn more
                    </button>
                  )}
                </div>
              </BurningPaperCard>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
};