import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { SmallText } from './ui/Typography';

interface ValidationMessageProps {
  message: {
    type: 'success' | 'error';
    message: string;
  } | null;
}

export const ValidationMessage: React.FC<ValidationMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className={`p-3 rounded-soft border flex items-start gap-3 ${
      message.type === 'success' 
        ? 'bg-ember/20 border-ember/50' 
        : 'bg-carmine/20 border-carmine/50'
    }`}>
      {message.type === 'success' ? (
        <CheckCircle className="w-5 h-5 text-ember flex-shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="w-5 h-5 text-carmine flex-shrink-0 mt-0.5" />
      )}
      <SmallText className={message.type === 'success' ? 'text-ember' : 'text-carmine'}>
        {message.message}
      </SmallText>
    </div>
  );
}; 