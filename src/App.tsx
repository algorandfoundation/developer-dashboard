import React, { useState, useEffect } from 'react';
import DevDashboard from './components/DevDashboard';
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
  
  return (
    <div className="min-h-screen">
      <DevDashboard dataUrl={dataUrl} onThemeChange={handleThemeChange} initialDarkMode={darkMode} />
    </div>
  );
}

export default App;