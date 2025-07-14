'use client';

import { useState, useEffect } from 'react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useAuth } from '@/contexts/AuthContext';
// Removed direct service import - now using API endpoint
import TranscriptDisplay from './TranscriptDisplay';
import MicWaveform from './WaveformAnimation';

export default function VoiceRecorder() {
  const { 
    recordingState, 
    startRecording, 
    stopRecording, 
    confirmTranscription,
    cancelRecording,
    transcript, 
    error,
    audioDuration,
    wordCount 
  } = useVoiceRecorder();
  
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [prompt, setPrompt] = useState<string>('The following is a voice-to-text transcription. Please clean it up for grammar and clarity. Respond back with just the cleaned-up text.'); 
  const { user } = useAuth();

  const handleToggleRecording = async () => {
    if (recordingState === 'idle') {
      await startRecording();
    } else if (recordingState === 'recording') {
      stopRecording();
    }
  };

  // Load user's saved prompt on component mount or user change
  useEffect(() => {
    const loadUserPrompt = async () => {
      if (user) {
        try {
          const response = await fetch(`/api/user/prompt?uid=${user.uid}`);
          if (!response.ok) {
            throw new Error('Failed to fetch user prompt');
          }
          const data = await response.json();
          setPrompt(data.prompt);
        } catch (error) {
          console.error('Error loading user prompt:', error);
        }
      }
    };
    loadUserPrompt();
  }, [user]);
  
  
  const handleCopyTranscript = async () => {
    if (transcript) {
      try {
        await navigator.clipboard.writeText(transcript);
        setCopyStatus('copied');
        console.log('Transcript copied to clipboard');
        
        // Reset copy status after 2 seconds
        setTimeout(() => {
          setCopyStatus('idle');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy transcript:', err);
      }
    }
  };

  const getMicButtonText = () => {
    switch (recordingState) {
      case 'recording':
        return 'Stop Recording';
      case 'processing':
        return 'Processing...';
      case 'awaiting_confirmation':
        return 'Recording Ready';
      case 'transcribing':
        return 'Transcribing...';
      default:
        return 'Start Recording';
    }
  };

  const getMicButtonStyle = () => {
    switch (recordingState) {
      case 'recording':
        return 'bg-red-500 hover:bg-red-600 animate-pulse';
      case 'processing':
        return 'bg-yellow-500 cursor-not-allowed';
      case 'awaiting_confirmation':
        return 'bg-green-500 cursor-not-allowed';
      case 'transcribing':
        return 'bg-purple-500 cursor-not-allowed animate-pulse';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-2 sm:p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Voice Recorder</h2>
        <p className="text-gray-600">Click the microphone to start recording</p>
      </div>

      {/* Main Recording Button */}
      {recordingState !== 'awaiting_confirmation' && (
        <button
          onClick={handleToggleRecording}
          disabled={recordingState === 'processing' || recordingState === 'transcribing'}
          className={`
            ${getMicButtonStyle()}
            text-white font-semibold py-4 px-8 rounded-full
            transition-all duration-200 transform hover:scale-105
            disabled:transform-none disabled:hover:scale-100
            focus:outline-none focus:ring-4 focus:ring-blue-300
            min-w-[200px]
          `}
          aria-label={getMicButtonText()}
        >
          <div className="flex items-center justify-center space-x-2">
            {/* Microphone Icon */}
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <span>{getMicButtonText()}</span>
          </div>
        </button>
      )}

      {/* Confirmation Buttons */}
      {recordingState === 'awaiting_confirmation' && (
        <div className="flex flex-col items-center space-y-4">
          <p className="text-lg font-medium text-gray-700 text-center">
            Recording complete! Would you like to transcribe this audio?
          </p>
          <div className="flex space-x-4">
            {/* Confirm Button */}
            <button
              onClick={() => confirmTranscription(prompt)}
              className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
              aria-label="Confirm and transcribe recording"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Transcribe</span>
            </button>

            {/* Cancel Button */}
            <button
              onClick={cancelRecording}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300"
              aria-label="Cancel and discard recording"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Discard</span>
            </button>
          </div>
        </div>
      )}

      {/* Recording State Indicator with Waveform */}
      {recordingState === 'recording' && (
        <div className="flex flex-col items-center space-y-4">
          <MicWaveform isRecording={true} />
          <div className="flex items-center space-x-2 text-red-600">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Recording in progress...</span>
          </div>
        </div>
      )}

      {/* Audio Duration Display */}
      {recordingState === 'awaiting_confirmation' && audioDuration > 0 && (
        <div className="text-sm text-gray-600">
          Recording duration: {audioDuration} seconds
        </div>
      )}

      {/* Transcribing State Indicator */}
      {recordingState === 'transcribing' && (
        <div className="flex items-center space-x-2 text-purple-600">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Transcribing audio...</span>
        </div>
      )}

      {/* Transcript Display */}
      {transcript && (
        <div className="w-full max-w-2xl mt-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Transcript</h3>
              <div className="relative group">
                <button
                  onClick={handleCopyTranscript}
                  className={`
                    ${copyStatus === 'copied' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-gray-500 hover:bg-gray-600'
                    }
                    text-white px-3 py-1 rounded text-sm font-medium transition-all duration-200
                  `}
                >
                  <div className="flex items-center space-x-1">
                    {copyStatus === 'copied' ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy</span>
                      </>
                    )}
                  </div>
                </button>
                
                {/* Tooltip */}
                {copyStatus === 'idle' && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                      Copy to clipboard
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
                    </div>
                )}
              </div>
            </div>
            
            {/* Metrics Display */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-8 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Word Count:</span>
                <span className="text-base sm:text-lg font-bold text-blue-600">{wordCount}</span>
              </div>
              <div className="w-6 h-px sm:w-px sm:h-6 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Audio Duration:</span>
                <span className="text-base sm:text-lg font-bold text-green-600">{audioDuration}s</span>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded p-3 min-h-[100px]">
              <TranscriptDisplay transcript={transcript} />
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md max-w-md">
          <p className="text-sm">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}
    </div>
  );
}