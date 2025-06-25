import React, { useState, useMemo } from 'react';
import { BurningPaperCard } from './ui/Card';
import { EmberButton } from './ui/Button';
import { IconedButton } from './ui/IconedButton';
import { CheckButton } from './ui/CheckButton';
import { InputBox } from './ui/InputBox';
import { PasswordInput } from './ui/PasswordInput';
import { Heading1, Heading2, Heading3, TextBlock, SmallText } from './ui/Typography';
import { Hearth } from './ui/Hearth';
import { Sparkles, Eye, MessageCircle, Zap, Users, AlertCircle, CheckCircle, Mail, RefreshCw } from 'lucide-react';
import { signUp, signIn, validateEmail, validatePasswordStrength, resendConfirmation } from '../lib/auth';

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

export const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'signup' | 'login'>('login'); // Changed to 'login' first
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [hoveredLetter, setHoveredLetter] = useState<string | null>(null);
  
  // Authentication state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  
  // Real-time validation states
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);

  // Scroll to auth section
  const scrollToAuth = () => {
    const authSection = document.getElementById('auth-section');
    if (authSection) {
      authSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Real-time email validation
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value) {
      setEmailValid(validateEmail(value));
    } else {
      setEmailValid(null);
    }
  };

  // Real-time password validation
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value) {
      const validation = validatePasswordStrength(value);
      setPasswordErrors(validation.errors);
    } else {
      setPasswordErrors([]);
    }
    
    // Check if passwords match
    if (confirmPassword) {
      setPasswordsMatch(value === confirmPassword);
    }
  };

  // Real-time confirm password validation
  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (value && password) {
      setPasswordsMatch(password === value);
    } else {
      setPasswordsMatch(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'signup') {
        // Sign up validation
        if (!validateEmail(email)) {
          throw new Error('Please enter a valid email address');
        }

        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.valid) {
          throw new Error(passwordValidation.errors.join('. '));
        }

        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (!nickname.trim() || nickname.length < 2 || nickname.length > 50) {
          throw new Error('Nickname must be between 2 and 50 characters');
        }

        if (!agreeToTerms) {
          throw new Error('You must agree to the terms and conditions');
        }

        const { data, error } = await signUp(email, password, nickname);

        if (error) {
          throw error;
        }

        if (data?.needsEmailConfirmation) {
          setNeedsEmailConfirmation(true);
        } else if (data?.user) {
          // User was created and signed in immediately (no email confirmation required)
          // The AuthProvider will handle the redirect automatically
          setSuccess(true);
        }
      } else {
        // Sign in validation
        if (!validateEmail(email)) {
          throw new Error('Please enter a valid email address');
        }

        if (!password) {
          throw new Error('Please enter your password');
        }

        const { data, error } = await signIn(email, password);

        if (error) {
          throw error;
        }

        if (data.user) {
          // User signed in successfully
          // The AuthProvider will handle the redirect automatically
          setSuccess(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  // Handle resending confirmation email
  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setResendingEmail(true);
    setError(null);

    try {
      const { error } = await resendConfirmation(email);
      
      if (error) {
        throw error;
      }

      alert('Confirmation email sent! Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend confirmation email');
    } finally {
      setResendingEmail(false);
    }
  };

  // Generate clip paths for each letter
  const letterClipPaths = React.useMemo(() => ({
    e: generateLetterClipPath(1),
    m: generateLetterClipPath(2),
    b: generateLetterClipPath(3),
    r: generateLetterClipPath(4)
  }), []);

  // Generate stationary ember particles (no movement)
  const stationaryEmberParticles = React.useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => ({
      left: `${rand(-10, 110)}%`,
      top: `${rand(-10, 110)}%`,
      size: `${rand(0.5, 2)}px`,
      color: randColor(EMBER_COLORS),
      intensity: rand(0.6, 1.2),
      opacity: rand(0.3, 0.8)
    }));
  }, []);

  // Generate stationary flame elements (no movement)
  const stationaryFlames = React.useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      left: `${rand(5, 95)}%`,
      top: `${rand(5, 95)}%`,
      width: `${rand(2, 4)}px`,
      height: `${rand(6, 10)}px`,
      color: randColor(EMBER_COLORS.slice(0, 3)), // Only warm colors for flames
      intensity: rand(0.8, 1.5),
      opacity: rand(0.4, 0.9)
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

  // Show success message for sign up with email confirmation
  if (needsEmailConfirmation) {
    return (
      <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)] flex items-center justify-center px-8 py-16">
        <div className="max-w-md mx-auto">
          <BurningPaperCard glowOnHover className="text-center">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-gradient-to-br from-ember to-carmine rounded-full mx-auto flex items-center justify-center">
                <Mail className="w-8 h-8 text-dark" />
              </div>
              <div>
                <Heading2 className="text-ember mb-4">Check Your Email</Heading2>
                <TextBlock className="text-ash mb-6">
                  We've sent a verification link to <strong className="text-softwhite">{email}</strong>. 
                  Please check your email and click the link to activate your account.
                </TextBlock>
                <SmallText className="text-ash mb-4">
                  Didn't receive the email? Check your spam folder.
                </SmallText>
              </div>
              
              <div className="space-y-3">
                <EmberButton 
                  onClick={handleResendConfirmation}
                  disabled={resendingEmail}
                  size="sm"
                  className="w-full"
                >
                  {resendingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Resend Confirmation Email'
                  )}
                </EmberButton>
                
                <button
                  onClick={() => {
                    setNeedsEmailConfirmation(false);
                    setActiveTab('login');
                    setEmail('');
                    setPassword('');
                    setNickname('');
                    setConfirmPassword('');
                    setAgreeToTerms(false);
                    setError(null);
                  }}
                  className="text-ember hover:text-carmine transition-colors text-sm"
                >
                  Back to Sign In
                </button>
              </div>
              
              {error && (
                <div className="p-3 bg-carmine/20 border border-carmine/50 rounded-soft">
                  <SmallText className="text-carmine">{error}</SmallText>
                </div>
              )}
            </div>
          </BurningPaperCard>
        </div>
      </div>
    );
  }

  // Show success message for sign up without email confirmation
  if (success && activeTab === 'signup') {
    return (
      <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)] flex items-center justify-center px-8 py-16">
        <div className="max-w-md mx-auto">
          <BurningPaperCard glowOnHover className="text-center">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-gradient-to-br from-ember to-carmine rounded-full mx-auto flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-dark" />
              </div>
              <div>
                <Heading2 className="text-ember mb-4">Welcome to Embr!</Heading2>
                <TextBlock className="text-ash mb-6">
                  Your account has been created successfully. Redirecting you to your hearth...
                </TextBlock>
              </div>
              <div className="w-8 h-8 bg-ember rounded-full mx-auto animate-pulse" />
            </div>
          </BurningPaperCard>
        </div>
      </div>
    );
  }

  // Show success message for sign in
  if (success && activeTab === 'login') {
    return (
      <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)] flex items-center justify-center px-8 py-16">
        <div className="max-w-md mx-auto">
          <BurningPaperCard glowOnHover className="text-center">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-gradient-to-br from-ember to-carmine rounded-full mx-auto flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-dark" />
              </div>
              <div>
                <Heading2 className="text-ember mb-4">Welcome Back!</Heading2>
                <TextBlock className="text-ash mb-6">
                  You've signed in successfully. Redirecting you to your hearth...
                </TextBlock>
              </div>
              <div className="w-8 h-8 bg-ember rounded-full mx-auto animate-pulse" />
            </div>
          </BurningPaperCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)]">
      {/* Bolt Logo - Top Left */}
      <div className="absolute top-4 left-4 z-50">
        <a 
          href="https://bolt.new" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block hover:opacity-80 transition-opacity"
        >
          <img 
            src="/logotext_poweredby_360w.png" 
            alt="Powered by Bolt" 
            className="h-8 w-auto"
          />
        </a>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-8 py-16">
        {/* Stationary background embers */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-ember rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          {/* Individual Letter Burning Aesthetic Logo - 20% Larger */}
          <div className="mb-12 relative overflow-visible">
            <div className="inline-flex items-center justify-center gap-3 relative overflow-visible">
              
              {/* Stationary ember particle system around entire logo */}
              {stationaryEmberParticles.map((ember, i) => (
                <span
                  key={`stationary-ember-${i}`}
                  className="absolute rounded-full pointer-events-none z-20"
                  style={{
                    width: ember.size,
                    height: ember.size,
                    backgroundColor: `rgb(${ember.color})`,
                    left: ember.left,
                    top: ember.top,
                    filter: `blur(0.5px) brightness(${ember.intensity})`,
                    boxShadow: `0 0 4px rgb(${ember.color})`,
                    mixBlendMode: 'screen',
                    opacity: ember.opacity
                  }}
                />
              ))}

              {/* Stationary flame elements */}
              {stationaryFlames.map((flame, i) => (
                <div
                  key={`stationary-flame-${i}`}
                  className="absolute pointer-events-none z-15"
                  style={{
                    width: flame.width,
                    height: flame.height,
                    left: flame.left,
                    top: flame.top,
                    background: `linear-gradient(to top, rgb(${flame.color}), rgba(${flame.color}, 0.7), transparent)`,
                    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                    filter: `blur(0.5px) brightness(${flame.intensity})`,
                    mixBlendMode: 'screen',
                    opacity: flame.opacity
                  }}
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
                onClick={() => {
                  setActiveTab('login');
                  setError(null);
                }}
                className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-300 relative overflow-visible ${
                  activeTab === 'login'
                    ? 'text-ember border-b-2 border-ember'
                    : 'text-ash hover:text-softwhite'
                }`}
              >
                {/* Stationary ember particles for active tab */}
                {activeTab === 'login' && Array.from({ length: 8 }).map((_, i) => (
                  <span
                    key={`login-ember-${i}`}
                    className="absolute rounded-full pointer-events-none z-10"
                    style={{
                      width: `${rand(1, 2)}px`,
                      height: `${rand(1, 2)}px`,
                      backgroundColor: `rgb(${randColor(EMBER_COLORS)})`,
                      left: `${rand(10, 90)}%`,
                      top: `${rand(10, 90)}%`,
                      filter: 'blur(0.5px) brightness(2)',
                      boxShadow: '0 0 3px currentColor',
                      mixBlendMode: 'screen',
                      opacity: 0.8
                    }}
                  />
                ))}
                Welcome back
              </button>
              <button
                onClick={() => {
                  setActiveTab('signup');
                  setError(null);
                }}
                className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-300 relative overflow-visible ${
                  activeTab === 'signup'
                    ? 'text-ember border-b-2 border-ember'
                    : 'text-ash hover:text-softwhite'
                }`}
              >
                {/* Stationary ember particles for active tab */}
                {activeTab === 'signup' && Array.from({ length: 8 }).map((_, i) => (
                  <span
                    key={`signup-ember-${i}`}
                    className="absolute rounded-full pointer-events-none z-10"
                    style={{
                      width: `${rand(1, 2)}px`,
                      height: `${rand(1, 2)}px`,
                      backgroundColor: `rgb(${randColor(EMBER_COLORS)})`,
                      left: `${rand(10, 90)}%`,
                      top: `${rand(10, 90)}%`,
                      filter: 'blur(0.5px) brightness(2)',
                      boxShadow: '0 0 3px currentColor',
                      mixBlendMode: 'screen',
                      opacity: 0.8
                    }}
                  />
                ))}
                Join Embr
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-carmine/20 border border-carmine/50 rounded-soft flex items-start gap-3 mb-6">
                <AlertCircle className="w-5 h-5 text-carmine flex-shrink-0 mt-0.5" />
                <div>
                  <SmallText className="text-carmine font-medium">Error</SmallText>
                  <SmallText className="text-carmine">{error}</SmallText>
                </div>
              </div>
            )}

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-softwhite mb-2">
                  Email Address *
                </label>
                <InputBox
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="your@email.com"
                  className="w-full"
                />
                {emailValid === false && (
                  <SmallText className="text-carmine mt-1 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    Please enter a valid email address
                  </SmallText>
                )}
                {emailValid === true && (
                  <SmallText className="text-green-500 mt-1 flex items-center gap-2">
                    <CheckCircle className="w-3 h-3" />
                    Valid email address
                  </SmallText>
                )}
              </div>

              {activeTab === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-softwhite mb-2">
                    Nickname *
                  </label>
                  <InputBox
                    value={nickname}
                    onChange={setNickname}
                    placeholder="Your display name"
                    className="w-full"
                  />
                  <SmallText className="text-ash mt-1">
                    This is how others will see you (2-50 characters)
                  </SmallText>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-softwhite mb-2">
                  Password *
                </label>
                <PasswordInput
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder={activeTab === 'signup' ? "Create a strong password" : "Enter your password"}
                  className="w-full"
                />
                {activeTab === 'signup' && passwordErrors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {passwordErrors.map((error, index) => (
                      <SmallText key={index} className="text-carmine flex items-center gap-2">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {error}
                      </SmallText>
                    ))}
                  </div>
                )}
                {activeTab === 'signup' && password && passwordErrors.length === 0 && (
                  <SmallText className="text-green-500 mt-1 flex items-center gap-2">
                    <CheckCircle className="w-3 h-3" />
                    Password meets all requirements
                  </SmallText>
                )}
              </div>

              {activeTab === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-softwhite mb-2">
                    Confirm Password *
                  </label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder="Confirm your password"
                    className="w-full"
                  />
                  {passwordsMatch === false && (
                    <SmallText className="text-carmine mt-1 flex items-center gap-2">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      Passwords do not match
                    </SmallText>
                  )}
                  {passwordsMatch === true && (
                    <SmallText className="text-green-500 mt-1 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" />
                      Passwords match
                    </SmallText>
                  )}
                </div>
              )}

              {activeTab === 'signup' && (
                <div className="pt-2">
                  <CheckButton
                    checked={agreeToTerms}
                    onChange={setAgreeToTerms}
                    label="I agree to the Terms & Conditions and Privacy Policy"
                  />
                </div>
              )}

              <div className="pt-4">
                <EmberButton 
                  className="w-full" 
                  disabled={loading || !email || !password || (activeTab === 'signup' && (!emailValid || passwordErrors.length > 0 || !passwordsMatch || !agreeToTerms))}
                >
                  {loading 
                    ? (activeTab === 'signup' ? 'Creating Account...' : 'Signing In...') 
                    : (activeTab === 'signup' ? 'Join Embr' : 'Welcome back')
                  }
                </EmberButton>
              </div>

              <SmallText className="text-center text-ash">
                No spam. No ads. Your connections are yours alone.
              </SmallText>
            </form>
          </BurningPaperCard>
        </div>
      </section>

      {/* About Embr Section - Simplified without expansion boxes */}
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

            {/* Example Hearth with Live Flames - Dark Background */}
            <div className="relative">
              <BurningPaperCard glowOnHover className="text-center">
                <div className="space-y-4">
                  <Heading3 className="mb-4">Your connections, visualized as living embers</Heading3>
                  <div className="flex justify-center bg-black rounded-soft p-4">
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

          {/* Feature Cards - Simplified without expansion */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <BurningPaperCard className="text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto flex items-center justify-center">
                  <IconedButton
                    icon={<Eye className="w-6 h-6 text-softwhite" />}
                    label="Canvas View"
                    size="lg"
                  />
                </div>
                <Heading3>Canvas View</Heading3>
                <TextBlock className="text-sm">
                  A dark, ambient backdrop dotted with glowing embers, each pulsing to life as connections grow.
                </TextBlock>
              </div>
            </BurningPaperCard>

            <BurningPaperCard className="text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto flex items-center justify-center">
                  <IconedButton
                    icon={<MessageCircle className="w-6 h-6 text-softwhite" />}
                    label="Ephemeral Messages"
                    size="lg"
                  />
                </div>
                <Heading3>Ephemeral Messages</Heading3>
                <TextBlock className="text-sm">
                  Notes and photos that burst into view—and burn out on your terms.
                </TextBlock>
              </div>
            </BurningPaperCard>

            <BurningPaperCard className="text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto flex items-center justify-center">
                  <IconedButton
                    icon={<Users className="w-6 h-6 text-softwhite" />}
                    label="Glow Metrics"
                    size="lg"
                  />
                </div>
                <Heading3>Glow Metrics</Heading3>
                <TextBlock className="text-sm">
                  See at a glance which friendships need tending, thanks to dynamic brightness and gentle flickers.
                </TextBlock>
              </div>
            </BurningPaperCard>
          </div>
        </div>
      </section>
    </div>
  );
};