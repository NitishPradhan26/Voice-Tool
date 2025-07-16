'use client';

import { useState, useRef, useEffect } from 'react';
import { FuzzyMatch } from '@/utils/textTransformations';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';

interface FuzzyMatchWordProps {
  word: string;
  fuzzyMatch: FuzzyMatch;
  onCorrection: (originalWord: string, correctedWord: string) => void;
  onRevertFuzzyMatch?: (correctedWord: string, originalWord: string) => void;
}

export default function FuzzyMatchWord({ word, fuzzyMatch, onCorrection, onRevertFuzzyMatch }: FuzzyMatchWordProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const { user } = useAuth();
  const { addDiscardedFuzzy, refetchUserData } = useUserData();

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  // Adjust tooltip position to prevent overflow on mobile
  useEffect(() => {
    if (showTooltip && tooltipRef.current && wordRef.current) {
      const tooltip = tooltipRef.current;
      const word = wordRef.current;
      const viewportWidth = window.innerWidth;
      const padding = 10;
      
      // Get word and tooltip positions
      const wordRect = word.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      // Calculate if tooltip would overflow
      const tooltipWidth = tooltipRect.width;
      const wordCenter = wordRect.left + wordRect.width / 2;
      const tooltipLeft = wordCenter - tooltipWidth / 2;
      const tooltipRight = tooltipLeft + tooltipWidth;
      
      // Reset classes
      tooltip.classList.remove('left-0', 'right-0', 'left-1/2', '-translate-x-1/2');
      
      // Apply appropriate positioning
      if (tooltipRight > viewportWidth - padding) {
        // Tooltip overflows right, align to right edge
        tooltip.classList.add('right-0');
      } else if (tooltipLeft < padding) {
        // Tooltip overflows left, align to left edge
        tooltip.classList.add('left-0');
      } else {
        // Tooltip fits, center it
        tooltip.classList.add('left-1/2', '-translate-x-1/2');
      }
    }
  }, [showTooltip]);

  const handleWordClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTooltip(true);
  };

  const handleAccept = () => {
    // This fuzzy match is already applied, so we don't need to do anything
    setShowTooltip(false);
  };

  const handleUndo = async () => {
    if (!user) return;
    
    setIsUndoing(true);
    try {
      // Use the context method to add discarded fuzzy match
      await addDiscardedFuzzy(fuzzyMatch.originalWord.toLowerCase(), fuzzyMatch.matchedKey);

      // Refresh user data to get the latest context
      await refetchUserData();

      // Revert the word in the transcript if the callback is provided
      if (onRevertFuzzyMatch) {
        onRevertFuzzyMatch(fuzzyMatch.correctedWord, fuzzyMatch.originalWord);
      }

      // Close tooltip and show success banner
      setShowTooltip(false);
      setShowBanner(true);
      
      // Hide banner after 3 seconds
      setTimeout(() => {
        setShowBanner(false);
      }, 3000);
      
      console.log('Fuzzy match preference saved:', fuzzyMatch);
    } catch (error) {
      console.error('Error saving fuzzy match preference:', error);
      // Could add error handling here
    } finally {
      setIsUndoing(false);
    }
  };

  const confidencePercentage = Math.round((1 - fuzzyMatch.score) * 100);

  return (
    <span className="relative inline-block">
      {/* Success Banner */}
      {showBanner && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Preference saved!</span>
        </div>
      )}
      
      <span
        ref={wordRef}
        onClick={handleWordClick}
        className="cursor-pointer bg-yellow-200 hover:bg-yellow-300 text-yellow-900 rounded px-1 py-0.5 transition-colors duration-150 border-b-2 border-yellow-400"
        title="Fuzzy matched word - click to see details"
      >
        {word}
      </span>

      {showTooltip && (
        <div
          ref={tooltipRef}
          className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[280px] max-w-[95vw]"
          style={{ top: '100%' }}
        >
          <div className="space-y-3">
            <div className="border-b border-gray-200 pb-2">
              <h4 className="text-sm font-semibold text-gray-800 mb-1">Fuzzy Match Applied</h4>
              <div className="text-xs text-gray-600">
                Confidence: {confidencePercentage}%
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-600">Original:</span>
                <span className="text-sm font-mono bg-red-50 text-red-700 px-2 py-1 rounded">
                  {fuzzyMatch.originalWord}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-600">Corrected to:</span>
                <span className="text-sm font-mono bg-green-50 text-green-700 px-2 py-1 rounded">
                  {fuzzyMatch.correctedWord}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-600">Matched rule:</span>
                <span className="text-sm font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {fuzzyMatch.matchedKey}
                </span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
              <button
                onClick={handleUndo}
                disabled={isUndoing}
                className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isUndoing ? 'Saving...' : 'Undo'}
              </button>
              <button
                onClick={handleAccept}
                className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}