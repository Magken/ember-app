import React, { useState } from 'react';
import { BurningPaperCard } from '../ui/Card';
import { AuthTabs } from './AuthTabs';
import { SignUpForm } from './SignUpForm';
import { SignInForm } from './SignInForm';
import { SuccessMessage } from './SuccessMessage';

interface AuthSectionProps {
  onSuccess: () => void;
}

export const AuthSection: React.FC<AuthSectionProps> = ({ onSuccess }) => {
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

  // Show success message for sign up with email confirmation
  if (needsEmailConfirmation) {
    return (
      <SuccessMessage
        type="email-confirmation"
        email={email}
        onResendEmail={() => {
          setResendingEmail(true);
          // Handle resend logic here
          setTimeout(() => setResendingEmail(false), 2000);
        }}
        onBackToSignIn={() => {
          setNeedsEmailConfirmation(false);
          setActiveTab('login');
          setEmail('');
          setPassword('');
          setNickname('');
          setConfirmPassword('');
          setAgreeToTerms(false);
          setError(null);
        }}
        resendingEmail={resendingEmail}
        error={error}
      />
    );
  }

  // Show success message for sign up without email confirmation
  if (success && activeTab === 'signup') {
    return (
      <SuccessMessage
        type="signup-success"
        email={email}
      />
    );
  }

  // Show success message for sign in
  if (success && activeTab === 'login') {
    return (
      <SuccessMessage
        type="signin-success"
        email={email}
      />
    );
  }

  return (
    <section id="auth-section" className="py-16 px-8 relative">
      <div className="max-w-md mx-auto">
        <BurningPaperCard glowOnHover className="overflow-visible">
          <AuthTabs
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setError(null);
            }}
          />

          {activeTab === 'signup' ? (
            <SignUpForm
              email={email}
              onEmailChange={setEmail}
              password={password}
              onPasswordChange={setPassword}
              nickname={nickname}
              onNicknameChange={setNickname}
              confirmPassword={confirmPassword}
              onConfirmPasswordChange={setConfirmPassword}
              agreeToTerms={agreeToTerms}
              onAgreeToTermsChange={setAgreeToTerms}
              loading={loading}
              error={error}
              emailValid={emailValid}
              onEmailValidChange={setEmailValid}
              passwordErrors={passwordErrors}
              onPasswordErrorsChange={setPasswordErrors}
              passwordsMatch={passwordsMatch}
              onPasswordsMatchChange={setPasswordsMatch}
              onSubmit={(formData) => {
                setLoading(true);
                // Handle sign up logic here
                console.log('Sign up:', formData);
                setTimeout(() => {
                  setLoading(false);
                  setSuccess(true);
                  onSuccess();
                }, 2000);
              }}
            />
          ) : (
            <SignInForm
              email={email}
              onEmailChange={setEmail}
              password={password}
              onPasswordChange={setPassword}
              loading={loading}
              error={error}
              emailValid={emailValid}
              onEmailValidChange={setEmailValid}
              onSubmit={(formData) => {
                setLoading(true);
                // Handle sign in logic here
                console.log('Sign in:', formData);
                setTimeout(() => {
                  setLoading(false);
                  setSuccess(true);
                  onSuccess();
                }, 2000);
              }}
            />
          )}
        </BurningPaperCard>
      </div>
    </section>
  );
};