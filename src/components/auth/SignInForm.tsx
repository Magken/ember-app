import React, { useState } from 'react';
import { BurningPaperCard } from '../ui/Card';
import { EmberButton } from '../ui/Button';
import { InputBox } from '../ui/InputBox';
import { PasswordInput } from '../ui/PasswordInput';
import { Heading2, TextBlock, SmallText } from '../ui/Typography';
import { signIn, resetPassword, validateEmail } from '../../lib/auth';
import { useAuth } from './AuthProvider';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface SignInFormProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  onSuccess,
  onSwitchToSignUp
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const { clearCacheForSignIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Clear cache before sign-in for smooth authentication
      console.log('Clearing cache before sign-in...');
      await clearCacheForSignIn();
      
      const { data, error } = await signIn(email, password);

      if (error) {
        throw error;
      }

      if (data.user) {
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        throw error;
      }

      setResetEmailSent(true);
      setShowForgotPassword(false);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  if (resetEmailSent) {
    return (
      <BurningPaperCard glowOnHover className="text-center">
        <div className="space-y-6">
          <div className="w-16 h-16 bg-gradient-to-br from-ember to-carmine rounded-full mx-auto flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-dark" />
          </div>
          <div>
            <Heading2 className="text-ember mb-4">Reset Email Sent</Heading2>
            <TextBlock className="text-ash mb-6">
              We've sent a password reset link to <strong className="text-softwhite">{email}</strong>. 
              Please check your email and follow the instructions to reset your password.
            </TextBlock>
            <SmallText className="text-ash">
              Didn't receive the email? Check your spam folder.
            </SmallText>
          </div>
          <EmberButton 
            onClick={() => {
              setResetEmailSent(false);
              setShowForgotPassword(false);
              setError(null);
            }}
            variant="ghost"
          >
            Back to Sign In
          </EmberButton>
        </div>
      </BurningPaperCard>
    );
  }

  return (
    <BurningPaperCard glowOnHover>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-6">
          <Heading2 className="text-ember">Welcome Back</Heading2>
          <SmallText className="text-ash mt-2">
            Sign in to your Embr account
          </SmallText>
        </div>

        {error && (
          <div className="p-4 bg-carmine/20 border border-carmine/50 rounded-soft flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-carmine flex-shrink-0 mt-0.5" />
            <div>
              <SmallText className="text-carmine font-medium">Error</SmallText>
              <SmallText className="text-carmine">{error}</SmallText>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-softwhite mb-2">
            Email Address
          </label>
          <InputBox
            value={email}
            onChange={setEmail}
            placeholder="your@email.com"
            type="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-softwhite mb-2">
            Password
          </label>
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowForgotPassword(!showForgotPassword)}
            className="text-sm text-ember hover:text-carmine transition-colors"
          >
            Forgot password?
          </button>
        </div>

        {showForgotPassword && (
          <div className="p-4 bg-navy/40 border border-ember/30 rounded-soft">
            <SmallText className="text-ash mb-3">
              Enter your email address above and click the button below to receive a password reset link.
            </SmallText>
            <EmberButton
              type="button"
              onClick={handleForgotPassword}
              disabled={loading || !email}
              size="sm"
              variant="ghost"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </EmberButton>
          </div>
        )}

        <div className="pt-4">
          <EmberButton 
            className="w-full" 
            disabled={loading || !email || !password}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </EmberButton>
        </div>

        {onSwitchToSignUp && (
          <div className="text-center">
            <SmallText className="text-ash">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignUp}
                className="text-ember hover:text-carmine transition-colors"
              >
                Sign Up
              </button>
            </SmallText>
          </div>
        )}
      </form>
    </BurningPaperCard>
  );
};