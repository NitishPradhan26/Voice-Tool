'use client';

import { useMemo } from 'react';
import ClickableWord from './ClickableWord';
import { applyWordTransformations } from '@/utils/textTransformations';

interface TranscriptDisplayProps {
  transcript: string;
  onWordCorrection: (originalWord: string, correctedWord: string) => void;
  correctedWords: Record<string, string>;
}

export default function TranscriptDisplay({ 
  transcript, 
  onWordCorrection, 
  correctedWords 
}: TranscriptDisplayProps) {
  // Apply corrections to transcript for display
  const displayTranscript = useMemo(() => {
    return applyWordTransformations(transcript, correctedWords);
  }, [transcript, correctedWords]);

  // Split transcript into words while preserving whitespace and punctuation
  const renderClickableTranscript = () => {
    if (!displayTranscript) return null;

    // Split by spaces but keep the spaces
    const parts = displayTranscript.split(/(\s+)/);
    
    return parts.map((part, index) => {
      // If it's just whitespace, render as-is
      if (/^\s+$/.test(part)) {
        return <span key={index}>{part}</span>;
      }
      
      // If it contains word characters, make it clickable
      if (/\w/.test(part)) {
        return (
          <ClickableWord
            key={index}
            word={part}
            onCorrection={onWordCorrection}
          />
        );
      }
      
      // Otherwise (punctuation only), render as-is
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
      {renderClickableTranscript()}
    </div>
  );
}