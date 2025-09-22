import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import DevDashboard from './components/DevDashboard';
import { theme } from './components/theme';
import FAQ from './components/FAQ';
import './App.css';

const NavTabs = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(document.body.classList.contains('dark-mode'));

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (newDarkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.body.classList.remove('dark');
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string): boolean => location.pathname === path;

  return (
    <nav className="bg-white dark:bg-[#001324] shadow-md fixed w-full top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img
                className="h-14 w-auto"
                src={darkMode ? "/algorand_dark_theme.png" : "/algorand_light_theme.png"} 
                alt="Algorand"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/') 
                  ? 'bg-[#2d2df1] dark:bg-[#17cac6] text-[#ffffff] dark:text-[#001324] shadow-md' 
                  : 'text-[#001324] dark:text-[#ffffff] hover:text-[#001324] dark:hover:text-[#ffffff] hover:bg-[#e5e7e9] dark:hover:bg-[#17cac6]/20'
              }`}
            >
              Leaderboard
            </Link>
            <Link
              to="/faq"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/faq') 
                  ? 'bg-[#2d2df1] dark:bg-[#17cac6] text-[#ffffff] dark:text-[#001324] shadow-md' 
                  : 'text-[#001324] dark:text-[#ffffff] hover:text-[#001324] dark:hover:text-[#ffffff] hover:bg-[#e5e7e9] dark:hover:bg-[#17cac6]/20'
              }`}
            >
              FAQ
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleTheme}
              className="mr-2 p-2 rounded-lg text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-200"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-[#001324] shadow-lg transition-opacity duration-200">
          <div className="px-2 pt-2 pb-3 space-y-2 sm:px-3">
            <Link
              to="/"
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/') 
                  ? 'bg-[#2d2df1] dark:bg-[#17cac6] text-[#ffffff] dark:text-[#001324] shadow-md' 
                  : 'text-[#001324] dark:text-[#ffffff] hover:text-[#001324] dark:hover:text-[#ffffff] hover:bg-[#e5e7e9] dark:hover:bg-[#17cac6]/20'
              }`}
              onClick={closeMobileMenu}
            >
              Leaderboard
            </Link>
            <Link
              to="/faq"
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/faq') 
                  ? 'bg-[#2d2df1] dark:bg-[#17cac6] text-[#ffffff] dark:text-[#001324] shadow-md' 
                  : 'text-[#001324] dark:text-[#ffffff] hover:text-[#001324] dark:hover:text-[#ffffff] hover:bg-[#e5e7e9] dark:hover:bg-[#17cac6]/20'
              }`}
              onClick={closeMobileMenu}
            >
              FAQ
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

const App = () => {
  const [darkMode, setDarkMode] = useState(document.body.classList.contains('dark-mode'));
  
  // Initialize theme on mount
  useEffect(() => {
    const isDarkMode = document.body.classList.contains('dark-mode');
    if (isDarkMode) {
      document.body.classList.add('dark');
    }
    setDarkMode(isDarkMode);
  }, []);
  
  return (
    <Router>
      <div className={`min-h-screen bg-[#ffffff] dark:bg-[#001324]${darkMode ? 'dark' : ''}`}>
        <NavTabs />
        <main className="container mx-auto py-8 mt-16">
          <Routes>
            <Route path="/" element={<DevDashboard showActiveDevs={false} showLeaderboard={true} />} />
            <Route path="/faq" element={<FAQ />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;