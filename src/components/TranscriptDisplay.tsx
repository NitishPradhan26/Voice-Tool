'use client';

import { useState } from 'react';
import ClickableWord from './ClickableWord';

interface TranscriptDisplayProps {
  transcript: string;
}

export default function TranscriptDisplay({ transcript }: TranscriptDisplayProps) {
  const [currentTranscript, setCurrentTranscript] = useState(transcript);

  const handleWordCorrection = (incorrectWord: string, correctWord: string) => {
    // Replace all instances of the word in the current transcript
    const cleanIncorrectWord = incorrectWord.replace(/[^\w]/g, '');
    const wordRegex = new RegExp(`\\b${cleanIncorrectWord}\\b`, 'gi');
    
    const updatedTranscript = currentTranscript.replace(wordRegex, correctWord);
    setCurrentTranscript(updatedTranscript);
  };

  // Split transcript into words while preserving whitespace and punctuation
  const renderClickableTranscript = () => {
    if (!currentTranscript) return null;

    // Split by spaces but keep the spaces
    const parts = currentTranscript.split(/(\s+)/);
    
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
            onCorrection={handleWordCorrection}
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