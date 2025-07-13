'use client';

import { useAuth } from "@/contexts/AuthContext";
import VoiceRecorder from "@/components/VoiceRecorder";
import GoogleSignIn from "@/components/GoogleSignIn";
import UserProfile from "@/components/UserProfile";

export default function Home() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in page if not authenticated
  if (!user) {
    return <GoogleSignIn />;
  }

  // Show main app if authenticated
  return (
    <div className="min-h-screen bg-gray-50">
      <UserProfile />
      
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Voice Transcription Tool
            </h1>
            <p className="text-xl text-gray-600">
              Speak naturally, get clean text instantly
            </p>
          </header>

          <main className="bg-white rounded-lg shadow-lg p-8">
            <VoiceRecorder />
          </main>
        </div>
      </div>
    </div>
  );
}
