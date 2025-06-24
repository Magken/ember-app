import React, { useState } from 'react';
import { BurningPaperCard } from '../ui/Card';
import { EmberButton } from '../ui/Button';
import { InputBox } from '../ui/InputBox';
import { PasswordInput } from '../ui/PasswordInput';
import { CheckButton } from '../ui/CheckButton';
import { Heading2, TextBlock, SmallText } from '../ui/Typography';
import { signUp, validateEmail, validatePasswordStrength } from '../../lib/auth';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSuccess,
  onSwitchToSignIn
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Real-time validation states
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Final validation
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

      if (data.user) {
        setSuccess(true);
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
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
            <SmallText className="text-ash">
              Didn't receive the email? Check your spam folder or try signing up again.
            </SmallText>
          </div>
          {onSwitchToSignIn && (
            <button
              onClick={onSwitchToSignIn}
              className="text-ember hover:text-carmine transition-colors text-sm"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </BurningPaperCard>
    );
  }

  return (
    <BurningPaperCard glowOnHover>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-6">
          <Heading2 className="text-ember">Join Embr</Heading2>
          <SmallText className="text-ash mt-2">
            Create your account to start building connections
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
            Email Address *
          </label>
          <div className="relative">
            <InputBox
              value={email}
              onChange={handleEmailChange}
              placeholder="your@email.com"
              className={`pr-10 ${
                emailValid === true ? 'border-green-500' : 
                emailValid === false ? 'border-carmine' : ''
              }`}
            />
            {emailValid !== null && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {emailValid ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-carmine" />
                )}
              </div>
            )}
          </div>
          {emailValid === false && (
            <SmallText className="text-carmine mt-1">
              Please enter a valid email address
            </SmallText>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-softwhite mb-2">
            Nickname *
          </label>
          <InputBox
            value={nickname}
            onChange={setNickname}
            placeholder="Your display name"
          />
          <SmallText className="text-ash mt-1">
            This is how others will see you (2-50 characters)
          </SmallText>
        </div>

        <div>
          <label className="block text-sm font-medium text-softwhite mb-2">
            Password *
          </label>
          <PasswordInput
            value={password}
            onChange={handlePasswordChange}
            placeholder="Create a strong password"
            className={passwordErrors.length > 0 ? 'border-carmine' : ''}
          />
          {passwordErrors.length > 0 && (
            <div className="mt-2 space-y-1">
              {passwordErrors.map((error, index) => (
                <SmallText key={index} className="text-carmine flex items-center gap-2">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {error}
                </SmallText>
              ))}
            </div>
          )}
          {password && passwordErrors.length === 0 && (
            <SmallText className="text-green-500 mt-1 flex items-center gap-2">
              <CheckCircle className="w-3 h-3" />
              Password meets all requirements
            </SmallText>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-softwhite mb-2">
            Confirm Password *
          </label>
          <div className="relative">
            <PasswordInput
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="Confirm your password"
              className={`pr-10 ${
                passwordsMatch === true ? 'border-green-500' : 
                passwordsMatch === false ? 'border-carmine' : ''
              }`}
            />
            {passwordsMatch !== null && (
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                {passwordsMatch ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-carmine" />
                )}
              </div>
            )}
          </div>
          {passwordsMatch === false && (
            <SmallText className="text-carmine mt-1">
              Passwords do not match
            </SmallText>
          )}
        </div>

        <div className="pt-2">
          <CheckButton
            checked={agreeToTerms}
            onChange={setAgreeToTerms}
            label="I agree to the Terms & Conditions and Privacy Policy"
          />
        </div>

        <div className="pt-4">
          <EmberButton 
            className="w-full" 
            disabled={loading || !emailValid || passwordErrors.length > 0 || !passwordsMatch || !agreeToTerms}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </EmberButton>
        </div>

        {onSwitchToSignIn && (
          <div className="text-center">
            <SmallText className="text-ash">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="text-ember hover:text-carmine transition-colors"
              >
                Sign In
              </button>
            </SmallText>
          </div>
        )}
      </form>
    </BurningPaperCard>
  );
};