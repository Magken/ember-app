import React, { useState, useRef, useEffect, CSSProperties, useMemo } from 'react';
import { Send, Image, Mic, FileImage, X, Play, Pause, Volume2, Video, Upload } from 'lucide-react';
import { IconedButton } from './IconedButton';
import { InternalSparkles } from './InternalSparkles';
import { SparkleConfig, COLOR_PALETTES } from '../../lib/sparkleConfig';
import { uploadMediaFile } from '../../lib/messaging';

interface MediaFile {
  id: string;
  file: File;
  type: 'image' | 'gif' | 'audio' | 'video' | 'voice';
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
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Generate unique input ID for consistent sparkles
  const inputId = useMemo(() => 
    `chat-input-${placeholder.slice(0, 10)}`, 
    [placeholder]
  );

  // Optimized sparkle configuration
  const sparkleConfig: SparkleConfig = useMemo(() => ({
    elementId: inputId,
    sparkleCount: burst ? 20 : focused ? 8 : 0, // Reduced from 40+
    animationDuration: burst ? 0.6 : 2,
    sizeRange: { min: 1.5, max: 2.5 },
    colorPalette: COLOR_PALETTES.ember,
    enabled: true,
    pattern: 'edge'
  }), [inputId, burst, focused]);

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
      // Only revoke blob URLs that start with 'blob:'
      mediaFiles.forEach(media => {
        if (media.url.startsWith('blob:')) {
          URL.revokeObjectURL(media.url);
        }
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
    if ((value.trim() || mediaFiles.length > 0) && !disabled && uploadingFiles.size === 0) {
      setBurst(true);
      onSend(value, mediaFiles.length > 0 ? mediaFiles : undefined);
      
      // Clear media files after sending - but don't revoke URLs as they may be needed for display
      setMediaFiles([]);
      
      setTimeout(() => setBurst(false), 500);
    }
  };

  const validateFileSize = (file: File): boolean => {
    const maxSize = 8 * 1024 * 1024; // 8MB limit
    return file.size <= maxSize;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, expectedType: 'image' | 'video') => {
    const files = Array.from(event.target.files || []);
    
    for (const file of files) {
      // Check file size
      if (!validateFileSize(file)) {
        alert(`File "${file.name}" exceeds 8MB limit.`);
        continue;
      }

      // Check file type
      const isValidType = expectedType === 'image' 
        ? file.type.startsWith('image/') 
        : file.type.startsWith('video/');
      
      if (!isValidType) {
        alert(`File "${file.name}" is not a valid ${expectedType} file.`);
        continue;
      }

      const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      // Add to uploading set
      setUploadingFiles(prev => new Set(prev).add(fileId));

      try {
        // Upload file to storage
        const { data: uploadedMedia, error } = await uploadMediaFile(file);
        
        if (error || !uploadedMedia) {
          console.error('Upload failed, using blob URL:', error);
          // Fallback to blob URL
          const mediaFile: MediaFile = {
            id: fileId,
            file,
            type: file.type === 'image/gif' ? 'gif' : expectedType,
            url: URL.createObjectURL(file),
            name: file.name
          };
          setMediaFiles(prev => [...prev, mediaFile]);
        } else {
          // Use uploaded file URL
          const mediaFile: MediaFile = {
            id: fileId,
            file,
            type: file.type === 'image/gif' ? 'gif' : expectedType,
            url: uploadedMedia.file_url,
            name: file.name
          };
          setMediaFiles(prev => [...prev, mediaFile]);
        }
      } catch (uploadError) {
        console.error('Upload error, using blob URL:', uploadError);
        // Fallback to blob URL
        const mediaFile: MediaFile = {
          id: fileId,
          file,
          type: file.type === 'image/gif' ? 'gif' : expectedType,
          url: URL.createObjectURL(file),
          name: file.name
        };
        setMediaFiles(prev => [...prev, mediaFile]);
      } finally {
        // Remove from uploading set
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      }
    }

    // Reset input
    event.target.value = '';
  };

  const handleAudioSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    for (const file of files) {
      const isAudio = file.type.startsWith('audio/');
      
      if (!isAudio) {
        alert(`File "${file.name}" is not an audio file.`);
        continue;
      }

      if (!validateFileSize(file)) {
        alert(`File "${file.name}" exceeds 8MB limit.`);
        continue;
      }

      const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      // Add to uploading set
      setUploadingFiles(prev => new Set(prev).add(fileId));

      try {
        // Upload file to storage
        const { data: uploadedMedia, error } = await uploadMediaFile(file);
        
        if (error || !uploadedMedia) {
          console.error('Upload failed, using blob URL:', error);
          // Fallback to blob URL
          const mediaFile: MediaFile = {
            id: fileId,
            file,
            type: 'audio',
            url: URL.createObjectURL(file),
            name: file.name
          };
          setMediaFiles(prev => [...prev, mediaFile]);
        } else {
          // Use uploaded file URL
          const mediaFile: MediaFile = {
            id: fileId,
            file,
            type: 'audio',
            url: uploadedMedia.file_url,
            name: file.name
          };
          setMediaFiles(prev => [...prev, mediaFile]);
        }
      } catch (uploadError) {
        console.error('Upload error, using blob URL:', uploadError);
        // Fallback to blob URL
        const mediaFile: MediaFile = {
          id: fileId,
          file,
          type: 'audio',
          url: URL.createObjectURL(file),
          name: file.name
        };
        setMediaFiles(prev => [...prev, mediaFile]);
      } finally {
        // Remove from uploading set
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      }
    }

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

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        
        try {
          // Try to upload the recording
          const { data: uploadedMedia, error } = await uploadMediaFile(file);
          
          const mediaFile: MediaFile = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            file,
            type: 'voice',
            url: uploadedMedia?.file_url || URL.createObjectURL(blob),
            name: file.name
          };

          setMediaFiles(prev => [...prev, mediaFile]);
        } catch (error) {
          console.error('Failed to upload recording, using blob URL:', error);
          // Fallback to blob URL
          const mediaFile: MediaFile = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            file,
            type: 'voice',
            url: URL.createObjectURL(blob),
            name: file.name
          };

