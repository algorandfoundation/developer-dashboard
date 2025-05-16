import React from 'react';
import { ThemeColors } from './types';

interface HeaderProps {
  darkMode: boolean;
  toggleTheme: () => void;
  currentTheme: ThemeColors;
}

const Header: React.FC<HeaderProps> = ({ darkMode, toggleTheme, currentTheme }) => {
  return (
    <div className="relative mb-10">
      {/* Theme Toggle - Positioned Absolutely */}
      <div className="absolute right-0 top-0">
        <div className="flex items-center">
          <span className="mr-2 text-sm" style={{ color: currentTheme.text }}>
            {darkMode ? "Dark" : "Light"}
          </span>
          <label className="inline-flex relative items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only"
              checked={darkMode}
              onChange={toggleTheme}
            />
            <div
              className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                !darkMode ? "bg-gray-300" : ""
              }`}
              style={{
                backgroundColor: darkMode ? "#17cac6" : undefined
              }}
            >
              <div
                className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ease-in-out ${
                  darkMode ? "transform translate-x-5" : ""
                }`}
              ></div>
            </div>
          </label>
        </div>
      </div>

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
