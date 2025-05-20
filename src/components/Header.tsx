import React from 'react';
import { ThemeColors } from './types';

interface HeaderProps {
  currentTheme: ThemeColors;
}

const Header: React.FC<HeaderProps> = ({ currentTheme }) => {
  const darkMode = document.body.classList.contains('dark-mode');

  return (
    <div className="relative mb-10">
      <div className="flex flex-col items-center text-center pt-2">
        <img 
          src={darkMode ? "/algorand_dark_theme.png" : "/algorand_light_theme.png"} 
          alt="Algorand Logo" 
          className="h-28 md:h-32 w-auto mb-4"
          crossOrigin="anonymous"
        />
        <h1 className="text-2xl md:text-4xl font-bold mb-3" style={{ color: currentTheme.primary }}>
          Developer Dashboard & Leaderboard
        </h1>
        <p className="mt-2 text-sm md:text-base max-w-2xl text-center italic" style={{ color: currentTheme.text }}>
          An active dev is someone who has contributed to one of the Algorand related repos 
          (based on <a 
            href="https://github.com/electric-capital" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: currentTheme.primary, textDecoration: "underline" }}
          >Electric Capital</a> set of repos) during the last 30 days.
        </p>
      </div>
    </div>
  );
};

export default Header;
