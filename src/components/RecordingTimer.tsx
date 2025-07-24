import { useState, useEffect } from 'react';

interface RecordingTimerProps {
  maxDuration: number;
  onTimeUp: () => void;
}

export default function RecordingTimer({ maxDuration, onTimeUp }: RecordingTimerProps) {
  const [remainingTime, setRemainingTime] = useState(maxDuration);
  const [startTime] = useState(Date.now());

  // Update timer every second and handle time up
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const newRemainingTime = Math.max(0, maxDuration - elapsedSeconds);
      
      setRemainingTime(newRemainingTime);
      
      if (newRemainingTime === 0) {
        clearInterval(interval);
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, maxDuration, onTimeUp]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculate percentage for progress indication
  const percentage = (remainingTime / maxDuration) * 100;
  
  // Determine warning state (last 2 minutes)
  const isWarning = remainingTime <= 120;
  const isCritical = remainingTime <= 30;

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Timer Display */}
      <div className={`
        text-2xl font-mono font-bold px-4 py-2 rounded-lg border-2 transition-all duration-300
        ${isCritical 
          ? 'text-red-600 border-red-500 bg-red-50 animate-pulse' 
          : isWarning 
            ? 'text-orange-600 border-orange-500 bg-orange-50' 
            : 'text-blue-600 border-blue-500 bg-blue-50'
        }
      `}>
        {formatTime(remainingTime)}
      </div>
      
      {/* Progress Bar */}
      <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`
            h-full transition-all duration-1000 ease-linear
            ${isCritical 
              ? 'bg-red-500' 
              : isWarning 
                ? 'bg-orange-500' 
                : 'bg-blue-500'
            }
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Warning Text */}
      {isWarning && (
        <p className={`
          text-sm font-medium text-center
          ${isCritical ? 'text-red-600' : 'text-orange-600'}
        `}>
          {isCritical 
            ? 'Recording will stop automatically in 30 seconds!' 
            : 'Recording will stop automatically in 2 minutes'
          }
        </p>
      )}
      
      {/* Max Duration Info */}
      <p className="text-xs text-gray-500 text-center">
        Maximum recording time: {formatTime(maxDuration)}
      </p>
    </div>
  );
}