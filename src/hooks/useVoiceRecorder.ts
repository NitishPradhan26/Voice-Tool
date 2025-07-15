import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { applyWordTransformations } from '@/utils/textTransformations';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'awaiting_confirmation' | 'transcribing' | 'correcting_grammar';

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
  confirmTranscription: (prompt?: string) => Promise<void>;
  cancelRecording: () => void;
  audioBlob: Blob | null;
  transcript: string | null;
  error: string | null;
  audioDuration: number;
  wordCount: number;
  prompt: string;
  correctedWords: Record<string, string>;
  handleWordCorrection: (originalWord: string, correctedWord: string) => Promise<void>;
}

export const useVoiceRecorder = (): UseVoiceRecorderReturn => {
  const { user } = useAuth();
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [wordCount, setWordCount] = useState<number>(0);
  const [prompt, setPrompt] = useState<string>('');
  const [correctedWords, setCorrectedWords] = useState<Record<string, string>>({});
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number | null>(null);

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

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      setTranscript(null);
      setAudioDuration(0);
      setWordCount(0);
      
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

        // Set state to await user confirmation
        setRecordingState('awaiting_confirmation');
      };

      // Start recording
      mediaRecorder.start();
      recordingStartTimeRef.current = Date.now();
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
      
      // Calculate audio duration
      if (recordingStartTimeRef.current) {
        const duration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
        setAudioDuration(duration);
      }
      
      mediaRecorderRef.current.stop();
    }
  }, [recordingState]);

  const validateAudioBlob = useCallback((blob: Blob): string | null => {
    return validateAudioBlobPure(blob);
  }, []);

  const transcribeAndApplyfiler = useCallback(async (blob: Blob) => {

  }, []);

  const transcribeAudioBlob = useCallback(async (blob: Blob, prompt?: string) => {
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
      if (prompt) {
        formData.append('prompt', prompt);
      }
      if (user) {
        formData.append('uid', user.uid);
      }

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const originalTranscript = result.transcript;
        setTranscript(originalTranscript);
        
        // Calculate word count for original transcript
        const words = originalTranscript.trim().split(/\s+/).filter((word: string) => word.length > 0);
        setWordCount(words.length);
        console.log('Transcription completed:', originalTranscript);
        
        // Step 2: Grammar correction
        try {
          setRecordingState('correcting_grammar');
          console.log('Starting grammar correction...');
          
          const grammarResponse = await fetch('/api/grammar/correct', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: originalTranscript,
              userPrompt: prompt,
              uid: user?.uid
            }),
          });
          
          if (!grammarResponse.ok) {
            throw new Error(`Grammar correction failed: ${grammarResponse.status}`);
          }
          
          const grammarResult = await grammarResponse.json();
          
          if (grammarResult.success) {
            setTranscript(grammarResult.correctedText);
            console.log('Grammar correction completed:', grammarResult.correctedText);
          } else {
            console.warn('Grammar correction failed, using original transcript:', grammarResult.error);
            // Keep original transcript if grammar correction fails
          }
        } catch (grammarError) {
          console.warn('Grammar correction error, using original transcript:', grammarError);
          // Keep original transcript if grammar correction fails
        }
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

  const confirmTranscription = useCallback(async (prompt?: string) => {
    if (audioBlob && recordingState === 'awaiting_confirmation') {
      await transcribeAudioBlob(audioBlob, prompt);
    }
  }, [audioBlob, recordingState, transcribeAudioBlob]);

  const handleWordCorrection = useCallback(async (originalWord: string, correctedWord: string) => {
    // Update local corrections map for immediate UI feedback
    setCorrectedWords(prev => ({
      ...prev,
      [originalWord]: correctedWord
    }));
    
    // Save only this single correction to server
    if (user) {
      try {
        await fetch('/api/user/transformations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: user.uid,
            transformations: {
              [originalWord]: correctedWord  // Only send the single correction
            }
          })
        });
        console.log(`Word correction saved: "${originalWord}" → "${correctedWord}"`);
      } catch (error) {
        console.error('Error saving word correction:', error);
      }
    }
  }, [user]);

  const cancelRecording = useCallback(() => {
    if (recordingState === 'awaiting_confirmation') {
      setAudioBlob(null);
      setTranscript(null);
      setError(null);
      setAudioDuration(0);
      setWordCount(0);
      setRecordingState('idle');
    }
  }, [recordingState]);

  return {
    recordingState,
    startRecording,
    stopRecording,
    confirmTranscription,
    cancelRecording,
    audioBlob,
    transcript,
    error,
    audioDuration,
    wordCount,
    prompt,
    correctedWords,
    handleWordCorrection
  };
};