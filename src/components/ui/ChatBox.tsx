import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { BurningPaperCard } from './Card';
import { IconedButton } from './IconedButton';
import { Flame } from './Flame';
import { TextBlock, SmallText, TinyText } from './Typography';
import { ChatInput } from './ChatInput';
import { X, Check, CheckCheck, Play, Pause, Download } from 'lucide-react';
import { InternalEmbers } from './InternalEmbers';

interface MediaFile {
  id: string;
  file: File;
  type: 'image' | 'gif' | 'audio';
  url: string;
  name: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
  senderName: string;
  seen?: boolean;
  mediaFiles?: MediaFile[];
}

interface ChatBoxProps {
  contactName: string;
  connectionStrength: number; // 0-1 for flame strength
  onClose?: () => void;
  className?: string;
  height?: number;
  initialMessages?: Message[];
  onLoadMoreMessages?: () => Promise<Message[]>; // Function to load more messages
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  contactName,
  connectionStrength = 0.7,
  onClose,
  className = '',
  height = 600,
  initialMessages = [],
  onLoadMoreMessages
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Message bubble ember configuration (reduced by 60%)
  const messageBubbleEmberConfig = useMemo(() => ({
    count: 3, // Reduced from 8 to 3
    size: { min: 0.5, max: 1 },
    colors: ['255,191,0', '255,140,0', '255,69,0'],
    driftRange: { x: { min: -5, max: 5 }, y: { min: -10, max: -3 } },
    duration: { min: 2, max: 4 },
    delayRange: { min: 0, max: 2 }
  }), []);

