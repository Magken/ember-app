import React from 'react';
import { LandingHero } from './landing/LandingHero';
import { AuthSection } from './landing/AuthSection';
import { AboutSection } from './landing/AboutSection';

export const LandingPage: React.FC = () => {
  // Scroll to auth section
  const scrollToAuth = () => {
    const authSection = document.getElementById('auth-section');
    if (authSection) {
      authSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAuthSuccess = () => {
    // The AuthProvider will handle the redirect automatically
    console.log('Authentication successful');
  };

  return (
    <div className="min-h-screen bg-[var(--color-dark)] text-[var(--color-white)]">
      <LandingHero onScrollToAuth={scrollToAuth} />
      <AuthSection onSuccess={handleAuthSuccess} />
      <AboutSection />
    </div>
  );
};