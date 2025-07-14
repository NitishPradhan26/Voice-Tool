'use client';

import { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import VoiceRecorder from "@/components/VoiceRecorder";
import GoogleSignIn from "@/components/GoogleSignIn";
import AppHeader from "@/components/AppHeader";
import Settings from "@/components/Settings";

export default function Home() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'recorder' | 'settings'>('recorder');

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
      <AppHeader onViewChange={setCurrentView} />
      
      <div className="py-6 sm:py-12">
        <div className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8">
          {currentView === 'recorder' && (
            <header className="text-center mb-6 sm:mb-12">
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
                Voice Transcription Tool
              </h1>
              <p className="text-lg sm:text-xl text-gray-600">
                Speak naturally, get clean text instantly
              </p>
            </header>
          )}

          <main className={currentView === 'settings' ? "" : "bg-white rounded-lg shadow-lg p-3 sm:p-8"}>
            {currentView === 'settings' ? <Settings /> : <VoiceRecorder />}
          </main>
        </div>
      </div>
    </div>
  );
}

