import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { LandingPage } from './components/LandingPage';
import { MainPage } from './components/MainPage';
import { DeviceWarning } from './components/DeviceWarning';

// Main App Content Component
const AppContent: React.FC = () => {
  const { user, loading, error, clearAuthState } = useAuth();

  // Show error state if there's an authentication error
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-carmine rounded-full mx-auto flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-carmine mb-4">Authentication Error</h2>
          <p className="text-ash mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={clearAuthState}
              className="w-full px-6 py-2 bg-ember text-dark rounded-soft hover:bg-carmine transition-colors"
            >
              Clear Cache & Restart
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-2 bg-navy text-softwhite border border-ember rounded-soft hover:bg-deepblue transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state with timeout indicator and manual override
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-ember rounded-full mx-auto animate-pulse mb-4" />
          <p className="text-ash mb-2">Loading your hearth...</p>
          <div className="text-xs text-ash/60 mb-6">
            If this takes too long, try refreshing the page
          </div>
          
          {/* Emergency override button */}
          <div className="space-y-3">
            <button
              onClick={clearAuthState}
              className="px-4 py-2 bg-carmine text-softwhite rounded-soft hover:bg-carmine/80 transition-colors text-sm"
            >
              Clear Cache & Continue
            </button>
            <div className="text-xs text-ash/40">
              Click if stuck loading for more than 10 seconds
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, show main app (no navigation menu)
  if (user) {
    return <MainPage />;
  }

  // If user is not authenticated, show landing page
  return <LandingPage />;
};

// Main App Component with Auth Provider
function App() {
  return (
    <AuthProvider>
      <DeviceWarning />
      <AppContent />
    </AuthProvider>
  );
}

export default App;