# Voice Transcription Tool - Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 Browser (Client Side)                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐ │
│  │                     │    │                      │    │                     │ │
│  │    page.tsx         │    │   VoiceRecorder.tsx  │    │   Browser APIs     │ │
│  │                     │    │                      │    │                     │ │
│  │  - Main App Page    │───▶│  - Recording UI      │───▶│  - MediaRecorder    │ │
│  │  - Layout           │    │  - State Display     │    │  - navigator.media  │ │
│  │  - Component Host   │    │  - User Interaction  │    │  - Clipboard API    │ │
│  │                     │    │                      │    │                     │ │
│  └─────────────────────┘    └──────────────────────┘    └─────────────────────┘ │
│                                       │                                         │
│                                       │                                         │
│                   ┌───────────────────┴───────────────────┐                     │
│                   │                                       │                     │
│                   │        useVoiceRecorder.ts            │                     │
│                   │                                       │                     │
│                   │  - State Management (idle/recording/  │                     │
│                   │    processing/transcribing)           │                     │
│                   │  - MediaRecorder Logic                │                     │
│                   │  - Audio Blob Creation                │                     │
│                   │  - API Communication                  │                     │
│                   │  - Error Handling                     │                     │
│                   │                                       │                     │
│                   └───────────────────────────────────────┘                     │
│                                       │                                         │
└───────────────────────────────────────┼─────────────────────────────────────────┘
                                        │
                                        │ HTTP POST /api/transcribe
                                        │ (FormData with audio blob)
                                        │
┌───────────────────────────────────────┼─────────────────────────────────────────┐
│                                       │                                         │
│                            Next.js API Routes (Server Side)                    │
│                                       │                                         │
│  ┌─────────────────────────────────────▼───────────────────────────────────────┐ │
│  │                                                                             │ │
│  │                    /api/transcribe/route.ts                                 │ │
│  │                                                                             │ │
│  │  - Serverless Function (Vercel Edge)                                       │ │
│  │  - File Validation (type, size)                                            │ │
│  │  - OpenAI Client Initialization                                            │ │
│  │  - Audio Processing                                                        │ │
│  │  - Error Handling & Logging                                                │ │
│  │                                                                             │ │
│  └─────────────────────────────────────┬───────────────────────────────────────┘ │
│                                        │                                         │
└────────────────────────────────────────┼─────────────────────────────────────────┘
                                         │
                                         │ OpenAI API Call
                                         │ (Whisper-1 Model)
                                         │
┌────────────────────────────────────────┼─────────────────────────────────────────┐
│                                        │                                         │
│                             External Services                                   │
│                                        │                                         │
│  ┌─────────────────────────────────────▼───────────────────────────────────────┐ │
│  │                                                                             │ │
│  │                        OpenAI Whisper API                                  │ │
│  │                                                                             │ │
│  │  - Model: whisper-1 (Large)                                                │ │
│  │  - Audio Processing & Transcription                                        │ │
│  │  - Response: Text transcript                                               │ │
│  │  - Rate Limiting & Error Handling                                          │ │
│  │                                                                             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Record → Transcribe → UI

### Phase 1: Recording Initiation
```
User Click "Start Recording"
          │
          ▼
┌─────────────────────────┐
│   handleToggleRecording │
│   (VoiceRecorder.tsx)   │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│    startRecording()     │
│  (useVoiceRecorder.ts)  │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ navigator.mediaDevices  │
│   .getUserMedia()       │
│   - Request mic access  │
│   - Create audio stream │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   MediaRecorder API     │
│   - Create recorder     │
│   - Set event handlers  │
│   - Start recording     │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   State Update          │
│   recordingState =      │
│   'recording'           │
└─────────────────────────┘
```

### Phase 2: Recording Process
```
Audio Input (Microphone)
          │
          ▼
┌─────────────────────────┐
│   MediaRecorder         │
│   - Capture audio       │
│   - Create data chunks  │
│   - ondataavailable     │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   Audio Chunks Array    │
│   audioChunksRef.current│
│   - Store blob chunks   │
└─────────────────────────┘
```

