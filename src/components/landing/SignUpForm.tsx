import React from 'react';
import { InputBox } from '../ui/InputBox';
import { PasswordInput } from '../ui/PasswordInput';
import { CheckButton } from '../ui/CheckButton';
import { EmberButton } from '../ui/Button';
import { SmallText } from '../ui/Typography';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { validateEmail, validatePasswordStrength } from '../../lib/auth';

interface SignUpFormData {
  email: string;
  password: string;
  nickname: string;
  agreeToTerms: boolean;
}

interface SignUpFormProps {
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  nickname: string;
  onNicknameChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  agreeToTerms: boolean;
  onAgreeToTermsChange: (value: boolean) => void;
  loading: boolean;
  error: string | null;
  emailValid: boolean | null;
  onEmailValidChange: (valid: boolean | null) => void;
  passwordErrors: string[];
  onPasswordErrorsChange: (errors: string[]) => void;
  passwordsMatch: boolean | null;
  onPasswordsMatchChange: (match: boolean | null) => void;
  onSubmit: (data: SignUpFormData) => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  nickname,
  onNicknameChange,
  confirmPassword,
  onConfirmPasswordChange,
  agreeToTerms,
  onAgreeToTermsChange,
  loading,
  error,
  emailValid,
  onEmailValidChange,
  passwordErrors,
  onPasswordErrorsChange,
  passwordsMatch,
  onPasswordsMatchChange,
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

  // Real-time password validation
  const handlePasswordChange = (value: string) => {
    onPasswordChange(value);
    if (value) {
      const validation = validatePasswordStrength(value);
      onPasswordErrorsChange(validation.errors);
    } else {
      onPasswordErrorsChange([]);
    }
    
    // Check if passwords match
    if (confirmPassword) {
      onPasswordsMatchChange(value === confirmPassword);
    }
  };

  // Real-time confirm password validation
  const handleConfirmPasswordChange = (value: string) => {
    onConfirmPasswordChange(value);
    if (value && password) {
      onPasswordsMatchChange(password === value);
    } else {
      onPasswordsMatchChange(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    if (!validateEmail(email)) {
      return;
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return;
    }

    if (password !== confirmPassword) {
      return;
    }

    if (!nickname.trim() || nickname.length < 2 || nickname.length > 50) {
      return;
    }

    if (!agreeToTerms) {
      return;
    }

    onSubmit({
      email: email.trim(),
      password,
      nickname: nickname.trim(),
      agreeToTerms
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
          onChange={onNicknameChange}
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
          onChange={onAgreeToTermsChange}
          label="I agree to the Terms & Conditions and Privacy Policy"
        />
      </div>

      <div className="pt-4">
        <EmberButton 
          className="w-full" 
          disabled={loading || !emailValid || passwordErrors.length > 0 || !passwordsMatch || !agreeToTerms}
        >
          {loading ? 'Creating Account...' : 'Join Embr'}
        </EmberButton>
      </div>

      <SmallText className="text-center text-ash">
        No spam. No ads. Your connections are yours alone.
      </SmallText>
    </form>
  );
};