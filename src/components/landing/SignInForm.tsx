import React from 'react';
import { InputBox } from '../ui/InputBox';
import { PasswordInput } from '../ui/PasswordInput';
import { EmberButton } from '../ui/Button';
import { SmallText } from '../ui/Typography';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { validateEmail } from '../../lib/auth';

interface SignInFormData {
  email: string;
  password: string;
}

interface SignInFormProps {
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  loading: boolean;
  error: string | null;
  emailValid: boolean | null;
  onEmailValidChange: (valid: boolean | null) => void;
  onSubmit: (data: SignInFormData) => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  loading,
  error,
  emailValid,
  onEmailValidChange,
  onSubmit
}) => {
  // Real-time email validation
  const handleEmailChange = (value: string) => {
    onEmailChange(value);
    if (value) {
      onEmailValidChange(validateEmail(value));
    } else {
      onEmailValidChange(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    if (!validateEmail(email)) {
      return;
    }

    if (!password) {
      return;
    }

    onSubmit({
      email: email.trim(),
      password
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
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

      <div>
        <label className="block text-sm font-medium text-softwhite mb-2">
          Password *
        </label>
        <PasswordInput
          value={password}
          onChange={onPasswordChange}
          placeholder="Enter your password"
          className="w-full"
        />
      </div>

      <div className="pt-4">
        <EmberButton 
          className="w-full" 
          disabled={loading || !email || !password}
        >
          {loading ? 'Signing In...' : 'Welcome back'}
        </EmberButton>
      </div>

      <SmallText className="text-center text-ash">
        No spam. No ads. Your connections are yours alone.
      </SmallText>
    </form>
  );
};