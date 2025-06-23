import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { StyleShowcase } from './components/StyleShowcase';
import { FlameShowcase } from './components/FlameShowcase';
import { ChatPage } from './components/ChatPage';
import { MainPage } from './components/MainPage';

function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'showcase' | 'flames' | 'chat' | 'main'>('landing');

  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setCurrentPage('landing')}
          className={`px-4 py-2 rounded-soft text-sm font-medium transition-all duration-300 ${
            currentPage === 'landing'
              ? 'bg-ember text-dark'
              : 'bg-navy/80 text-softwhite hover:bg-ember/20 border border-ember/30'
          }`}
        >
          Landing
        </button>
        <button
          onClick={() => setCurrentPage('showcase')}
          className={`px-4 py-2 rounded-soft text-sm font-medium transition-all duration-300 ${
            currentPage === 'showcase'
              ? 'bg-ember text-dark'
              : 'bg-navy/80 text-softwhite hover:bg-ember/20 border border-ember/30'
          }`}
        >
          Design System
        </button>
        <button
          onClick={() => setCurrentPage('flames')}
          className={`px-4 py-2 rounded-soft text-sm font-medium transition-all duration-300 ${
            currentPage === 'flames'
              ? 'bg-ember text-dark'
              : 'bg-navy/80 text-softwhite hover:bg-ember/20 border border-ember/30'
          }`}
        >
          Flames
        </button>
        <button
          onClick={() => setCurrentPage('chat')}
          className={`px-4 py-2 rounded-soft text-sm font-medium transition-all duration-300 ${
            currentPage === 'chat'
              ? 'bg-ember text-dark'
              : 'bg-navy/80 text-softwhite hover:bg-ember/20 border border-ember/30'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setCurrentPage('main')}
          className={`px-4 py-2 rounded-soft text-sm font-medium transition-all duration-300 ${
            currentPage === 'main'
              ? 'bg-ember text-dark'
              : 'bg-navy/80 text-softwhite hover:bg-ember/20 border border-ember/30'
          }`}
        >
          Main
        </button>
      </nav>

      {/* Page Content */}
      {currentPage === 'landing' && <LandingPage />}
      {currentPage === 'showcase' && <StyleShowcase />}
      {currentPage === 'flames' && <FlameShowcase />}
      {currentPage === 'chat' && <ChatPage />}
      {currentPage === 'main' && <MainPage />}
    </>
  );
}

export default App;