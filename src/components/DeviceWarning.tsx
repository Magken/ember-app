import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { BurningPaperCard } from './ui/Card';
import { EmberButton } from './ui/Button';
import { Heading2, TextBlock } from './ui/Typography';

interface DeviceWarningProps {
  onDismiss?: () => void;
}

export const DeviceWarning: React.FC<DeviceWarningProps> = ({ onDismiss }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<string>('');

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const platform = navigator.platform.toLowerCase();
      
      let isAppleDevice = false;
      let deviceType = '';
      
      // Check for iOS devices
      if (/iphone|ipad|ipod/.test(userAgent)) {
        isAppleDevice = true;
        deviceType = 'iOS';
      }
      // Check for macOS
      else if (/macintosh|mac os x/.test(userAgent) || platform.includes('mac')) {
        isAppleDevice = true;
        deviceType = 'macOS';
      }
      // Check for Safari on Apple devices
      else if (/safari/.test(userAgent) && !/chrome/.test(userAgent) && 
               (platform.includes('mac') || /iphone|ipad|ipod/.test(userAgent))) {
        isAppleDevice = true;
        deviceType = 'Apple Safari';
      }
      
      if (isAppleDevice) {
        setDeviceInfo(deviceType);
        setShowWarning(true);
      }
    };

    detectDevice();
  }, []);

  const handleDismiss = () => {
    setShowWarning(false);
    onDismiss?.();
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <BurningPaperCard className="max-w-md w-full mx-auto">
        <div className="text-center space-y-6">
          {/* Warning Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-carmine to-ember rounded-full mx-auto flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-dark" />
          </div>
          
          {/* Warning Content */}
          <div className="space-y-4">
            <Heading2 className="text-carmine">Device Not Supported</Heading2>
            
            <TextBlock className="text-ash">
              We detected that you're using a {deviceInfo} device. 
              This web application is not optimized for Apple devices and may not function properly.
            </TextBlock>
            
            <TextBlock className="text-ash text-sm">
              For the best experience, please use a Windows, Linux, or Android device with a modern browser like Chrome, Firefox, or Edge.
            </TextBlock>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <EmberButton 
              onClick={handleDismiss}
              className="w-full"
            >
              Continue Anyway
            </EmberButton>
            
            <button
              onClick={handleDismiss}
              className="text-ash hover:text-softwhite transition-colors text-sm"
            >
              Don't show again
            </button>
          </div>
        </div>
      </BurningPaperCard>
    </div>
  );
}; 