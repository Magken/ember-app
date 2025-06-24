import React from 'react';
import { BurningPaperCard } from '../ui/Card';
import { EmberButton } from '../ui/Button';
import { Heading2, TextBlock, SmallText } from '../ui/Typography';
import { CheckCircle, Mail, RefreshCw } from 'lucide-react';

interface SuccessMessageProps {
  type: 'email-confirmation' | 'signup-success' | 'signin-success';
  email: string;
  onResendEmail?: () => void;
  onBackToSignIn?: () => void;
  resendingEmail?: boolean;
  error?: string | null;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  type,
  email,
  onResendEmail,
  onBackToSignIn,
  resendingEmail = false,
  error
}) => {
  const getContent = () => {
    switch (type) {
      case 'email-confirmation':
        return {
          icon: <Mail className="w-8 h-8 text-dark" />,
          title: 'Check Your Email',
          message: (
            <>
              We've sent a verification link to <strong className="text-softwhite">{email}</strong>. 
              Please check your email and click the link to activate your account.
            </>
          ),
          subMessage: "Didn't receive the email? Check your spam folder.",
          showActions: true
        };
      
      case 'signup-success':
        return {
          icon: <CheckCircle className="w-8 h-8 text-dark" />,
          title: 'Welcome to Embr!',
          message: 'Your account has been created successfully. Redirecting you to your hearth...',
          subMessage: null,
          showActions: false
        };
      
      case 'signin-success':
        return {
          icon: <CheckCircle className="w-8 h-8 text-dark" />,
          title: 'Welcome Back!',
          message: "You've signed in successfully. Redirecting you to your hearth...",
          subMessage: null,
          showActions: false
        };
      
      default:
        return {
          icon: <CheckCircle className="w-8 h-8 text-dark" />,
          title: 'Success!',
          message: 'Operation completed successfully.',
          subMessage: null,
          showActions: false
        };
    }
  };

  const content = getContent();

  return (
    <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)] flex items-center justify-center px-8 py-16">
      <div className="max-w-md mx-auto">
        <BurningPaperCard glowOnHover className="text-center">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-ember to-carmine rounded-full mx-auto flex items-center justify-center">
              {content.icon}
            </div>
            <div>
              <Heading2 className="text-ember mb-4">{content.title}</Heading2>
              <TextBlock className="text-ash mb-6">
                {content.message}
              </TextBlock>
              {content.subMessage && (
                <SmallText className="text-ash mb-4">
                  {content.subMessage}
                </SmallText>
              )}
            </div>
            
            {content.showActions && (
              <div className="space-y-3">
                {onResendEmail && (
                  <EmberButton 
                    onClick={onResendEmail}
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
                )}
                
                {onBackToSignIn && (
                  <button
                    onClick={onBackToSignIn}
                    className="text-ember hover:text-carmine transition-colors text-sm"
                  >
                    Back to Sign In
                  </button>
                )}
              </div>
            )}
            
            {type !== 'email-confirmation' && (
              <div className="w-8 h-8 bg-ember rounded-full mx-auto animate-pulse" />
            )}
            
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
};