
import React from 'react';
import { Language } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onGoHome: () => void;
  onGoHistory: () => void;
  hasHistory: boolean;
  language: Language;
  onToggleLanguage: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onGoHome, onGoHistory, hasHistory, language, onToggleLanguage }) => {
  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-8 bg-[#fafafa]">
      <header className="mb-12 text-center w-full max-w-xl flex justify-between items-center px-4">
        <button 
          onClick={onToggleLanguage}
          className="text-[10px] text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors w-12 text-left"
          title="Switch Language"
        >
          {language === 'en' ? '中' : 'EN'}
        </button>
        
        <div onClick={onGoHome} className="cursor-pointer group flex-1">
          <h1 className="text-2xl font-light tracking-[0.3em] text-gray-800 uppercase transition-all group-hover:tracking-[0.4em]">Minimalist Lens</h1>
          <p className="text-[10px] text-gray-400 mt-1 font-light uppercase tracking-widest">
            {language === 'en' ? 'Less is more' : '极简，即是自由'}
          </p>
        </div>
        
        <button 
          onClick={onGoHistory}
          className={`p-2 transition-colors w-12 flex justify-end ${hasHistory ? 'text-gray-400 hover:text-gray-900' : 'text-transparent cursor-default'}`}
          disabled={!hasHistory}
          title="View History"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </header>
      <main className="w-full max-w-xl bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 overflow-hidden min-h-[400px]">
        {children}
      </main>
      <footer className="mt-12 text-[10px] text-gray-300 font-light tracking-[0.2em] uppercase">
        {language === 'en' ? 'Embrace the space between things' : '拥抱万物之间的留白'}
      </footer>
    </div>
  );
};

export default Layout;
