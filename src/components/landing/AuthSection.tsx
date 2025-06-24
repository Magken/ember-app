import React, { useState } from 'react';
import { BurningPaperCard } from '../ui/Card';
import { EmberButton } from '../ui/Button';
import { InputBox } from '../ui/InputBox';
import { PasswordInput } from '../ui/PasswordInput';
import { CheckButton } from '../ui/CheckButton';
import { SmallText } from '../ui/Typography';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ValidationMessage {
  type: 'success' | 'error';
  message: string;
}

interface AuthSectionProps {
  activeTab: 'signup' | 'login';
  setActiveTab: (tab: 'signup' | 'login') => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  nickname: string;
  setNickname: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  agreeToTerms: boolean;
  setAgreeToTerms: (value: boolean) => void;
  error: string | null;
  loading: boolean;
  emailValid: boolean | null;
  passwordErrors: string[];
  passwordsMatch: boolean | null;
  onSubmit: (e: React.FormEvent) => void;
  randColor: (colors: string[]) => string;
  rand: (a: number, b: number) => number;
  EMBER_COLORS: string[];
}

export const AuthSection: React.FC<AuthSectionProps> = ({
  activeTab,
  setActiveTab,
  email,
  setEmail,
  password,
  setPassword,
  nickname,
  setNickname,
  confirmPassword,
  setConfirmPassword,
  agreeToTerms,
  setAgreeToTerms,
  error,
  loading,
  emailValid,
  passwordErrors,
  passwordsMatch,
  onSubmit,
  randColor,
  rand,
  EMBER_COLORS
}) => {
  return (
    <section id="auth-section" className="py-16 px-8 relative">
      <div className="max-w-md mx-auto">
        <BurningPaperCard glowOnHover className="overflow-visible">
          {/* Interactive Tab Navigation with Ember Effects */}
          <div className="flex mb-8 -mx-4 -mt-4 relative">
            <button
              onClick={() => {
                setActiveTab('signup');
              }}
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
              onClick={() => {
                setActiveTab('login');
              }}
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
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-softwhite mb-2">
                Email Address *
              </label>
              <InputBox
                value={email}
                onChange={setEmail}
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
                onChange={setPassword}
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
                  onChange={setConfirmPassword}
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
  );
};