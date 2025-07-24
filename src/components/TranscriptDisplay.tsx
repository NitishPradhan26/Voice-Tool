'use client';

import { useState } from 'react';
import ClickableWord from './ClickableWord';
import FuzzyMatchWord from './FuzzyMatchWord';
import { applyWordTransformations, FuzzyMatchMap } from '@/utils/textTransformations';

interface TranscriptDisplayProps {
  transcript: string;
  onWordCorrection: (originalWord: string, correctedWord: string) => void;
  fuzzyMatches?: FuzzyMatchMap;
  onRevertFuzzyMatch?: (correctedWord: string, originalWord: string) => void;
}

export default function TranscriptDisplay({ 
  transcript, 
  onWordCorrection, 
  fuzzyMatches = {},
  onRevertFuzzyMatch
}: TranscriptDisplayProps) {
  const [showBanner, setShowBanner] = useState<boolean>(false);

  const handleWordCorrection = async (originalWord: string, correctedWord: string) => {
    await onWordCorrection(originalWord, correctedWord);
    
    // Show banner after successful correction
    setShowBanner(true);
    
    // Hide banner after 3 seconds
    setTimeout(() => {
      setShowBanner(false);
    }, 3000);
  };
  
  // Use pre-processed transcript and fuzzy matches from grammar service
  const displayTranscript = transcript;

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
        // Check if this word is a fuzzy match
        const cleanPart = part.replace(/[^\w]/g, '');
        const isFuzzyMatch = fuzzyMatches[cleanPart] !== undefined;
        
        if (isFuzzyMatch) {
          return (
            <FuzzyMatchWord
              key={index}
              word={part}
              fuzzyMatch={fuzzyMatches[cleanPart]}
              onCorrection={handleWordCorrection}
              onRevertFuzzyMatch={onRevertFuzzyMatch}
            />
          );
        } else {
          return (
            <ClickableWord
              key={index}
              word={part}
              onCorrection={handleWordCorrection}
            />
          );
        }
      }
      
      // Otherwise (punctuation only), render as-is
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="relative">
      {/* Success Banner */}
      {showBanner && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-pulse">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Word correction saved!</span>
        </div>
      )}
      
      <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
        {renderClickableTranscript()}
      </div>
    </div>
  );
}