          setMediaFiles(prev => [...prev, mediaFile]);
        }
        
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
      if (fileToRemove && fileToRemove.url.startsWith('blob:')) {
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
        audio.onerror = (e) => {
          console.error('Audio playback error for file:', mediaFile.name, e);
          setPlayingAudio(null);
        };
        audioElementsRef.current[mediaFile.id] = audio;
      }

      // Play audio
      audioElementsRef.current[mediaFile.id].play().catch(error => {
        console.error('Audio play error for file:', mediaFile.name, error);
        setPlayingAudio(null);
      });
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

  return (
    <div className={`relative w-full space-y-3 ${className}`}>
      {/* Optimized sparkle system */}
      <InternalSparkles 
        config={sparkleConfig}
        isActive={!disabled}
        intensity={burst ? 2 : 1}
        className="z-5"
      />

      {/* Uploading Indicator */}
      {uploadingFiles.size > 0 && (
        <div className="p-3 bg-ember/20 rounded-soft border border-ember/50 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-ember border-t-transparent rounded-full animate-spin"></div>
          <span className="text-ember font-medium">
            Uploading {uploadingFiles.size} file{uploadingFiles.size > 1 ? 's' : ''}...
          </span>
        </div>
      )}

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
                      onError={(e) => {
                        console.error('Image load error for:', media.name);
                        // Optionally show a placeholder or error state
                      }}
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

                {/* Video Preview */}
                {media.type === 'video' && (
                  <div className="relative">
                    <video
                      src={media.url}
                      className="w-20 h-20 object-cover rounded border border-ember/30"
                      muted
                      preload="metadata"
                      onError={(e) => {
                        console.error('Video load error for:', media.name);
                        // Optionally show a placeholder or error state
                      }}
                    />
                    <div className="absolute top-1 left-1 bg-ember text-dark text-xs px-1 rounded">
                      VIDEO
                    </div>
                    <button
                      onClick={() => removeMediaFile(media.id)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-carmine text-white rounded-full flex items-center justify-center hover:bg-carmine/80 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Audio/Voice Preview */}
                {(media.type === 'audio' || media.type === 'voice') && (
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
                      <div className="text-xs text-softwhite truncate">
                        {media.type === 'voice' ? 'Voice Recording' : media.name}
                      </div>
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
        bg-gradient-to-br from-navy/95 via-deepblue/85 to-navy/75
        border-2 border-ember/40 backdrop-filter backdrop-blur-sm
        transition-all duration-300 w-full
        ${focused ? 'border-ember/70 shadow-ember/30' : 'hover:border-ember/50'}
        
        before:content-[""] before:absolute before:inset-0 before:-z-10 before:rounded-soft
        before:transition-all before:duration-300
        before:bg-[radial-gradient(circle_at_center,_rgba(255,191,0,0.1),_transparent)]
        before:opacity-0 ${focused ? 'before:opacity-60' : 'hover:before:opacity-30'}
        before:blur-lg before:scale-105
      `}>
        
        {/* Textarea - removed white film overlay, full opacity */}
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
              bg-dark/90 text-softwhite placeholder:text-ash/60
              border border-ember/30 backdrop-filter backdrop-blur-sm
              transition-all duration-300
              focus:outline-none focus:ring-1 focus:ring-ember/40 focus:border-ember/60 focus:bg-dark
              hover:border-ember/50 hover:bg-dark/95
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
        </div>

        {/* Send button */}
        <div className="flex-shrink-0">
          <IconedButton
            icon={<Send className="w-4 h-4 md:w-5 md:h-5" />}
            label="Send Message"
            onClick={handleSend}
            disabled={(!value.trim() && mediaFiles.length === 0) || disabled || uploadingFiles.size > 0}
            size="md"
            className={`
              transition-all duration-300
              ${(!value.trim() && mediaFiles.length === 0) || disabled || uploadingFiles.size > 0
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
        
        {/* Video Button */}
        <IconedButton
          icon={<Video className="w-4 h-4" />}
          label="Add Video"
          size="sm"
          variant="ghost"
          onClick={() => videoInputRef.current?.click()}
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
        onChange={(e) => handleFileSelect(e, 'image')}
        className="hidden"
      />
      
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={(e) => handleFileSelect(e, 'video')}
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