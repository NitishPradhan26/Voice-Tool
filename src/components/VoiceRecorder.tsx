'use client';

import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

export default function VoiceRecorder() {
  const { recordingState, startRecording, stopRecording, transcript, error } = useVoiceRecorder();

  const handleToggleRecording = async () => {
    if (recordingState === 'idle') {
      await startRecording();
    } else if (recordingState === 'recording') {
      stopRecording();
    }
  };

  const handleCopyTranscript = async () => {
    if (transcript) {
      try {
        await navigator.clipboard.writeText(transcript);
        console.log('Transcript copied to clipboard');
        // Could add a toast notification here
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
      case 'transcribing':
        return 'bg-purple-500 cursor-not-allowed animate-pulse';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Voice Recorder</h2>
        <p className="text-gray-600">Click the microphone to start recording</p>
      </div>

      {/* Microphone Button */}
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

      {/* Recording State Indicator */}
      {recordingState === 'recording' && (
        <div className="flex items-center space-x-2 text-red-600">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Recording in progress...</span>
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Transcript</h3>
              <button
                onClick={handleCopyTranscript}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                title="Copy to clipboard"
              >
                Copy
              </button>
            </div>
            <div className="bg-white border border-gray-200 rounded p-3 min-h-[100px]">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {transcript}
              </p>
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