import { NextRequest } from 'next/server';
import { POST } from '../route';
import { parseRequest, processTranscription } from '../../../../services/transcriptionService';
import { getUserTransformations } from '../../../../services/promptService';
import { applyWordTransformations } from '../../../../utils/textTransformations';

// Mock dependencies
jest.mock('../../../../services/transcriptionService');
jest.mock('../../../../services/promptService');
jest.mock('../../../../utils/textTransformations');

const mockParseRequest = parseRequest as jest.MockedFunction<typeof parseRequest>;
const mockProcessTranscription = processTranscription as jest.MockedFunction<typeof processTranscription>;
const mockGetUserTransformations = getUserTransformations as jest.MockedFunction<typeof getUserTransformations>;
const mockApplyWordTransformations = applyWordTransformations as jest.MockedFunction<typeof applyWordTransformations>;

describe('/api/transcribe POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create mock request
  const createMockRequest = (): NextRequest => {
    return {} as NextRequest;
  };

  describe('Happy Path', () => {
    it('successfully transcribes audio without user transformations', async () => {
      const mockAudioFile = new File(['audio data'], 'test.webm', { type: 'audio/webm' });
      const mockTranscriptionResult = {
        transcript: 'Hello world',
        duration: 1500
      };

      mockParseRequest.mockResolvedValue({
        audioFile: mockAudioFile,
        prompt: 'Test prompt',
        uid: undefined
      });
      mockProcessTranscription.mockResolvedValue(mockTranscriptionResult);

      const request = createMockRequest();
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        success: true,
        transcript: 'Hello world',
        duration: 1500
      });
      expect(mockParseRequest).toHaveBeenCalledWith(request);
      expect(mockProcessTranscription).toHaveBeenCalledWith(mockAudioFile);
      expect(mockGetUserTransformations).not.toHaveBeenCalled();
      expect(mockApplyWordTransformations).not.toHaveBeenCalled();
    });

    it('successfully transcribes audio with user transformations', async () => {
      const mockAudioFile = new File(['audio data'], 'test.webm', { type: 'audio/webm' });
      const mockTranscriptionResult = {
        transcript: 'Hello world',
        duration: 1500
      };
      const mockTransformations = { hello: 'hi' };
      const transformedTranscript = 'Hi world';

      mockParseRequest.mockResolvedValue({
        audioFile: mockAudioFile,
        prompt: 'Test prompt',
        uid: 'user123'
      });
      mockProcessTranscription.mockResolvedValue(mockTranscriptionResult);
      mockGetUserTransformations.mockResolvedValue(mockTransformations);
      mockApplyWordTransformations.mockReturnValue(transformedTranscript);

      const request = createMockRequest();
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        success: true,
        transcript: transformedTranscript,
        duration: 1500
      });
      expect(mockGetUserTransformations).toHaveBeenCalledWith('user123');
      expect(mockApplyWordTransformations).toHaveBeenCalledWith('Hello world', mockTransformations);
    });

    it('handles empty user transformations', async () => {
      const mockAudioFile = new File(['audio data'], 'test.webm', { type: 'audio/webm' });
      const mockTranscriptionResult = {
        transcript: 'Hello world',
        duration: 1500
      };

      mockParseRequest.mockResolvedValue({
        audioFile: mockAudioFile,
        uid: 'user123'
      });
      mockProcessTranscription.mockResolvedValue(mockTranscriptionResult);
      mockGetUserTransformations.mockResolvedValue({}); // Empty transformations

      const request = createMockRequest();
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        success: true,
        transcript: 'Hello world',
        duration: 1500
      });
      expect(mockApplyWordTransformations).not.toHaveBeenCalled();
    });

    it('continues with original transcript when transformation fails', async () => {
      const mockAudioFile = new File(['audio data'], 'test.webm', { type: 'audio/webm' });
      const mockTranscriptionResult = {
        transcript: 'Hello world',
        duration: 1500
      };

      mockParseRequest.mockResolvedValue({
        audioFile: mockAudioFile,
        uid: 'user123'
      });
      mockProcessTranscription.mockResolvedValue(mockTranscriptionResult);
      mockGetUserTransformations.mockRejectedValue(new Error('Transformation service down'));

      const request = createMockRequest();
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        success: true,
        transcript: 'Hello world',
        duration: 1500
      });
    });
  });

  describe('Error Handling', () => {
    it('handles parsing errors', async () => {
      mockParseRequest.mockRejectedValue(new Error('No audio file provided'));

      const request = createMockRequest();
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData).toEqual({
        success: false,
        error: 'No audio file provided'
      });
    });

    it('handles transcription errors', async () => {
      const mockAudioFile = new File(['audio data'], 'test.webm', { type: 'audio/webm' });
      
      mockParseRequest.mockResolvedValue({
        audioFile: mockAudioFile
      });
      mockProcessTranscription.mockRejectedValue(new Error('OpenAI API key not configured'));

      const request = createMockRequest();
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData).toEqual({
        success: false,
        error: 'Invalid OpenAI API key'
      });
    });

    it('handles API key errors', async () => {
      const mockAudioFile = new File(['audio data'], 'test.webm', { type: 'audio/webm' });
      
      mockParseRequest.mockResolvedValue({
        audioFile: mockAudioFile
      });
      mockProcessTranscription.mockRejectedValue(new Error('Invalid API key'));

      const request = createMockRequest();
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData).toEqual({
        success: false,
        error: 'Invalid OpenAI API key'
      });
    });

    it('handles quota exceeded errors', async () => {
      const mockAudioFile = new File(['audio data'], 'test.webm', { type: 'audio/webm' });
      
      mockParseRequest.mockResolvedValue({
        audioFile: mockAudioFile
      });
      mockProcessTranscription.mockRejectedValue(new Error('You have exceeded your quota'));

      const request = createMockRequest();
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(429);
      expect(responseData).toEqual({
        success: false,
        error: 'OpenAI API quota exceeded'
      });
    });

    it('handles rate limit errors', async () => {
      const mockAudioFile = new File(['audio data'], 'test.webm', { type: 'audio/webm' });
      
      mockParseRequest.mockResolvedValue({
        audioFile: mockAudioFile
      });
      mockProcessTranscription.mockRejectedValue(new Error('rate limit exceeded'));

      const request = createMockRequest();
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(429);
      expect(responseData).toEqual({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      });
    });

    it('handles timeout errors', async () => {
      const mockAudioFile = new File(['audio data'], 'test.webm', { type: 'audio/webm' });
      
      mockParseRequest.mockResolvedValue({
        audioFile: mockAudioFile
      });
      mockProcessTranscription.mockRejectedValue(new Error('Transcription timed out after 45 seconds'));

      const request = createMockRequest();
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(408);
      expect(responseData).toEqual({
        success: false,
        error: 'Transcription timed out. Please try with a shorter audio file.'
      });
    });

    it('handles AbortError from timeout', async () => {
      const mockAudioFile = new File(['audio data'], 'test.webm', { type: 'audio/webm' });
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      
      mockParseRequest.mockResolvedValue({
        audioFile: mockAudioFile
      });
      mockProcessTranscription.mockRejectedValue(abortError);

      const request = createMockRequest();
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(408);
      expect(responseData).toEqual({
        success: false,
        error: 'Transcription timed out. Please try with a shorter audio file.'
      });
    });

    it('handles unknown errors', async () => {
      const mockAudioFile = new File(['audio data'], 'test.webm', { type: 'audio/webm' });
      
      mockParseRequest.mockResolvedValue({
        audioFile: mockAudioFile
      });
      mockProcessTranscription.mockRejectedValue('Unknown error'); // Not an Error object

      const request = createMockRequest();
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData).toEqual({
        success: false,
        error: 'Unknown transcription error'
      });
    });
  });
});