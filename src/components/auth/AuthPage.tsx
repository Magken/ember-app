import React, { useState } from 'react';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { Heading1, TextBlock } from '../ui/Typography';
import { Flame } from '../ui/Flame';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const handleAuthSuccess = () => {
    // Redirect to main app or handle success
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Flame strength={0.8} size={40} animated={true} />
            <Heading1 className="bg-gradient-to-r from-ember via-carmine to-ember bg-clip-text text-transparent">
              embr
            </Heading1>
          </div>
          <TextBlock className="text-ash">
            Where connections glow and conversations fuel the flame
          </TextBlock>
        </div>

        {/* Auth Forms */}
        {mode === 'signin' ? (
          <SignInForm
            onSuccess={handleAuthSuccess}
            onSwitchToSignUp={() => setMode('signup')}
          />
        ) : (
          <SignUpForm
            onSuccess={handleAuthSuccess}
            onSwitchToSignIn={() => setMode('signin')}
          />
        )}
      </div>
    </div>
  );
};