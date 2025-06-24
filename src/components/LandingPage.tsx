import React, { useState } from 'react';
import { BurningPaperCard } from './ui/Card';
import { LandingHero } from './landing/LandingHero';
import { AuthSection } from './landing/AuthSection';
import { AboutSection } from './landing/AboutSection';
import { Heading2, TextBlock, SmallText } from './ui/Typography';
import { CheckCircle, RefreshCw } from 'lucide-react';
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

export const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
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
                <CheckCircle className="w-8 h-8 text-dark" />
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
                <button
                  onClick={handleResendConfirmation}
                  disabled={resendingEmail}
                  className="w-full px-4 py-2 bg-ember text-dark rounded-soft hover:bg-carmine transition-colors disabled:opacity-50"
                >
                  {resendingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin inline" />
                      Sending...
                    </>
                  ) : (
                    'Resend Confirmation Email'
                  )}
                </button>
                
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
      {/* Hero Section */}
      <LandingHero onScrollToAuth={scrollToAuth} />

      {/* Sign Up / Login Section */}
      <AuthSection
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        email={email}
        setEmail={handleEmailChange}
        password={password}
        setPassword={handlePasswordChange}
        nickname={nickname}
        setNickname={setNickname}
        confirmPassword={confirmPassword}
        setConfirmPassword={handleConfirmPasswordChange}
        agreeToTerms={agreeToTerms}
        setAgreeToTerms={setAgreeToTerms}
        error={error}
        loading={loading}
        emailValid={emailValid}
        passwordErrors={passwordErrors}
        passwordsMatch={passwordsMatch}
        onSubmit={handleSubmit}
        randColor={randColor}
        rand={rand}
        EMBER_COLORS={EMBER_COLORS}
      />

      {/* About Embr Section */}
      <AboutSection exampleFlames={exampleFlames} />
    </div>
  );
};