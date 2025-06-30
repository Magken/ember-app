import React from 'react';
import { BurningPaperCard } from '../ui/Card';
import { IconedButton } from '../ui/IconedButton';
import { Heading3, SmallText, TinyText } from '../ui/Typography';
import { Check, X, Clock, Users } from 'lucide-react';
import { respondToFriendRequest, formatTimeAgo } from '../../lib/friends';
import type { FriendRequest } from '../../lib/friends';

interface FriendRequestsListProps {
  friendRequests: FriendRequest[];
  onRefreshData: () => void;
}

/**
 * Friend requests list component
 */
export const FriendRequestsList: React.FC<FriendRequestsListProps> = ({
  friendRequests,
  onRefreshData
}) => {
  const incomingRequests = friendRequests.filter(req => req.request_type === 'incoming' && req.status === 'pending');
  const outgoingRequests = friendRequests.filter(req => req.request_type === 'outgoing' && req.status === 'pending');

  const handleRespondToRequest = async (requestId: string, response: 'accepted' | 'declined') => {
    try {
      const { data, error } = await respondToFriendRequest(requestId, response);
      
      if (error) {
        throw error;
      }

      console.log(`Friend request ${response}:`, data);
      
      setTimeout(() => {
        onRefreshData();
      }, 1000);

    } catch (error: any) {
      console.error(`Error ${response} friend request:`, error);
    }
  };

  return (
    <>
      {/* Incoming Friend Requests */}
      {incomingRequests.length > 0 && (
        <div>
          <Heading3 className="mb-4">
            Incoming Requests ({incomingRequests.length})
          </Heading3>
          <div className="space-y-4">
            {incomingRequests.map((request) => (
              <BurningPaperCard key={request.request_id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-ember to-carmine rounded-full flex items-center justify-center text-dark font-bold">
                        {request.sender_nickname.charAt(0)}
                      </div>
                      <div>
                        <SmallText className="font-medium text-softwhite">
                          {request.sender_nickname}
                        </SmallText>
                        <TinyText className="text-ash">
                          {formatTimeAgo(request.created_at)}
                        </TinyText>
                      </div>
                    </div>
                    {request.message && (
                      <SmallText className="text-ash italic">
                        "{request.message}"
                      </SmallText>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <IconedButton
                      icon={<Check className="w-4 h-4" />}
                      label="Accept"
                      size="sm"
                      onClick={() => handleRespondToRequest(request.request_id, 'accepted')}
                    />
                    <IconedButton
                      icon={<X className="w-4 h-4" />}
                      label="Decline"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRespondToRequest(request.request_id, 'declined')}
                    />
                  </div>
                </div>
              </BurningPaperCard>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing Friend Requests */}
      {outgoingRequests.length > 0 && (
        <div>
          <Heading3 className="mb-4">
            Sent Requests ({outgoingRequests.length})
          </Heading3>
          <div className="space-y-4">
            {outgoingRequests.map((request) => (
              <BurningPaperCard key={request.request_id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-navy to-deepblue rounded-full flex items-center justify-center text-ember font-bold border border-ember/30">
                      {request.receiver_nickname.charAt(0)}
                    </div>
                    <div>
                      <SmallText className="font-medium text-softwhite">
                        {request.receiver_nickname}
                      </SmallText>
                      <TinyText className="text-ash">
                        Sent {formatTimeAgo(request.created_at)}
                      </TinyText>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-ash" />
                    <SmallText className="text-ash">Pending</SmallText>
                  </div>
                </div>
              </BurningPaperCard>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-ash mx-auto mb-4" />
          <Heading3 className="mb-2">No pending requests</Heading3>
          <SmallText className="text-ash">
            Friend requests you send or receive will appear here
          </SmallText>
        </div>
      )}
    </>
  );
};