import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';
import { DevDataPoint, ThemeColors } from './types';

interface ActiveDevsProps {
  data: DevDataPoint[];
  displayData: DevDataPoint[];
  dateRange: [Date, Date];
  sliderValue: number;
  currentTheme: ThemeColors;
  handleSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isMonthEnd: (dateStr: string) => boolean;
}

const ActiveDevs: React.FC<ActiveDevsProps> = ({
  data,
  displayData,
  dateRange,
  sliderValue,
  currentTheme,
  handleSliderChange,
  isMonthEnd
}) => {
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  const [darkMode, setDarkMode] = useState<boolean>(document.body.classList.contains('dark-mode'));
  
  // Track window width for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setDarkMode(document.body.classList.contains('dark-mode'));
        }
      });
    });

    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, []);
  
  // Determine if we should show data labels based on screen width and slider value
  const shouldShowLabels = () => {
    // For mobile (under 768px), only show labels when slider is at least 90%
    if (windowWidth < 768) {
      return sliderValue <= 10;
    } 
    // For larger screens, show labels when slider is at least 60%
    return sliderValue <= 50;
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-lg md:text-xl font-bold text-center w-full md:w-auto" style={{ color: currentTheme.primary }}>Active Developers Chart</h2>
      </div>
      
      {/* Chart */}
      <div className="mb-6 md:mb-8 p-3 md:p-4 rounded-lg" style={{ backgroundColor: currentTheme.chartBg }}>
        {/* Main Chart */}
        <ResponsiveContainer width="100%" height={300} minHeight={300}>
          <LineChart
            data={displayData}
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#2d3748" : "#e2e8f0"} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: currentTheme.text }}
              stroke={currentTheme.text}
              interval="preserveStartEnd"
              label={{
                value: 'Date',
                position: 'centerBottom',
                offset: 0,
                dy: 20,
                fill: currentTheme.text,
                fontSize: 12
              }}
            />
            <YAxis
              label={{ 
                value: 'Active Devs', 
                angle: -90, 
                position: 'centerLeft',
                fill: currentTheme.text,
                offset: 0,
                dx: -15,
                fontSize: 12
              }}
              tick={{ fontSize: 10, fill: currentTheme.text }}
              stroke={currentTheme.text}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: currentTheme.chartBg, 
                borderColor: currentTheme.primary,
                color: currentTheme.text
              }}
              labelStyle={{ color: currentTheme.primary }}
            />
            <Legend 
              wrapperStyle={{ 
                color: currentTheme.text,
                marginTop: '5px',
                marginBottom: '-15px',
                fontSize: 12
              }} 
            />
            <Line
              type="monotone"
              dataKey="activeDevs"
              stroke={currentTheme.primary}
              dot={false}
              name="Active Developers"
              strokeWidth={2}
            />
            {/* Add reference dots and labels for month-end points */}
            {shouldShowLabels() && displayData
              .filter(point => isMonthEnd(point.date))
              .map((point, index) => (
                <ReferenceDot 
                  key={`month-end-${index}`} 
                  x={point.date} 
                  y={point.activeDevs} 
                  r={3} 
                  fill={darkMode ? "#2d2df1" : "#001324"}
                  label={{
                    value: point.activeDevs,
                    position: "top",
                    fill: darkMode ? "#ffffff" : "#001324",
                    fontSize: 12,
                    fontWeight: "bold",
                    dy: -5
                  }}
                />
              ))
            }
          </LineChart>
        </ResponsiveContainer>
        
        {/* Date-based Slider Control */}
        <div className="mt-6">
          <p className="text-sm mb-2" style={{ color: currentTheme.text }}>
            Select date range:
          </p>
          
          <div className="px-4 py-2" style={{ backgroundColor: darkMode ? '#1a2535' : '#f1f5f9', borderRadius: '8px' }}>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={sliderValue}
              onChange={handleSliderChange}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{ 
                backgroundColor: darkMode ? "#1e3a5f" : "#d1d5db",
                accentColor: currentTheme.primary,
                WebkitAppearance: "none",
                height: "12px",
                borderRadius: "6px",
                // Reversed gradient: inactive on left, active on right
                background: `linear-gradient(to left, ${currentTheme.primary} 0%, ${currentTheme.primary} ${sliderValue}%, ${currentTheme.buttonInactive} ${sliderValue}%, ${currentTheme.buttonInactive} 100%)`,
                // Transform the slider to move the thumb to start from the left
                direction: "rtl",
              }}
            />
            
            <div className="flex justify-between mt-1 text-xs" style={{ color: currentTheme.text }}>
              <span>{data.length > 0 ? new Date(data[0].date).toLocaleDateString() : ''}</span>
              <span>{data.length > 0 ? new Date(data[data.length - 1].date).toLocaleDateString() : ''}</span>
            </div>
          </div>
          
          {/* Display current selection and label visibility hint */}
          {dateRange && (
            <div className="mt-2 text-xs text-center" style={{ color: currentTheme.text }}>
              <div>
                Showing data from: {data.length > 0 ? new Date(displayData[0]?.date || data[0].date).toLocaleDateString() : ''}
              </div>
              {!shouldShowLabels() && (
                <div className="mt-1 italic">
                  {windowWidth < 768 ? 
                    "Move slider to the right to see data labels" : 
                    "Move slider to the right to see data labels"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveDevs;
