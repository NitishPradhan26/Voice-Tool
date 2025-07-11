# Voice Transcription Tool

A powerful web application that converts speech to text using OpenAI's Whisper-Large model with grammar cleanup and smart correction features.

## Features

- **Real-time Voice Recording**: Browser-based audio recording with visual feedback
- **High-Accuracy Transcription**: Powered by OpenAI Whisper-Large for superior speech-to-text accuracy
- **Grammar Cleanup**: Intelligent text correction and formatting (planned)
- **Smart Corrections**: Learn from user corrections and auto-apply them (planned)
- **Google Authentication**: Secure user authentication with Google Sign-In (planned)
- **User Preferences**: Persistent settings and correction dictionary (planned)

## Tech Stack

- **Frontend**: React + Next.js (TypeScript)
- **Backend**: Next.js API routes (serverless functions)
- **AI/ML**: OpenAI Whisper-Large for transcription
- **Authentication**: Firebase Auth (planned)
- **Database**: Firestore (planned)
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd voice-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Add your OpenAI API key to `.env.local`:
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   Visit [http://localhost:3000](http://localhost:3000) in your browser

## OpenAI Whisper Setup

### Getting Your API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Copy the key and add it to your `.env.local` file

### Whisper Model Configuration

The application uses OpenAI's `whisper-1` model (Whisper-Large) which provides:

- **High accuracy** for English speech recognition
- **Support for multiple audio formats** (webm, wav, mp3, m4a, ogg)
- **File size limit** of 25MB per audio file
- **Automatic noise reduction** and echo cancellation

### Cost Considerations

- **Pricing**: $0.006 per minute of audio
- **Example**: 10 minutes of audio = $0.06
- **Optimization**: Audio is automatically optimized for quality vs. file size

## Google API Integration (Planned)

### Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Follow the setup wizard

2. **Enable Authentication**
   ```bash
   # Install Firebase SDK
   npm install firebase
   ```

3. **Configure Google Sign-In**
   - In Firebase Console, go to Authentication > Sign-in method
   - Enable "Google" provider
   - Add your domain to authorized domains

4. **Add Firebase Config**
   ```javascript
   // firebase.config.js
   export const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     // ... other config
   };
   ```

### Firestore Database Setup

1. **Create Firestore Database**
   - In Firebase Console, go to Firestore Database
   - Create database in production mode
   - Choose your region

2. **Security Rules**
   ```javascript
   // firestore.rules
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

## Deployment

### Vercel Deployment (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**
   In Vercel Dashboard:
   - Go to your project settings
   - Add environment variables:
     - `OPENAI_API_KEY`
     - `FIREBASE_CONFIG` (when Firebase is integrated)

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional (for future features)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

## Usage

1. **Record Audio**
   - Click the microphone button
   - Speak clearly into your microphone
   - Click "Stop Recording" when finished

2. **View Transcript**
   - The audio is automatically transcribed
   - View the cleaned text in the transcript area
   - Click "Copy" to copy to clipboard

3. **Future Features**
   - Grammar corrections will be highlighted
   - Click on words to see suggestions
   - Corrections will be saved for future use

## Development

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── transcribe/
│   │       └── route.ts          # OpenAI Whisper API endpoint
│   ├── page.tsx                  # Main application page
│   └── layout.tsx               # App layout
├── components/
│   └── VoiceRecorder.tsx        # Main voice recording component
├── hooks/
│   └── useVoiceRecorder.ts      # Audio recording and transcription logic
└── types/                       # TypeScript type definitions
```

### Key Components

- **VoiceRecorder**: Main UI component for recording and displaying transcripts
- **useVoiceRecorder**: Custom hook handling MediaRecorder API and transcription
- **API Routes**: Serverless functions for OpenAI integration





