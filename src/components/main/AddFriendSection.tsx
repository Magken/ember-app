import React, { useState } from 'react';
import { EmberButton } from '../ui/Button';
import { InputBox } from '../ui/InputBox';
import { Heading3, SmallText } from '../ui/Typography';
import { ValidationMessage } from './ValidationMessage';
import { UserPlus, RefreshCw } from 'lucide-react';
import { sendFriendRequest, validateUniqueCode } from '../../lib/friends';

interface AddFriendSectionProps {
  onRefreshData: () => void;
}

/**
 * Add friend section component
 */
export const AddFriendSection: React.FC<AddFriendSectionProps> = ({
  onRefreshData
}) => {
  const [uniqueCode, setUniqueCode] = useState('');
  const [friendMessage, setFriendMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  const handleSendFriendRequest = async () => {
    if (!uniqueCode.trim()) {
      setRequestError('Please enter a unique code');
      return;
    }

    if (!validateUniqueCode(uniqueCode)) {
      setRequestError('Invalid unique code format. Should be EMBR-XXXXXXXX');
      return;
    }

    try {
      setSendingRequest(true);
      setRequestError(null);
      setRequestSuccess(null);

      const { data, error } = await sendFriendRequest(uniqueCode, friendMessage.trim() || undefined);
      
      if (error) {
        throw error;
      }

      setRequestSuccess('Friend request sent successfully!');
      setUniqueCode('');
      setFriendMessage('');
      
      setTimeout(() => {
        onRefreshData();
      }, 1000);

    } catch (error: any) {
      console.error('Error sending friend request:', error);
      setRequestError(error.message || 'Failed to send friend request');
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div>
      <Heading3 className="mb-4">Add Friend</Heading3>
      
      <ValidationMessage error={requestError} success={requestSuccess} />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-softwhite mb-2">
            Friend's Unique Code
          </label>
          <InputBox
            value={uniqueCode}
            onChange={setUniqueCode}
            placeholder="EMBR-XXXXXXXX"
          />
          <SmallText className="text-ash mt-1">
            Ask your friend for their unique code to send them a friend request
          </SmallText>
        </div>

        <div>
          <label className="block text-sm font-medium text-softwhite mb-2">
            Message (Optional)
          </label>
          <textarea
            value={friendMessage}
            onChange={(e) => setFriendMessage(e.target.value)}
            placeholder="Hi! I'd like to add you as a friend."
            rows={2}
            maxLength={200}
            className="w-full px-4 py-2 bg-navy text-softwhite placeholder:text-ash border border-ember rounded-soft transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ember hover:shadow-ember resize-none"
          />
          <SmallText className="text-ash mt-1">
            {friendMessage.length}/200 characters
          </SmallText>
        </div>

        <EmberButton
          onClick={handleSendFriendRequest}
          disabled={sendingRequest || !uniqueCode.trim()}
        >
          {sendingRequest ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Send Friend Request
            </>
          )}
        </EmberButton>
      </div>
    </div>
  );
};