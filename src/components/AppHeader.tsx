'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Settings from './Settings';

interface AppHeaderProps {
  onViewChange?: (view: 'recorder' | 'settings') => void;
}

export default function AppHeader({ onViewChange }: AppHeaderProps) {
  const { user, logout, loading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleSettingsToggle = () => {
    const newShowSettings = !showSettings;
    setShowSettings(newShowSettings);
    onViewChange?.(newShowSettings ? 'settings' : 'recorder');
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await logout();
    } catch (error) {
      console.error('Sign-out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!user) return null;

  return (
    <div className="w-full bg-white border-b border-gray-200 px-2 sm:px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'User'} 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-semibold text-xs sm:text-sm">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
              {user.displayName || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate hidden sm:block">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
          <button
            onClick={handleSettingsToggle}
            className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            {showSettings ? (
              // Back arrow icon when in settings
              <svg className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            ) : (
              // Settings gear icon when in recorder
              <svg className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            <span className="hidden sm:inline">{showSettings ? 'Voice Recorder' : 'Settings'}</span>
          </button>
          
          <button
            onClick={handleSignOut}
            disabled={loading || isSigningOut}
            className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isSigningOut ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-4 sm:w-4 border-b-2 border-gray-700 sm:mr-2"></div>
                <span className="hidden sm:inline ml-2">Signing out...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Sign out</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}