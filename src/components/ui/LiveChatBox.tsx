import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BurningPaperCard } from './Card';
import { IconedButton } from './IconedButton';
import { Flame } from './Flame';
import { TextBlock, SmallText, TinyText } from './Typography';
import { ChatInput } from './ChatInput';
import { X, Check, CheckCheck, Play, Pause, Download, Circle, Eye, FileText } from 'lucide-react';
import { 
  getConversationMessages, 
  markMessagesAsSeen, 
  sendMessage, 
  getOrCreateConversation,
  messagingSubscriptionManager,
  type Message,
  type SendMessageData 
} from '../../lib/messaging';

interface MediaFile {
  id: string;
  file: File;
  type: 'image' | 'gif' | 'audio' | 'video' | 'voice';
  url: string;
  name: string;
}

interface LiveChatBoxProps {
  contactUserId: string;
  contactName: string;
  connectionStrength: number; // 0-1 for flame strength
  onClose?: () => void;
  className?: string;
  height?: number;
}

export const LiveChatBox: React.FC<LiveChatBoxProps> = ({
  contactUserId,
  contactName,
  connectionStrength = 0.7,
  onClose,
  className = '',
  height = 600
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});
  const videoElementsRef = useRef<{ [key: string]: HTMLVideoElement }>({});
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup audio and video elements on unmount
  useEffect(() => {
    return () => {
      Object.values(audioElementsRef.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      
      Object.values(videoElementsRef.current).forEach(video => {
        video.pause();
        video.src = '';
      });
      
      // Cleanup real-time subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      // Cleanup polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Live polling for new messages (1 second interval)
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      if (conversationId) {
        try {
          const { data: latestMessages } = await getConversationMessages(conversationId, 10, 0);
          
          if (latestMessages && latestMessages.length > 0) {
            setMessages(prev => {
              // Check if we have new messages
              const latestMessageId = latestMessages[0].message_id;
              const currentLatestId = prev.length > 0 ? prev[0].message_id : null;
              
              if (latestMessageId !== currentLatestId) {
                // We have new messages, merge them
                const newMessages = latestMessages.filter(msg => 
                  !prev.some(existingMsg => existingMsg.message_id === msg.message_id)
                );
                
                if (newMessages.length > 0) {
                  // Mark new messages as seen if they're not from the current user
                  markMessagesAsSeen(conversationId);
                  return [...newMessages, ...prev];
                }
              }
              
              return prev;
            });
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }
    }, 1000); // Poll every second
  }, [conversationId]);

  // Initialize conversation and load messages
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get or create conversation
        const { data: convId, error: convError } = await getOrCreateConversation(contactUserId);
        
        if (convError || !convId) {
          throw new Error(convError?.message || 'Failed to create conversation');
        }

        setConversationId(convId);

        // Load initial messages
        const { data: initialMessages, error: messagesError } = await getConversationMessages(convId, 50, 0);
        
        if (messagesError) {
          throw new Error(messagesError.message || 'Failed to load messages');
        }

        setMessages(initialMessages || []);
        
        // Mark messages as seen
        if (initialMessages && initialMessages.length > 0) {
          await markMessagesAsSeen(convId);
        }

        // Set up real-time subscription
        const unsubscribe = messagingSubscriptionManager.subscribeToConversation(
          convId,
          (newMessage: Message) => {
            console.log('New message received in real-time:', newMessage);
            setMessages(prev => [newMessage, ...prev]);
            
            // Mark as seen if not from current user
            if (newMessage.sender_id !== contactUserId) {
              markMessagesAsSeen(convId, newMessage.message_id);
            }
          }
        );
        
        unsubscribeRef.current = unsubscribe;

        // Start live polling
        startPolling();

      } catch (err: any) {
        console.error('Error initializing chat:', err);
        setError(err.message || 'Failed to initialize chat');
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, [contactUserId, startPolling]);

  // Scroll to bottom when new messages are added
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  // Scroll to bottom when messages change (new messages)
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages.length, scrollToBottom]);

  // Handle infinite scroll - load more messages when scrolled to top
  const handleScroll = useCallback(async () => {
    if (!messagesContainerRef.current || isLoadingMore || !hasMoreMessages || !conversationId) return;

    const container = messagesContainerRef.current;
    const { scrollTop } = container;
    
    // If scrolled to top (with small threshold)
    if (scrollTop <= 50) {
      setIsLoadingMore(true);
      
      // Store current scroll height before loading new messages
      previousScrollHeight.current = container.scrollHeight;
      
      try {
        const { data: olderMessages, error } = await getConversationMessages(
          conversationId, 
          20, 
          messages.length
        );
        
        if (error) {
          throw error;
        }

        if (olderMessages && olderMessages.length > 0) {
          setMessages(prev => [...prev, ...olderMessages]);
        } else {
          setHasMoreMessages(false);
        }
      } catch (error) {
        console.error('Failed to load more messages:', error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [isLoadingMore, hasMoreMessages, conversationId, messages.length]);

  // Maintain scroll position after loading older messages
  useEffect(() => {
    if (messagesContainerRef.current && previousScrollHeight.current > 0) {
      const container = messagesContainerRef.current;
      const newScrollHeight = container.scrollHeight;
      const scrollDifference = newScrollHeight - previousScrollHeight.current;
      
      // Maintain scroll position by adjusting for the new content height
      container.scrollTop = scrollDifference;
      previousScrollHeight.current = 0;
    }
  }, [messages]);

  // Add scroll event listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleSendMessage = async (messageText: string, mediaFiles?: MediaFile[]) => {
    if (!conversationId || (!messageText.trim() && !mediaFiles?.length)) return;

    try {
      const messageData: SendMessageData = {
        content: messageText.trim() || undefined,
        message_type: mediaFiles?.length ? mediaFiles[0].type : 'text',
        media_files: mediaFiles?.map(file => ({
          file_name: file.name,
          file_size: file.file.size,
          file_type: file.file.type,
          file_url: file.url,
          // Add additional properties based on file type
          ...(file.type === 'image' || file.type === 'gif' || file.type === 'video') && {
            width: 0, // You'd get actual dimensions
            height: 0
          },
          ...(file.type === 'audio' || file.type === 'voice' || file.type === 'video') && {
            duration: 0 // You'd get actual duration
          }
        }))
      };

      const { data, error } = await sendMessage(contactUserId, messageData);
      
      if (error) {
        throw error;
      }

      console.log('Message sent successfully:', data);
      setMessage('');
      
      // Trigger flame strength update event
      window.dispatchEvent(new CustomEvent('messageSent'));
      
      // Refresh chat after sending to see the sent message
      setTimeout(async () => {
        if (conversationId) {
          const { data: refreshedMessages } = await getConversationMessages(conversationId, 50, 0);
          if (refreshedMessages) {
            setMessages(refreshedMessages);
          }
        }
      }, 500);
      
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setError(error.message || 'Failed to send message');
    }
  };

  const toggleAudioPlayback = (mediaFile: any) => {
    const audioId = `${mediaFile.id}-${mediaFile.file_url}`;
    
    if (playingAudio === audioId) {
      // Stop current audio
      if (audioElementsRef.current[audioId]) {
        audioElementsRef.current[audioId].pause();
      }
      setPlayingAudio(null);
    } else {
      // Stop any currently playing audio
      if (playingAudio && audioElementsRef.current[playingAudio]) {
        audioElementsRef.current[playingAudio].pause();
      }

      // Create or get audio element
      if (!audioElementsRef.current[audioId]) {
        const audio = new Audio(mediaFile.file_url);
        audio.onended = () => setPlayingAudio(null);
        audio.onerror = () => {
          console.error('Audio playback error');
          setPlayingAudio(null);
        };
        audioElementsRef.current[audioId] = audio;
      }

      // Play audio
      audioElementsRef.current[audioId].play().catch(error => {
        console.error('Audio play error:', error);
        setPlayingAudio(null);
      });
      setPlayingAudio(audioId);
    }
  };

  const toggleVideoPlayback = (mediaFile: any) => {
    const videoId = `${mediaFile.id}-${mediaFile.file_url}`;
    
    if (playingVideo === videoId) {
      // Stop current video
      if (videoElementsRef.current[videoId]) {
        videoElementsRef.current[videoId].pause();
      }
      setPlayingVideo(null);
    } else {
      // Stop any currently playing video
      if (playingVideo && videoElementsRef.current[playingVideo]) {
        videoElementsRef.current[playingVideo].pause();
      }

      // Create or get video element
      if (!videoElementsRef.current[videoId]) {
        const video = document.createElement('video');
        video.src = mediaFile.file_url;
        video.onended = () => setPlayingVideo(null);
        video.onerror = () => {
          console.error('Video playback error');
          setPlayingVideo(null);
        };
        videoElementsRef.current[videoId] = video;
      }

      // Play video
      videoElementsRef.current[videoId].play().catch(error => {
        console.error('Video play error:', error);
        setPlayingVideo(null);
      });
      setPlayingVideo(videoId);
    }
  };

  const viewImage = (mediaFile: any) => {
    // Open image in new tab for full view
    window.open(mediaFile.file_url, '_blank');
  };

  const downloadMedia = (mediaFile: any) => {
    try {
      const link = document.createElement('a');
      link.href = mediaFile.file_url;
      link.download = mediaFile.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: open in new tab
      window.open(mediaFile.file_url, '_blank');
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getConnectionStatus = () => {
    if (connectionStrength < 0.3) return { text: 'Connection fading', color: 'text-carmine' };
    if (connectionStrength < 0.7) return { text: 'Connection steady', color: 'text-ember' };
    return { text: 'Connection burning bright', color: 'text-softwhite' };
  };

  const status = getConnectionStatus();

  if (loading) {
    return (
      <div className={`relative w-full ${className}`} style={{ height }}>
        <BurningPaperCard className="flex items-center justify-center h-full">
          <div className="text-center">
            <Circle className="w-8 h-8 text-ember mx-auto animate-spin mb-4" />
            <SmallText className="text-ash">Loading conversation...</SmallText>
          </div>
        </BurningPaperCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative w-full ${className}`} style={{ height }}>
        <BurningPaperCard className="flex items-center justify-center h-full">
          <div className="text-center">
            <SmallText className="text-carmine mb-4">{error}</SmallText>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-ember text-dark rounded-soft hover:bg-carmine transition-colors"
            >
              Retry
            </button>
          </div>
        </BurningPaperCard>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      <div className="w-full h-full relative z-50">
        <BurningPaperCard glowOnHover className="flex flex-col h-full w-full relative z-50">
          {/* Chat Header - Fixed at top with high z-index */}
          <div className="flex items-center gap-3 p-3 md:p-4 border-b border-ember/30 flex-shrink-0 relative z-60">
            {/* Flame icon using our Flame component */}
            <div className="flex items-center justify-center flex-shrink-0">
              <Flame strength={connectionStrength} size={32} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-softwhite truncate">{contactName}</span>
              </div>
              <SmallText className={status.color}>{status.text}</SmallText>
            </div>
            
            {/* Close button */}
            {onClose && (
              <div className="flex-shrink-0">
                <IconedButton
                  icon={<X className="w-4 h-4" />}
                  label="Close Chat"
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                />
              </div>
            )}
          </div>

          {/* Messages Container - Scrollable area with fixed height and hidden scrollbars */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-2 md:p-3 space-y-3 scrollbar-hide relative z-55"
            style={{ 
              maxHeight: `calc(${height}px - 180px)`, // Account for header and enhanced input
              minHeight: '200px',
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE/Edge
            }}
          >
            {/* Loading indicator at top */}
            {isLoadingMore && (
              <div className="text-center py-2">
                <SmallText className="text-ember">Loading older messages...</SmallText>
              </div>
            )}
            
            {/* No more messages indicator */}
            {!hasMoreMessages && messages.length > 10 && (
              <div className="text-center py-2">
                <TinyText className="text-ash">No more messages to load</TinyText>
              </div>
            )}

            {/* Messages - Newest first (at bottom of container) */}
            {messages.slice().reverse().map((msg, index) => (
              <div
                key={msg.message_id}
                ref={index === messages.length - 1 ? lastMessageRef : null}
                className={`flex ${msg.sender_id === contactUserId ? 'justify-start' : 'justify-end'} relative z-60`}
              >
                <div className={`max-w-[85%] md:max-w-[70%] ${msg.sender_id === contactUserId ? 'order-1' : 'order-2'}`}>
                  {/* Message bubble - NO EMBER PARTICLES */}
                  <div
                    className={`
                      relative p-3 rounded-lg overflow-visible z-60
                      ${msg.sender_id === contactUserId 
                        ? 'bg-gradient-to-br from-navy/80 to-deepblue/60 text-softwhite border border-ember/30' 
                        : 'bg-gradient-to-br from-ember/80 to-carmine/60 text-dark ml-auto'
                      }
                    `}
                  >
                    {/* Text content */}
                    {msg.content && (
                      <TextBlock className="text-sm relative z-70 break-words mb-2">{msg.content}</TextBlock>
                    )}

                    {/* Media content */}
                    {msg.media_files && msg.media_files.length > 0 && (
                      <div className="space-y-2 relative z-70">
                        {msg.media_files.map((media) => (
                          <div key={media.id}>
                            {/* Image/GIF Display with proper preview */}
                            {(media.file_type.startsWith('image/')) && (
                              <div className="relative group">
                                <img
                                  src={media.file_url}
                                  alt={media.file_name}
                                  className="max-w-full max-h-64 rounded border border-ember/30 cursor-pointer hover:opacity-90 transition-opacity object-cover"
                                  onClick={() => viewImage(media)}
                                  onError={(e) => {
                                    // Fallback for broken images
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                                {/* Fallback for broken images */}
                                <div className="hidden w-full h-32 bg-navy/40 border border-ember/30 rounded flex items-center justify-center">
                                  <div className="text-center">
                                    <FileText className="w-8 h-8 text-ash mx-auto mb-2" />
                                    <SmallText className="text-ash">{media.file_name}</SmallText>
                                    <TinyText className="text-ash">{formatFileSize(media.file_size)}</TinyText>
                                  </div>
                                </div>
                                {media.file_type === 'image/gif' && (
                                  <div className="absolute top-2 left-2 bg-ember text-dark text-xs px-2 py-1 rounded">
                                    GIF
                                  </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      viewImage(media);
                                    }}
                                    className="w-8 h-8 bg-dark/70 text-softwhite rounded-full flex items-center justify-center hover:bg-dark/90 transition-colors"
                                    title="View full size"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadMedia(media);
                                    }}
                                    className="w-8 h-8 bg-dark/70 text-softwhite rounded-full flex items-center justify-center hover:bg-dark/90 transition-colors"
                                    title="Download"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Video Display with proper controls */}
                            {media.file_type.startsWith('video/') && (
                              <div className="relative group">
                                <video
                                  src={media.file_url}
                                  controls
                                  preload="metadata"
                                  className="max-w-full max-h-64 rounded border border-ember/30"
                                  onError={(e) => {
                                    console.error('Video load error:', e);
                                  }}
                                >
                                  Your browser does not support the video tag.
                                </video>
                                <div className="absolute top-2 left-2 bg-ember text-dark text-xs px-2 py-1 rounded">
                                  VIDEO
                                </div>
                                <button
                                  onClick={() => downloadMedia(media)}
                                  className="absolute top-2 right-2 w-8 h-8 bg-dark/70 text-softwhite rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-dark/90"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            {/* Audio Display with proper controls */}
                            {(media.file_type.startsWith('audio/') || msg.message_type === 'voice') && (
                              <div className="flex items-center gap-3 bg-dark/30 p-3 rounded border border-ember/30 min-w-[200px]">
                                <button
                                  onClick={() => toggleAudioPlayback(media)}
                                  className="w-10 h-10 bg-ember text-dark rounded-full flex items-center justify-center hover:bg-ember/80 transition-colors flex-shrink-0"
                                >
                                  {playingAudio === `${media.id}-${media.file_url}` ? (
                                    <Pause className="w-5 h-5" />
                                  ) : (
                                    <Play className="w-5 h-5" />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm text-softwhite truncate">
                                    {msg.message_type === 'voice' ? 'Voice Message' : media.file_name}
                                  </div>
                                  <div className="text-xs text-ash">{formatFileSize(media.file_size)}</div>
                                </div>
                                <button
                                  onClick={() => downloadMedia(media)}
                                  className="w-8 h-8 bg-dark/50 text-softwhite rounded-full flex items-center justify-center hover:bg-dark/70 transition-colors flex-shrink-0"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Message metadata with seen/unseen status */}
                  <div className={`mt-1 flex items-center gap-2 ${msg.sender_id === contactUserId ? 'justify-start' : 'justify-end'}`}>
                    <TinyText className="text-ash">
                      {msg.sender_nickname} • {formatTime(msg.created_at)}
                    </TinyText>
                    
                    {/* Seen/Unseen status icon - only show for sent messages */}
                    {msg.sender_id !== contactUserId && (
                      <div className="flex items-center">
                        {msg.status === 'seen' ? (
                          <CheckCheck className="w-3 h-3 text-ember" title="Seen" />
                        ) : msg.status === 'delivered' ? (
                          <CheckCheck className="w-3 h-3 text-ash" title="Delivered" />
                        ) : (
                          <Check className="w-3 h-3 text-ash" title="Sent" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Avatar - Smaller on mobile */}
                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  msg.sender_id === contactUserId 
                    ? 'bg-gradient-to-br from-navy to-deepblue text-ember border border-ember/30 order-2 ml-2 md:ml-3'
                    : 'bg-gradient-to-br from-ember to-carmine text-dark order-1 mr-2 md:mr-3' 
                }`}>
                  {msg.sender_nickname.charAt(0)}
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced Chat Input - Fixed at bottom with high z-index */}
          <div className="p-2 md:p-3 border-t border-ember/20 flex-shrink-0 relative z-60">
            <ChatInput
              value={message}
              onChange={setMessage}
              onSend={handleSendMessage}
              disabled={!conversationId}
            />
          </div>
        </BurningPaperCard>
      </div>
    </div>
  );
};