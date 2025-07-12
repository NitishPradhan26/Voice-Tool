import { useState, useRef, useCallback } from 'react';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'transcribing';

// Pure function for audio blob validation (extracted for testing)
export const validateAudioBlobPure = (blob: Blob): string | null => {
  const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5 MB in bytes
  const MIN_FILE_SIZE = 1000; // 1KB minimum (reasonable minimum for audio)

  if (blob.size < MIN_FILE_SIZE) {
    return 'Received empty audio, please try again';
  }

  if (blob.size > MAX_FILE_SIZE) {
    return 'The audio is too long, can\'t process it';
  }

  return null;
};

interface UseVoiceRecorderReturn {
  recordingState: RecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  audioBlob: Blob | null;
  transcript: string | null;
  error: string | null;
}

export const useVoiceRecorder = (): UseVoiceRecorderReturn => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      setTranscript(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop event
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        setAudioBlob(audioBlob);
        
        // Log blob for verification (Step 0 requirement)
        console.log('Audio blob created:', {
          size: audioBlob.size,
          type: audioBlob.type,
          blob: audioBlob
        });

        // Clean up stream
        stream.getTracks().forEach(track => track.stop());

        // Validate audio blob before transcription
        const validationError = validateAudioBlob(audioBlob);
        if (validationError) {
          setError(validationError);
          setRecordingState('idle');
          return;
        }

        // Auto-transcribe the audio
        await transcribeAudioBlob(audioBlob);
      };

      // Start recording
      mediaRecorder.start();
      setRecordingState('recording');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      setRecordingState('idle');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      setRecordingState('processing');
      mediaRecorderRef.current.stop();
    }
  }, [recordingState]);

  const validateAudioBlob = useCallback((blob: Blob): string | null => {
    return validateAudioBlobPure(blob);
  }, []);

  const transcribeAudioBlob = useCallback(async (blob: Blob) => {
    try {
      setRecordingState('transcribing');
      setError(null);

      console.log('Sending audio blob:', {
        size: blob.size,
        type: blob.type,
        name: 'recording.webm'
      });

      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setTranscript(result.transcript);
        console.log('Transcription completed:', result.transcript);
      } else {
        console.error('API Error Response:', result);
        throw new Error(result.error || 'Transcription failed');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setError(error instanceof Error ? error.message : 'Failed to transcribe audio');
    } finally {
      setRecordingState('idle');
    }
  }, []);

  return {
    recordingState,
    startRecording,
    stopRecording,
    audioBlob,
    transcript,
    error
  };
};