  // Cleanup audio elements on unmount
  useEffect(() => {
    return () => {
      Object.values(audioElementsRef.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

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
    if (!messagesContainerRef.current || isLoadingMore || !hasMoreMessages) return;

    const container = messagesContainerRef.current;
    const { scrollTop } = container;
    
    // If scrolled to top (with small threshold)
    if (scrollTop <= 50) {
      setIsLoadingMore(true);
      
      // Store current scroll height before loading new messages
      previousScrollHeight.current = container.scrollHeight;
      
      try {
        if (onLoadMoreMessages) {
          const newMessages = await onLoadMoreMessages();
          if (newMessages.length > 0) {
            setMessages(prev => [...prev, ...newMessages]);
          } else {
            setHasMoreMessages(false);
          }
        } else {
          // Generate some mock older messages for demo
          const mockOlderMessages: Message[] = Array.from({ length: 5 }, (_, i) => ({
            id: `older-${Date.now()}-${i}`,
            text: `This is an older message ${messages.length + i + 1}. It was sent some time ago.`,
            sender: Math.random() > 0.5 ? 'user' : 'other',
            timestamp: new Date(Date.now() - (messages.length + i + 1) * 60000 * 30),
            senderName: Math.random() > 0.5 ? 'You' : contactName,
            seen: Math.random() > 0.3 // Random seen status for demo
          }));
          
          setMessages(prev => [...prev, ...mockOlderMessages]);
          
          // Stop generating after 20 total messages for demo
          if (messages.length > 15) {
            setHasMoreMessages(false);
          }
        }
      } catch (error) {
        console.error('Failed to load more messages:', error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [isLoadingMore, hasMoreMessages, onLoadMoreMessages, messages.length, contactName]);

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

  const handleSendMessage = (messageText: string, mediaFiles?: MediaFile[]) => {
    if (messageText.trim() || mediaFiles?.length) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        sender: 'user',
        timestamp: new Date(),
        senderName: 'You',
        seen: false,
        mediaFiles: mediaFiles || undefined
      };
      // Add new message at the beginning (most recent)
      setMessages(prev => [newMessage, ...prev]);
      setMessage('');

      // Simulate message being "seen" after a delay
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, seen: true } : msg
        ));
      }, 2000 + Math.random() * 3000);

      // Simulate a response after a short delay
      setTimeout(() => {
        const responses = [
          'That sounds great!',
          'I totally agree with you.',
          'Interesting perspective!',
          'Let me think about that...',
          'You always have the best ideas!',
          'This conversation is keeping our ember burning bright! 🔥',
          'Nice photo! 📸',
          'Love that GIF! 😄',
          'Thanks for the audio message! 🎵'
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const responseMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: randomResponse,
          sender: 'other',
          timestamp: new Date(),
          senderName: contactName,
          seen: true
        };
        setMessages(prev => [responseMessage, ...prev]);
      }, 1000 + Math.random() * 2000);
    }
  };

  const toggleAudioPlayback = (mediaFile: MediaFile) => {
    const audioId = `${mediaFile.id}-${mediaFile.url}`;
    
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
        const audio = new Audio(mediaFile.url);
        audio.onended = () => setPlayingAudio(null);
        audioElementsRef.current[audioId] = audio;
      }

      // Play audio
      audioElementsRef.current[audioId].play();
      setPlayingAudio(audioId);
    }
  };

  const downloadMedia = (mediaFile: MediaFile) => {
    const link = document.createElement('a');
    link.href = mediaFile.url;
    link.download = mediaFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      {/* Ensure the card is properly contained with highest z-index */}
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
                key={msg.id}
                ref={index === messages.length - 1 ? lastMessageRef : null}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} relative z-60`}
              >
                <div className={`max-w-[85%] md:max-w-[70%] ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                  {/* Message bubble */}
                  <div
                    className={`
                      relative p-3 rounded-lg overflow-visible z-60
                      ${msg.sender === 'user' 
                        ? 'bg-gradient-to-br from-ember/80 to-carmine/60 text-dark ml-auto' 
                        : 'bg-gradient-to-br from-navy/80 to-deepblue/60 text-softwhite border border-ember/30'
                      }
                    `}
                  >
                    {/* Internal ember particles for user messages (reduced count) */}
                    {msg.sender === 'user' && (
                      <InternalEmbers
                        componentId={`message-${msg.id}`}
                        config={messageBubbleEmberConfig}
                        enabled={true}
                        className="z-65"
                      />
                    )}
                    
                    {/* Text content */}
                    {msg.text && (
                      <TextBlock className="text-sm relative z-70 break-words mb-2">{msg.text}</TextBlock>
                    )}

                    {/* Media content */}
                    {msg.mediaFiles && msg.mediaFiles.length > 0 && (
                      <div className="space-y-2 relative z-70">
                        {msg.mediaFiles.map((media) => (
                          <div key={media.id}>
                            {/* Image/GIF Display */}
                            {(media.type === 'image' || media.type === 'gif') && (
                              <div className="relative group">
                                <img
                                  src={media.url}
                                  alt={media.name}
                                  className="max-w-full max-h-64 rounded border border-ember/30 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(media.url, '_blank')}
                                />
                                {media.type === 'gif' && (
                                  <div className="absolute top-2 left-2 bg-ember text-dark text-xs px-2 py-1 rounded">
                                    GIF
                                  </div>
                                )}
                                <button
                                  onClick={() => downloadMedia(media)}
                                  className="absolute top-2 right-2 w-8 h-8 bg-dark/70 text-softwhite rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-dark/90"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            {/* Audio Display */}
                            {media.type === 'audio' && (
                              <div className="flex items-center gap-3 bg-dark/30 p-3 rounded border border-ember/30 min-w-[200px]">
                                <button
                                  onClick={() => toggleAudioPlayback(media)}
                                  className="w-10 h-10 bg-ember text-dark rounded-full flex items-center justify-center hover:bg-ember/80 transition-colors flex-shrink-0"
                                >
                                  {playingAudio === `${media.id}-${media.url}` ? (
                                    <Pause className="w-5 h-5" />
                                  ) : (
                                    <Play className="w-5 h-5" />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm text-softwhite truncate">{media.name}</div>
                                  <div className="text-xs text-ash">{formatFileSize(media.file.size)}</div>
                                </div>
                                <button
                                  onClick={() => downloadMedia(media)}
                                  className="w-8 h-8 bg-dark/50 text-softwhite rounded-full flex items-center justify-center hover:bg-dark/70 transition-colors flex-shrink-0"
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
                  <div className={`mt-1 flex items-center gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <TinyText className="text-ash">
                      {msg.senderName} • {formatTime(msg.timestamp)}
                    </TinyText>
                    
                    {/* Seen/Unseen status icon - only show for user messages */}
                    {msg.sender === 'user' && (
                      <div className="flex items-center">
                        {msg.seen ? (
                          <CheckCheck className="w-3 h-3 text-ember" title="Seen" />
                        ) : (
                          <Check className="w-3 h-3 text-ash" title="Sent" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Avatar - Smaller on mobile */}
                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  msg.sender === 'user' 
                    ? 'bg-gradient-to-br from-ember to-carmine text-dark order-1 mr-2 md:mr-3' 
                    : 'bg-gradient-to-br from-navy to-deepblue text-ember border border-ember/30 order-2 ml-2 md:ml-3'
                }`}>
                  {msg.senderName.charAt(0)}
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
              disabled={false}
            />
          </div>
        </BurningPaperCard>
      </div>
    </div>
  );
};