### Phase 3: Recording Stop & Processing
```
User Click "Stop Recording"
          │
          ▼
┌─────────────────────────┐
│    stopRecording()      │
│  - Set state to         │
│    'processing'         │
│  - Call recorder.stop() │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   mediaRecorder.onstop  │
│   - Combine audio chunks│
│   - Create final blob   │
│   - Set audioBlob state │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  Audio Blob Created     │
│  - Type: audio/webm     │
│  - Size: ~35KB          │
│  - Codecs: opus         │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ Auto-trigger            │
│ transcribeAudioBlob()   │
└─────────────────────────┘
```

### Phase 4: Transcription API Call
```
transcribeAudioBlob(blob)
          │
          ▼
┌─────────────────────────┐
│   State Update          │
│   recordingState =      │
│   'transcribing'        │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   FormData Creation     │
│   - Append audio blob   │
│   - Set filename        │
│   - Set content type    │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   HTTP POST Request     │
│   fetch('/api/transcribe│
│   - Method: POST        │
│   - Body: FormData      │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   Server API Handler    │
│   (/api/transcribe)     │
│   - Validate file       │
│   - Check API key       │
│   - Initialize OpenAI   │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   OpenAI API Call       │
│   openai.audio          │
│   .transcriptions       │
│   .create()             │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   Whisper Processing    │
│   - Model: whisper-1    │
│   - Audio → Text        │
│   - Return transcript   │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   API Response          │
│   {                     │
│     success: true,      │
│     transcript: "text", │
│     duration: 3705      │
│   }                     │
└─────────────────────────┘
```

### Phase 5: UI Update & Display
```
API Response Received
          │
          ▼
┌─────────────────────────┐
│   Response Processing   │
│   - Check success       │
│   - Extract transcript  │
│   - Handle errors       │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   State Updates         │
│   - transcript = text   │
│   - recordingState =    │
│     'idle'              │
│   - error = null        │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   React Re-render       │
│   - Hide loading states │
│   - Show transcript box │
│   - Enable copy button  │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│   User Interaction      │
│   - Read transcript     │
│   - Copy to clipboard   │
│   - Start new recording │
└─────────────────────────┘
```

## Component Interaction Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    page.tsx     │    │ VoiceRecorder   │    │useVoiceRecorder │
│                 │    │     .tsx        │    │     .ts         │
│  - App Layout   │───▶│                 │───▶│                 │
│  - Component    │    │  - UI Layer     │    │  - Logic Layer  │
│    Container    │    │  - Event        │    │  - State Mgmt   │
│                 │    │    Handlers     │    │  - API Calls    │
│                 │    │  - Display      │    │  - MediaRecorder│
└─────────────────┘    │    Logic        │    │    Integration  │
                       │                 │    │                 │
                       └─────────────────┘    └─────────────────┘
                                │                       │
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Browser APIs  │    │   Next.js API   │
                       │                 │    │     Routes      │
                       │  - MediaRecorder│    │                 │
                       │  - Clipboard    │    │  - Serverless   │
                       │  - Audio Stream │    │    Functions    │
                       │                 │    │  - OpenAI SDK   │
                       └─────────────────┘    └─────────────────┘
```

## State Management Flow

```
Recording States:
┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────┐
│  idle   │───▶│  recording  │───▶│ processing  │───▶│transcribing  │───▶│  idle   │
└─────────┘    └─────────────┘    └─────────────┘    └──────────────┘    └─────────┘
     ▲                                                                         │
     │                                                                         │
     └─────────────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
Error Sources:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Microphone     │    │   API Route     │    │   OpenAI API    │
│  Permission     │    │   Validation    │    │   Errors        │
│  - Denied       │    │   - File type   │    │   - Rate limit  │
│  - Not found    │    │   - File size   │    │   - Quota       │
│  - Hardware     │    │   - API key     │    │   - Network     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Error State Management                       │
│                                                                 │
│  - Set error message in state                                   │
│  - Reset recordingState to 'idle'                              │
│  - Display error to user                                       │
│  - Log error for debugging                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

This architecture provides a clear separation of concerns with robust error handling and state management throughout the entire voice-to-text pipeline.