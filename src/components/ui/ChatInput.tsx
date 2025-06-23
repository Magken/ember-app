import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { Send, Image, Mic, FileImage, X, Play, Pause, Volume2 } from 'lucide-react';
import { IconedButton } from './IconedButton';

interface MediaFile {
  id: string;
  file: File;
  type: 'image' | 'gif' | 'audio';
  url: string;
  name: string;
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string, mediaFiles?: MediaFile[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const emberColors = ['bg-ember', 'bg-carmine', 'bg-deepblue', 'bg-softwhite'];
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  placeholder = "Type your message to keep the ember glowing...",
  className = '',
  disabled = false
}) => {
  const [focused, setFocused] = useState(false);
  const [burst, setBurst] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  // Cleanup audio elements on unmount
  useEffect(() => {
    return () => {
      Object.values(audioElementsRef.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((value.trim() || mediaFiles.length > 0) && !disabled) {
      setBurst(true);
      onSend(value, mediaFiles.length > 0 ? mediaFiles : undefined);
      
      // Clear media files after sending
      mediaFiles.forEach(media => URL.revokeObjectURL(media.url));
      setMediaFiles([]);
      
      setTimeout(() => setBurst(false), 500);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      // Check file type and size
      const isImage = file.type.startsWith('image/');
      const isGif = file.type === 'image/gif';
      const maxSize = 10 * 1024 * 1024; // 10MB limit
      
      if (!isImage || file.size > maxSize) {
        alert(`File "${file.name}" is either not an image or exceeds 10MB limit.`);
        return;
      }

      const mediaFile: MediaFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        type: isGif ? 'gif' : 'image',
        url: URL.createObjectURL(file),
        name: file.name
      };

      setMediaFiles(prev => [...prev, mediaFile]);
    });

    // Reset input
    event.target.value = '';
  };

  const handleAudioSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      const isAudio = file.type.startsWith('audio/');
      const maxSize = 25 * 1024 * 1024; // 25MB limit for audio
      
      if (!isAudio || file.size > maxSize) {
        alert(`File "${file.name}" is either not an audio file or exceeds 25MB limit.`);
        return;
      }

      const mediaFile: MediaFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        type: 'audio',
        url: URL.createObjectURL(file),
        name: file.name
      };

      setMediaFiles(prev => [...prev, mediaFile]);
    });

    // Reset input
    event.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        
        const mediaFile: MediaFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          file,
          type: 'audio',
          url: URL.createObjectURL(blob),
          name: file.name
        };

        setMediaFiles(prev => [...prev, mediaFile]);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const removeMediaFile = (id: string) => {
    setMediaFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter(f => f.id !== id);
    });

    // Stop audio if it's playing
    if (audioElementsRef.current[id]) {
      audioElementsRef.current[id].pause();
      delete audioElementsRef.current[id];
    }
    
    if (playingAudio === id) {
      setPlayingAudio(null);
    }
  };

  const toggleAudioPlayback = (mediaFile: MediaFile) => {
    if (playingAudio === mediaFile.id) {
      // Stop current audio
      if (audioElementsRef.current[mediaFile.id]) {
        audioElementsRef.current[mediaFile.id].pause();
      }
      setPlayingAudio(null);
    } else {
      // Stop any currently playing audio
      if (playingAudio && audioElementsRef.current[playingAudio]) {
        audioElementsRef.current[playingAudio].pause();
      }

      // Create or get audio element
      if (!audioElementsRef.current[mediaFile.id]) {
        const audio = new Audio(mediaFile.url);
        audio.onended = () => setPlayingAudio(null);
        audioElementsRef.current[mediaFile.id] = audio;
      }

      // Play audio
      audioElementsRef.current[mediaFile.id].play();
      setPlayingAudio(mediaFile.id);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Only show ember particles on burst (send), not during typing
  const emberCount = burst ? 40 : 0;

  return (
    <div className={`relative w-full space-y-3 ${className}`}>
      {/* Controlled ember particle system - only on send burst */}
      {Array.from({ length: emberCount }).map((_, i) => {
        const edge = randInt(0, 3);
        const offset = (Math.random() - 0.5) * 80;
        let x = 0, y = 0;
        switch (edge) {
          case 0: x = Math.random() * 100; y = offset; break;
          case 1: x = 100 + offset; y = Math.random() * 100; break;
          case 2: x = Math.random() * 100; y = 100 + offset; break;
          default: x = offset; y = Math.random() * 100; break;
        }
        const angle = Math.random() * Math.PI * 2;
        const dist = 30;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist - 8;
        const color = emberColors[i % emberColors.length];
        const delay = (Math.random() * 0.2).toFixed(2);
        const duration = 0.6 + Math.random() * 0.3;

        return (
          <span
            key={i}
            className={`
              absolute w-[1.5px] h-[1.5px] ${color} rounded-sm
              pointer-events-none mix-blend-screen
            `}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              animationName: 'emberFromEdge',
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              animationIterationCount: '1',
              animationTimingFunction: 'ease-out',
              animationFillMode: 'forwards',
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
              filter: 'brightness(2.5) blur(0.5px)',
              boxShadow: '0 0 3px currentColor',
              zIndex: 5
            } as CSSProperties}
          />
        );
      })}

      {/* Media Preview Section */}
      {mediaFiles.length > 0 && (
        <div className="p-3 bg-navy/60 rounded-soft border border-ember/30">
          <div className="flex flex-wrap gap-3">
            {mediaFiles.map((media) => (
              <div key={media.id} className="relative group">
                {/* Image/GIF Preview */}
                {(media.type === 'image' || media.type === 'gif') && (
                  <div className="relative">
                    <img
                      src={media.url}
                      alt={media.name}
                      className="w-20 h-20 object-cover rounded border border-ember/30"
                    />
                    {media.type === 'gif' && (
                      <div className="absolute top-1 left-1 bg-ember text-dark text-xs px-1 rounded">
                        GIF
                      </div>
                    )}
                    <button
                      onClick={() => removeMediaFile(media.id)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-carmine text-white rounded-full flex items-center justify-center hover:bg-carmine/80 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Audio Preview */}
                {media.type === 'audio' && (
                  <div className="flex items-center gap-2 bg-deepblue/60 p-2 rounded border border-ember/30 min-w-[200px]">
                    <button
                      onClick={() => toggleAudioPlayback(media)}
                      className="w-8 h-8 bg-ember text-dark rounded-full flex items-center justify-center hover:bg-ember/80 transition-colors"
                    >
                      {playingAudio === media.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-softwhite truncate">{media.name}</div>
                      <div className="text-xs text-ash">{formatFileSize(media.file.size)}</div>
                    </div>
                    <button
                      onClick={() => removeMediaFile(media.id)}
                      className="w-5 h-5 bg-carmine text-white rounded-full flex items-center justify-center hover:bg-carmine/80 transition-colors flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="p-3 bg-carmine/20 rounded-soft border border-carmine/50 flex items-center gap-3">
          <div className="w-3 h-3 bg-carmine rounded-full animate-pulse"></div>
          <span className="text-carmine font-medium">Recording: {formatRecordingTime(recordingTime)}</span>
          <button
            onClick={stopRecording}
            className="ml-auto px-3 py-1 bg-carmine text-white rounded text-sm hover:bg-carmine/80 transition-colors"
          >
            Stop
          </button>
        </div>
      )}

      {/* Main Text Input and Send Button Container */}
      <div className={`
        relative flex items-end gap-3 p-3 md:p-4 rounded-soft
        bg-gradient-to-br from-navy/85 via-deepblue/75 to-navy/65
        border-2 border-ember/40 backdrop-filter backdrop-blur-sm
        transition-all duration-300 w-full
        ${focused ? 'border-ember/70 shadow-ember/30 bg-gradient-to-br from-navy/90 via-deepblue/80 to-navy/70' : 'hover:border-ember/50'}
        
        before:content-[""] before:absolute before:inset-0 before:-z-10 before:rounded-soft
        before:transition-all before:duration-300
        before:bg-[radial-gradient(circle_at_center,_rgba(255,191,0,0.1),_transparent)]
        before:opacity-0 ${focused ? 'before:opacity-60' : 'hover:before:opacity-30'}
        before:blur-lg before:scale-105
      `}>
        
        {/* Textarea - removed pulsing and fading effects */}
        <div className="flex-1 relative min-w-0">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full min-h-[40px] max-h-[100px] resize-none
              px-3 md:px-4 py-2 md:py-3 rounded-soft
              bg-dark/50 text-softwhite placeholder:text-ash/60
              border border-ember/30 backdrop-filter backdrop-blur-sm
              transition-all duration-300
              focus:outline-none focus:ring-1 focus:ring-ember/40 focus:border-ember/60 focus:bg-dark/70
              hover:border-ember/50 hover:bg-dark/60
              scrollbar-hide
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            rows={1}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              lineHeight: '1.4'
            }}
          />
          
          {/* Subtle static glow effect when focused - no animation */}
          {focused && (
            <div className="absolute inset-0 rounded-soft pointer-events-none">
              <div className="absolute inset-0 rounded-soft bg-gradient-to-r from-ember/3 via-carmine/2 to-ember/3" />
            </div>
          )}
        </div>

        {/* Send button */}
        <div className="flex-shrink-0">
          <IconedButton
            icon={<Send className="w-4 h-4 md:w-5 md:h-5" />}
            label="Send Message"
            onClick={handleSend}
            disabled={(!value.trim() && mediaFiles.length === 0) || disabled}
            size="md"
            className={`
              transition-all duration-300
              ${(!value.trim() && mediaFiles.length === 0) || disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:scale-105 active:scale-95'
              }
            `}
          />
        </div>
      </div>

      {/* Media Input Buttons - Now Below Text Input */}
      <div className="flex justify-center gap-3 px-2">
        {/* Photo/GIF Button */}
        <IconedButton
          icon={<Image className="w-4 h-4" />}
          label="Add Photo/GIF"
          size="sm"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        />
        
        {/* Audio File Button */}
        <IconedButton
          icon={<Volume2 className="w-4 h-4" />}
          label="Add Audio File"
          size="sm"
          variant="ghost"
          onClick={() => audioInputRef.current?.click()}
          disabled={disabled}
        />
        
        {/* Voice Recording Button */}
        <IconedButton
          icon={<Mic className="w-4 h-4" />}
          label={isRecording ? "Recording..." : "Record Voice"}
          size="sm"
          variant="ghost"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          className={isRecording ? 'bg-carmine/20 border-carmine text-carmine' : ''}
        />
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleAudioSelect}
        className="hidden"
      />

      {/* Character count indicator for long messages */}
      {value.length > 200 && (
        <div className="absolute -bottom-6 right-0 z-10">
          <span className={`text-xs ${value.length > 500 ? 'text-carmine' : 'text-ash'}`}>
            {value.length}/1000
          </span>
        </div>
      )}
    </div>
  );
};