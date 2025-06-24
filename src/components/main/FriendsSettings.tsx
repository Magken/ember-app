import React from 'react';
import { EmberButton } from '../ui/Button';
import { IconedButton } from '../ui/IconedButton';
import { InputBox } from '../ui/InputBox';
import { Heading3, TextBlock, SmallText, TinyText } from '../ui/Typography';
import { UserPlus, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';

interface ValidationMessage {
  type: 'success' | 'error';
  message: string;
}

interface FriendRequest {
  request_id: string;
  sender_id: string;
  receiver_id: string;
  sender_nickname: string;
  receiver_nickname: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  created_at: string;
  request_type: 'incoming' | 'outgoing';
}

interface FriendsSettingsProps {
  friendUsername: string;
  setFriendUsername: (value: string) => void;
  friendsMessage: ValidationMessage | null;
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  loading: boolean;
  error: string | null;
  onAddFriend: () => void;
  onRefresh: () => void;
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  formatTimeAgo: (dateString: string) => string;
}

export const FriendsSettings: React.FC<FriendsSettingsProps> = ({
  friendUsername,
  setFriendUsername,
  friendsMessage,
  incomingRequests,
  outgoingRequests,
  loading,
  error,
  onAddFriend,
  onRefresh,
  onAcceptRequest,
  onDeclineRequest,
  formatTimeAgo
}) => {
  return (
    <div className="space-y-6 pb-4">
      <div>
        <div className="flex items-center justify-between mb-4">
          <Heading3>Add Friend</Heading3>
          <IconedButton
            icon={<RefreshCw className="w-4 h-4" />}
            label="Refresh"
            size="sm"
            variant="ghost"
            onClick={onRefresh}
          />
        </div>
        <TextBlock className="text-sm text-ash mb-6">
          Enter a username or unique code to send a friend request. Once accepted, their ember will appear in your hearth.
        </TextBlock>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-softwhite mb-2">
              Username or Unique Code
            </label>
            <InputBox
              value={friendUsername}
              onChange={setFriendUsername}
              placeholder="Enter username or EMBR-XXXXXXXX"
            />
          </div>
          
          <div className="pt-2">
            <EmberButton 
              size="sm" 
              onClick={onAddFriend}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Friend Request'}
            </EmberButton>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-carmine/20 border border-carmine/50 rounded">
            <SmallText className="text-carmine">{error}</SmallText>
          </div>
        )}

        {/* Incoming Friend Requests Section */}
        <div className="mt-8 pt-6 border-t border-ember/30">
          <Heading3 className="text-lg mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-ember" />
            Incoming Requests
          </Heading3>
          
          <div className="space-y-3">
            {incomingRequests.length > 0 ? (
              incomingRequests.map((request) => (
                <div key={request.request_id} className="flex items-center justify-between p-3 bg-navy/40 rounded border border-ember/30 transition-all duration-300 hover:border-ember/50">
                  <div>
                    <SmallText className="font-medium text-softwhite">{request.sender_nickname}</SmallText>
                    <TinyText className="text-ash block">{formatTimeAgo(request.created_at)}</TinyText>
                  </div>
                  <div className="flex gap-2">
                    {request.status === 'pending' ? (
                      <>
                        <IconedButton
                          icon={<CheckCircle className="w-4 h-4" />}
                          label="Accept"
                          size="sm"
                          variant="ghost"
                          onClick={() => onAcceptRequest(request.request_id)}
                          className="text-ember hover:bg-ember/20"
                        />
                        <IconedButton
                          icon={<XCircle className="w-4 h-4" />}
                          label="Decline"
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeclineRequest(request.request_id)}
                          className="text-carmine hover:bg-carmine/20"
                        />
                      </>
                    ) : request.status === 'accepted' ? (
                      <span className="px-3 py-1 text-xs bg-ember/20 text-ember rounded">Accepted</span>
                    ) : (
                      <span className="px-3 py-1 text-xs bg-carmine/20 text-carmine rounded">Declined</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <UserPlus className="w-8 h-8 text-ash mx-auto mb-2 opacity-50" />
                <SmallText className="text-ash">No incoming friend requests</SmallText>
              </div>
            )}
          </div>
        </div>

        {/* Outgoing Friend Requests Section */}
        <div className="pt-6 border-t border-ember/30">
          <Heading3 className="text-lg mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-ember" />
            Sent Requests
          </Heading3>
          
          <div className="space-y-3">
            {outgoingRequests.length > 0 ? (
              outgoingRequests.map((request) => (
                <div key={request.request_id} className="flex items-center justify-between p-3 bg-deepblue/40 rounded border border-ember/20 transition-all duration-300 hover:border-ember/40">
                  <div>
                    <SmallText className="font-medium text-softwhite">{request.receiver_nickname}</SmallText>
                    <TinyText className="text-ash block">{formatTimeAgo(request.created_at)}</TinyText>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-ash" />
                    <span className="px-3 py-1 text-xs bg-ash/20 text-ash rounded">Pending</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <Clock className="w-8 h-8 text-ash mx-auto mb-2 opacity-50" />
                <SmallText className="text-ash">No pending sent requests</SmallText>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};