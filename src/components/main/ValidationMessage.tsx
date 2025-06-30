import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { SmallText } from '../ui/Typography';

interface ValidationMessageProps {
  error?: string | null;
  success?: string | null;
}

/**
 * Reusable validation message component for forms
 */
export const ValidationMessage: React.FC<ValidationMessageProps> = ({
  error,
  success
}) => {
  if (error) {
    return (
      <div className="p-4 bg-carmine/20 border border-carmine/50 rounded-soft flex items-start gap-3 mb-4">
        <AlertCircle className="w-5 h-5 text-carmine flex-shrink-0 mt-0.5" />
        <SmallText className="text-carmine">{error}</SmallText>
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-soft flex items-start gap-3 mb-4">
        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        <SmallText className="text-green-500">{success}</SmallText>
      </div>
    );
  }

  return null;
};