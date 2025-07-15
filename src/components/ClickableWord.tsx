'use client';

import { useState, useRef, useEffect } from 'react';

interface ClickableWordProps {
  word: string;
  onCorrection: (incorrectWord: string, correctWord: string) => void;
}

interface SuggestionResponse {
  suggestions: Array<{
    word: string;
    score?: number;
  }>;
}

export default function ClickableWord({ word, onCorrection }: ClickableWordProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [correction, setCorrection] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false);
        setCorrection('');
        setSuggestions([]);
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup]);

  const fetchSuggestions = async (searchWord: string) => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(`/api/suggest?word=${encodeURIComponent(searchWord)}&limit=3`);
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      const data: SuggestionResponse = await response.json();
      setSuggestions(data.suggestions.map(s => s.word));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleWordClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPopup(true);
    setCorrection('');
    
    // Fetch suggestions from server
    const cleanWord = word.replace(/[^\w]/g, '');
    fetchSuggestions(cleanWord);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (correction.trim() && correction.trim() !== cleanWord) {
      onCorrection(cleanWord, correction.trim());
      setShowPopup(false);
      setCorrection('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowPopup(false);
      setCorrection('');
      setSuggestions([]);
    }
  };

  // Clean word (remove punctuation for comparison)
  const cleanWord = word.replace(/[^\w]/g, '');

  return (
    <span className="relative inline-block">
      <span
        ref={wordRef}
        onClick={handleWordClick}
        className="cursor-pointer hover:bg-blue-100 hover:text-blue-800 rounded px-1 py-0.5 transition-colors duration-150"
        title="Click to add correction"
      >
        {word}
      </span>

      {showPopup && (
        <div
          ref={popupRef}
          className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[240px]"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            top: '100%'
          }}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Correct "{cleanWord}" to:
              </label>
              
              {/* Suggestions */}
              <div className="space-y-1 mb-3">
                <p className="text-xs text-gray-500 font-medium">Suggestions:</p>
                {isLoadingSuggestions ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-sm text-gray-500">Loading...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          onCorrection(cleanWord, suggestion);
                          setShowPopup(false);
                          setCorrection('');
                          setSuggestions([]);
                        }}
                        className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No suggestions found</p>
                )}
              </div>
              
              {/* Manual input */}
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={correction}
                  onChange={(e) => setCorrection(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Or type custom correction"
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPopup(false);
                      setCorrection('');
                      setSuggestions([]);
                    }}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!correction.trim() || correction.trim() === cleanWord}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Replace All
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}