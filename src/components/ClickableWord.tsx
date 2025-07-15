'use client';

import { useState, useRef, useEffect } from 'react';

interface ClickableWordProps {
  word: string;
  onCorrection: (incorrectWord: string, correctWord: string) => void;
}

export default function ClickableWord({ word, onCorrection }: ClickableWordProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [correction, setCorrection] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false);
        setCorrection('');
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup]);

  const handleWordClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPopup(true);
    setCorrection('');
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
          className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px]"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            top: '100%'
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Correct "{cleanWord}" to:
              </label>
              <input
                type="text"
                value={correction}
                onChange={(e) => setCorrection(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter correction"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowPopup(false);
                  setCorrection('');
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
      )}
    </span>
  );
}