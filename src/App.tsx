import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import DevDashboard from './components/DevDashboard';
import FAQ from './components/FAQ';
import './App.css';

function App() {
  // Use the actual S3 bucket URL that you've updated CORS for
  const dataUrl = 'https://electric-capital-af-report-bucket.s3.eu-west-1.amazonaws.com/active_devs.json';
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  // Handle theme changes from the dashboard
  const handleThemeChange = (isDarkMode: boolean) => {
    setDarkMode(isDarkMode);
  };
  
  // Apply the theme class to the body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const NavTabs = () => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    return (
      <div className="flex space-x-1">
        <Link
          to="/"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive('/') 
              ? 'bg-[#2d2df1] dark:bg-[#17cac6] text-white shadow-md' 
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#17cac6]/20'
          }`}
        >
          Active Devs
        </Link>
        <Link
          to="/leaderboard"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive('/leaderboard') 
              ? 'bg-[#2d2df1] dark:bg-[#17cac6] text-white shadow-md' 
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#17cac6]/20'
          }`}
        >
          Leaderboard
        </Link>
        <Link
          to="/faq"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive('/faq') 
              ? 'bg-[#2d2df1] dark:bg-[#17cac6] text-white shadow-md' 
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#17cac6]/20'
          }`}
        >
          FAQ
        </Link>
      </div>
    );
  };
  
  return (
    <Router>
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <nav className="bg-white dark:bg-[#001324] shadow-md transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <NavTabs />
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => handleThemeChange(!darkMode)}
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
            </div>
          </div>
        </nav>

        <Routes>
          <Route 
            path="/" 
            element={<DevDashboard dataUrl={dataUrl} showActiveDevs={true} showLeaderboard={false} />} 
          />
          <Route 
            path="/leaderboard" 
            element={<DevDashboard dataUrl={dataUrl} showActiveDevs={false} showLeaderboard={true} />} 
          />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;