import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
  Brush
} from 'recharts';

// TypeScript interfaces
interface DevDataPoint {
  date: string;
  activeDevs: number;
}

interface CommitEntry {
  date: string;
  dev: string;
  repo: string;
  commits: number;
}

interface AggregatedCommit {
  dev: string;
  repo: string;
  totalCommits: number;
}

interface DevTotalCommits {
  dev: string;
  totalCommits: number;
}

type RepoFilter = 'all' | 'foundation' | 'core' | 'ecosystem';

interface DashboardProps {
  dataUrl: string; // URL to your S3 JSON file
  onThemeChange?: (isDarkMode: boolean) => void; // Optional callback for theme changes
  initialDarkMode?: boolean; // Optional initial dark mode state
}

export default function DevDashboard({ dataUrl, onThemeChange, initialDarkMode = false }: DashboardProps) {
  // State for our data, slider, and theme
  const [data, setData] = useState<DevDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date, Date]>([new Date(), new Date()]);
  const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(initialDarkMode);
  const [commitData, setCommitData] = useState<AggregatedCommit[]>([]);
  const [devLeaderboardData, setDevLeaderboardData] = useState<DevTotalCommits[]>([]);
  const [commitLoading, setCommitLoading] = useState<boolean>(true);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'last30d' | 'last90d' | 'allTime'>('last30d');
  const [repoFilter, setRepoFilter] = useState<RepoFilter>('all');
  const [parsedData, setParsedData] = useState<CommitEntry[]>([]);
  const [sliderValue, setSliderValue] = useState<number>(70);
  const [maxDate, setMaxDate] = useState<Date | null>(null);
  const [devFilter, setDevFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'dev' | 'repo' | 'commits'>('commits');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Theme colors
  const theme = {
    light: {
      bg: "#ffffff",
      primary: "#2d2df1",
      secondary: "#001324",
      text: "#333333",
      chartBg: "#f9fafb",
      controlsBg: "#f3f4f6",
      tableBorder: "#e5e7eb",
      tableHeader: "#f3f4f6",
      tableRowEven: "#ffffff",
      tableRowOdd: "#f9fafb",
      buttonActive: "#2d2df1",
      buttonInactive: "#94a3b8",
      buttonActiveText: "#ffffff"
    },
    dark: {
      bg: "#001324",
      primary: "#17cac6",
      secondary: "#ffffff",
      text: "#e5e7eb",
      chartBg: "#0a192f",
      controlsBg: "#0f2942",
      tableBorder: "#1e3a5f",
      tableHeader: "#0f2942",
      tableRowEven: "#0a192f",
      tableRowOdd: "#112240",
      buttonActive: "#17cac6",
      buttonInactive: "#475569",
      buttonActiveText: "#ffffff"
    }
  };

  const currentTheme = darkMode ? theme.dark : theme.light;

  // Process data based on time filter
  const processDataByTimeFilter = (allData: CommitEntry[], filter: 'last30d' | 'last90d' | 'allTime', maxDateValue: Date | null) => {
    if (!maxDateValue || allData.length === 0) return { devs: [], commits: [] };
    
    // Filter out 'forosuru' user and filter data based on time range if needed
    let filteredData = allData.filter(entry => entry.dev !== 'forosuru');
    
    if (filter === 'last30d') {
      filteredData = filteredData.filter(entry => {
        const entryDate = new Date(entry.date);
        const cutoffDate = new Date(maxDateValue);
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        return entryDate >= cutoffDate && entryDate <= maxDateValue;
      });
    } else if (filter === 'last90d') {
      filteredData = filteredData.filter(entry => {
        const entryDate = new Date(entry.date);
        const cutoffDate = new Date(maxDateValue);
        cutoffDate.setDate(cutoffDate.getDate() - 90);
        return entryDate >= cutoffDate && entryDate <= maxDateValue;
      });
    }
    // No additional filtering needed for 'allTime'
    
    // Group by dev and repo
    const byDevAndRepo: Record<string, AggregatedCommit> = {};
    filteredData.forEach(entry => {
      const key = `${entry.dev}|||${entry.repo}`;
      if (!byDevAndRepo[key]) {
        byDevAndRepo[key] = {
          dev: entry.dev,
          repo: entry.repo,
          totalCommits: 0
        };
      }
      byDevAndRepo[key].totalCommits += entry.commits;
    });
    
    // Group just by dev
    const byDev: Record<string, DevTotalCommits> = {};
    filteredData.forEach(entry => {
      if (!byDev[entry.dev]) {
        byDev[entry.dev] = {
          dev: entry.dev,
          totalCommits: 0
        };
      }
      byDev[entry.dev].totalCommits += entry.commits;
    });
    
    // Sort both sets
    const sortedCommits = Object.values(byDevAndRepo).sort((a, b) => b.totalCommits - a.totalCommits);
    const sortedDevs = Object.values(byDev).sort((a, b) => b.totalCommits - a.totalCommits);
    
    return { devs: sortedDevs, commits: sortedCommits };
  };

  // Handle time filter change
  const handleTimeFilterChange = (filter: 'last30d' | 'last90d' | 'allTime') => {
    setTimeFilter(filter);
    const processedData = processDataByTimeFilter(parsedData, filter, maxDate);
    setDevLeaderboardData(processedData.devs);
    setCommitData(processedData.commits);
  };

  // Fetch commit data from CSV
  useEffect(() => {
    const fetchCommitData = async () => {
      try {
        setCommitLoading(true);
        const csvUrl = "https://electric-capital-af-report-bucket.s3.eu-west-1.amazonaws.com/commits_leaderboard.csv";
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const csvText = await response.text();
        // Parse CSV into array of objects
        const rows = csvText.split('\n');
        const headers = rows[0].split(',');
        
        const parsed: CommitEntry[] = rows.slice(1).map(row => {
          const values = row.split(',');
          return {
            date: values[0]?.trim() || '',
            dev: values[1]?.trim() || '',
            repo: values[2]?.trim() || '',
            commits: parseInt(values[3]?.trim() || '0', 10)
          };
        }).filter(entry => entry.date && entry.dev && entry.repo);
        
        // Find max date in the data
        const dates = parsed
          .map(entry => new Date(entry.date))
          .filter(date => !isNaN(date.getTime()));
        
        if (dates.length === 0) {
          throw new Error("No valid dates found in data");
        }
        
        const maxDateValue = new Date(Math.max(...dates.map(date => date.getTime())));
        setMaxDate(maxDateValue);
        setParsedData(parsed);
        
        // Process the data
        const processedData = processDataByTimeFilter(parsed, timeFilter, maxDateValue);
        setDevLeaderboardData(processedData.devs);
        setCommitData(processedData.commits);
      } catch (err) {
        setCommitError("Error fetching commit data.");
        console.error("Error fetching commit data:", err);
      } finally {
        setCommitLoading(false);
      }
    };

    fetchCommitData();
  }, []);

  // Fetch data from S3
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(dataUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const rawData = await response.json();
        
        // Transform the JSON from {date: count} format to array format
        const formattedData: DevDataPoint[] = Object.keys(rawData).map(date => ({
          date,
          activeDevs: rawData[date]
        }));
        
        // Sort by date
        formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setData(formattedData);
        
        // Set initial date range based on the data
        if (formattedData.length > 0) {
          const startDate = new Date(formattedData[0].date);
          const endDate = new Date(formattedData[formattedData.length - 1].date);
          setDateRange([startDate, endDate]);
        }
      } catch (err) {
        setError("Error fetching data. Please check your URL and try again.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dataUrl]);

  const filteredData = () => {
    if (data.length === 0) return [];
    
    // Calculate cutoff date based on slider value (0-100%)
    const totalTimespan = dateRange[1].getTime() - dateRange[0].getTime();
    const cutoffTime = dateRange[0].getTime() + (totalTimespan * (sliderValue / 100));
    
    // Filter data to only include points after the cutoff date
    return data.filter(point => new Date(point.date).getTime() >= cutoffTime);
  };

  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderValue(parseFloat(e.target.value));
  };

  // Identify month-end data points
  const getMonthEndDataPoints = (dataPoints: DevDataPoint[]) => {
    if (dataPoints.length === 0) return [];
    
    const monthEndPoints: DevDataPoint[] = [];
    
    // Sort data by date
    const sortedData = [...dataPoints].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    for (let i = 0; i < sortedData.length; i++) {
      const currentDate = new Date(sortedData[i].date);
      
      // Check if this is the last day of the month
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const isMonthEnd = nextDay.getMonth() !== currentDate.getMonth();
      
      // Add to month-end points if it's the last day of month
      // or if it's the last point in our dataset
      if (isMonthEnd || i === sortedData.length - 1) {
        monthEndPoints.push(sortedData[i]);
      }
    }
    
    return monthEndPoints;
  };

  // Toggle theme
  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (onThemeChange) {
      onThemeChange(newDarkMode);
    }
  };
  
  // Sync with external theme changes
  useEffect(() => {
    if (darkMode !== initialDarkMode) {
      setDarkMode(initialDarkMode);
    }
  }, [initialDarkMode]);

  // Filter commits by repository type
  const getFilteredCommitData = () => {
    switch(repoFilter) {
      case 'foundation':
        return commitData.filter(entry => entry.repo.startsWith('algorandfoundation/'));
      case 'core':
        return commitData.filter(entry => entry.repo.startsWith('algorand/'));
      case 'ecosystem':
        return commitData.filter(entry => 
          !entry.repo.startsWith('algorandfoundation/') && 
          !entry.repo.startsWith('algorand/')
        );
      case 'all':
      default:
        return commitData;
    }
  };

  // Get filtered and sorted commit data
  const getFilteredAndSortedCommitData = () => {
    // First apply repo filter
    let filteredData = getFilteredCommitData();
    
    // Then apply developer filter if it exists
    if (devFilter.trim()) {
      const searchTerm = devFilter.toLowerCase().trim();
      filteredData = filteredData.filter(entry => 
        entry.dev.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort the data
    return [...filteredData].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'dev') {
        comparison = a.dev.localeCompare(b.dev);
      } else if (sortBy === 'repo') {
        comparison = a.repo.localeCompare(b.repo);
      } else { // commits
        comparison = a.totalCommits - b.totalCommits;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  // Handle sort change
  const handleSortChange = (columnName: 'dev' | 'repo' | 'commits') => {
    if (sortBy === columnName) {
      // Toggle sort order if clicking the same column
      setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to descending order
      setSortBy(columnName);
      setSortOrder('desc');
    }
  };

  // Check if a date is at the end of a month
  const isMonthEnd = (dateStr: string): boolean => {
    const date = new Date(dateStr);
    // Create a new date for the next day
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    
    // If the month changes, this was the end of a month
    return nextDay.getMonth() !== date.getMonth();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: currentTheme.bg }}>
        <div className="text-xl" style={{ color: currentTheme.primary }}>Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: currentTheme.bg }}>
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  const displayData = filteredData();
  
  return (
    <div className="p-3 md:p-6 mx-auto w-full rounded-lg shadow-lg" style={{ backgroundColor: currentTheme.bg }}>
      {/* Header with Algorand Logo */}
      <div className="relative mb-10">
        {/* Theme Toggle - Positioned Absolutely */}
        <div className="absolute right-0 top-0">
          <button 
            onClick={toggleTheme}
            className="px-4 py-2 rounded-lg font-medium text-sm flex items-center"
            style={{ 
              backgroundColor: currentTheme.controlsBg,
              color: currentTheme.secondary
            }}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <div className="flex flex-col items-center text-center pt-2">
          <img 
            src={darkMode ? "/algorand_dark_theme.png" : "/algorand_light_theme.png"} 
            alt="Algorand Logo" 
            className="h-20 md:h-24 w-auto mb-4"
          />
          <h1 className="text-2xl md:text-4xl font-bold mb-3" style={{ color: currentTheme.primary }}>
            Developer Dashboard
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
            {displayData
              .filter(point => isMonthEnd(point.date))
              .map((point, index) => (
                <ReferenceDot 
                  key={`month-end-${index}`} 
                  x={point.date} 
                  y={point.activeDevs} 
                  r={3} 
                  fill= {darkMode ? "#2d2df1" : "#001324"}
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
              onChange={(e) => setSliderValue(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{ 
                backgroundColor: darkMode ? "#1e3a5f" : "#d1d5db",
                accentColor: currentTheme.primary,
                WebkitAppearance: "none",
                height: "12px",
                borderRadius: "6px",
                background: `linear-gradient(to right, ${currentTheme.primary} 0%, ${currentTheme.primary} ${sliderValue}%, ${currentTheme.buttonInactive} ${sliderValue}%, ${currentTheme.buttonInactive} 100%)`,
              }}
            />
            
            <div className="flex justify-between mt-1 text-xs" style={{ color: currentTheme.text }}>
              <span>{data.length > 0 ? new Date(data[0].date).toLocaleDateString() : ''}</span>
              <span>{data.length > 0 ? new Date(data[data.length - 1].date).toLocaleDateString() : ''}</span>
            </div>
          </div>
          
          {/* Display current selection */}
          {dateRange && (
            <div className="mt-2 text-xs text-center" style={{ color: currentTheme.text }}>
              Showing data from: {data.length > 0 ? new Date(displayData[0]?.date || data[0].date).toLocaleDateString() : ''}
            </div>
          )}
        </div>
      </div>
      
      {/* Developer Leaderboard */}
      <div className="mt-6 md:mt-8 p-3 md:p-4 rounded-lg" style={{ backgroundColor: currentTheme.chartBg }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
          <h2 className="text-base md:text-lg font-semibold" style={{ color: currentTheme.primary }}>
            Developer Leaderboard
          </h2>
          
          {/* Time period toggle buttons */}
          <div className="flex rounded-lg overflow-hidden">
            <button
              onClick={() => handleTimeFilterChange('last30d')}
              className="px-3 py-1 text-xs md:text-sm font-medium"
              style={{ 
                backgroundColor: timeFilter === 'last30d' ? currentTheme.buttonActive : currentTheme.buttonInactive,
                color: timeFilter === 'last30d' ? currentTheme.buttonActiveText : currentTheme.text,
              }}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handleTimeFilterChange('last90d')}
              className="px-3 py-1 text-xs md:text-sm font-medium"
              style={{ 
                backgroundColor: timeFilter === 'last90d' ? currentTheme.buttonActive : currentTheme.buttonInactive,
                color: timeFilter === 'last90d' ? currentTheme.buttonActiveText : currentTheme.text,
              }}
            >
              Last 90 Days
            </button>
            <button
              onClick={() => handleTimeFilterChange('allTime')}
              className="px-3 py-1 text-xs md:text-sm font-medium"
              style={{ 
                backgroundColor: timeFilter === 'allTime' ? currentTheme.buttonActive : currentTheme.buttonInactive, 
                color: timeFilter === 'allTime' ? currentTheme.buttonActiveText : currentTheme.text,
              }}
            >
              All Time
            </button>
          </div>
        </div>
        
        {commitLoading ? (
          <div className="py-4 text-center" style={{ color: currentTheme.text }}>
            Loading leaderboard data...
          </div>
        ) : commitError ? (
          <div className="py-4 text-center text-red-500">
            {commitError}
          </div>
        ) : (
          <>
            {/* Podium for Top 3 - Mobile version */}
            <div className="flex md:hidden flex-col mb-6 space-y-4">
              {devLeaderboardData.slice(0, 3).map((dev, index) => (
                <div key={dev.dev} className="p-3 rounded-lg flex items-center" style={{ backgroundColor: currentTheme.controlsBg }}>
                  <div className="flex-shrink-0 mr-3">
                    <div 
                      className="rounded-full w-10 h-10 overflow-hidden border-2 flex items-center justify-center"
                      style={{ borderColor: currentTheme.primary }}
                    >
                      <img 
                        src={`https://github.com/${dev.dev}.png`} 
                        alt={dev.dev}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center">
                      <div className="font-bold text-sm mr-2" style={{ color: currentTheme.primary }}>#{index + 1}</div>
                      <a 
                        href={`https://github.com/${dev.dev}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: currentTheme.text }}
                      >
                        {dev.dev}
                      </a>
                    </div>
                    <div className="text-sm" style={{ color: currentTheme.text }}>{dev.totalCommits} commits</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Podium for Top 3 - Desktop version */}
            {devLeaderboardData.length > 0 && (
              <div className="hidden md:flex justify-center items-end mb-8 py-4">
                {/* Second Place */}
                {devLeaderboardData.length > 1 && (
                  <div className="text-center mx-4 w-28 flex flex-col items-center">
                    <div 
                      className="h-24 w-20 flex items-center justify-center rounded-t-lg mb-2" 
                      style={{ backgroundColor: currentTheme.primary, opacity: 0.8 }}
                    >
                      <span className="text-2xl font-bold" style={{ color: currentTheme.secondary }}>2</span>
                    </div>
                    <div className="rounded-full w-16 h-16 mx-auto mb-2 overflow-hidden border-2 flex items-center justify-center"
                      style={{ borderColor: currentTheme.primary }}>
                      <img 
                        src={`https://github.com/${devLeaderboardData[1].dev}.png`} 
                        alt={`${devLeaderboardData[1].dev}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                    <a 
                      href={`https://github.com/${devLeaderboardData[1].dev}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-center truncate w-full"
                      style={{ color: currentTheme.primary, fontWeight: 'bold' }}
                      title={devLeaderboardData[1].dev}
                    >
                      {devLeaderboardData[1].dev}
                    </a>
                    <div style={{ color: currentTheme.text }}>{devLeaderboardData[1].totalCommits} commits</div>
                  </div>
                )}
                
                {/* First Place */}
                <div className="text-center mx-4 -mb-4 w-32 flex flex-col items-center">
                  <div 
                    className="h-32 w-24 flex items-center justify-center rounded-t-lg mb-2" 
                    style={{ backgroundColor: currentTheme.primary }}
                  >
                    <span className="text-3xl font-bold" style={{ color: currentTheme.secondary }}>1</span>
                  </div>
                  <div 
                    className="rounded-full w-20 h-20 mx-auto mb-2 overflow-hidden border-4 flex items-center justify-center"
                    style={{ borderColor: currentTheme.primary }}
                  >
                    <img 
                      src={`https://github.com/${devLeaderboardData[0].dev}.png`} 
                      alt={`${devLeaderboardData[0].dev}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <a 
                    href={`https://github.com/${devLeaderboardData[0].dev}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center truncate w-full"
                    style={{ color: currentTheme.primary, fontWeight: 'bold', fontSize: '1.1rem' }}
                    title={devLeaderboardData[0].dev}
                  >
                    {devLeaderboardData[0].dev}
                  </a>
                  <div style={{ color: currentTheme.text, fontWeight: 'bold' }}>{devLeaderboardData[0].totalCommits} commits</div>
                </div>
                
                {/* Third Place */}
                {devLeaderboardData.length > 2 && (
                  <div className="text-center mx-4 w-28 flex flex-col items-center">
                    <div 
                      className="h-20 w-20 flex items-center justify-center rounded-t-lg mb-2" 
                      style={{ backgroundColor: currentTheme.primary, opacity: 0.6 }}
                    >
                      <span className="text-2xl font-bold" style={{ color: currentTheme.secondary }}>3</span>
                    </div>
                    <div className="rounded-full w-16 h-16 mx-auto mb-2 overflow-hidden border-2 flex items-center justify-center"
                      style={{ borderColor: currentTheme.primary }}>
                      <img 
                        src={`https://github.com/${devLeaderboardData[2].dev}.png`} 
                        alt={`${devLeaderboardData[2].dev}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                    <a 
                      href={`https://github.com/${devLeaderboardData[2].dev}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-center truncate w-full"
                      style={{ color: currentTheme.primary, fontWeight: 'bold' }}
                      title={devLeaderboardData[2].dev}
                    >
                      {devLeaderboardData[2].dev}
                    </a>
                    <div style={{ color: currentTheme.text }}>{devLeaderboardData[2].totalCommits} commits</div>
                  </div>
                )}
              </div>
            )}
            
            {/* Scrollable List for Other Developers */}
            <h3 className="text-sm md:text-md font-semibold mb-2" style={{ color: currentTheme.primary }}>
              Other Top Contributors
            </h3>
            <div className="overflow-x-auto" style={{ maxHeight: "250px", overflowY: "auto" }}>
              <table className="w-full" style={{ color: currentTheme.text }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr style={{ backgroundColor: currentTheme.tableHeader }}>
                    <th className="py-2 px-2 md:px-4 text-left border-b text-xs md:text-sm" style={{ borderColor: currentTheme.tableBorder }}>
                      Rank
                    </th>
                    <th className="py-2 px-2 md:px-4 text-left border-b text-xs md:text-sm" style={{ borderColor: currentTheme.tableBorder }}>
                      Developer
                    </th>
                    <th className="py-2 px-2 md:px-4 text-right border-b text-xs md:text-sm" style={{ borderColor: currentTheme.tableBorder }}>
                      Commits
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {devLeaderboardData.slice(3).map((entry, index) => (
                    <tr 
                      key={entry.dev}
                      style={{ 
                        backgroundColor: index % 2 === 0 ? 
                          currentTheme.tableRowEven : 
                          currentTheme.tableRowOdd 
                      }}
                    >
                      <td className="py-1 md:py-2 px-2 md:px-4 border-b text-xs md:text-sm" style={{ borderColor: currentTheme.tableBorder }}>
                        {index + 4}
                      </td>
                      <td className="py-1 md:py-2 px-2 md:px-4 border-b text-xs md:text-sm" style={{ borderColor: currentTheme.tableBorder }}>
                        <a 
                          href={`https://github.com/${entry.dev}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: currentTheme.primary, textDecoration: "underline" }}
                        >
                          {entry.dev}
                        </a>
                      </td>
                      <td className="py-1 md:py-2 px-2 md:px-4 text-right border-b text-xs md:text-sm" style={{ borderColor: currentTheme.tableBorder }}>
                        {entry.totalCommits}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      
      {/* Repository Commits Table */}
      <div className="mt-6 md:mt-8 p-3 md:p-4 rounded-lg" style={{ backgroundColor: currentTheme.chartBg }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-0" style={{ color: currentTheme.primary }}>
            Commits by Developer & Repository
          </h2>
          
          {/* Repository Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRepoFilter('all')}
              className="px-3 py-1 text-xs font-medium rounded-md"
              style={{ 
                backgroundColor: repoFilter === 'all' ? currentTheme.buttonActive : currentTheme.buttonInactive,
                color: repoFilter === 'all' ? currentTheme.buttonActiveText : currentTheme.text,
              }}
            >
              All
            </button>
            <button
              onClick={() => setRepoFilter('foundation')}
              className="px-3 py-1 text-xs font-medium rounded-md"
              style={{ 
                backgroundColor: repoFilter === 'foundation' ? currentTheme.buttonActive : currentTheme.buttonInactive,
                color: repoFilter === 'foundation' ? currentTheme.buttonActiveText : currentTheme.text,
              }}
            >
              Algorand Foundation
            </button>
            <button
              onClick={() => setRepoFilter('core')}
              className="px-3 py-1 text-xs font-medium rounded-md"
              style={{ 
                backgroundColor: repoFilter === 'core' ? currentTheme.buttonActive : currentTheme.buttonInactive,
                color: repoFilter === 'core' ? currentTheme.buttonActiveText : currentTheme.text,
              }}
            >
              Algorand Core
            </button>
            <button
              onClick={() => setRepoFilter('ecosystem')}
              className="px-3 py-1 text-xs font-medium rounded-md"
              style={{ 
                backgroundColor: repoFilter === 'ecosystem' ? currentTheme.buttonActive : currentTheme.buttonInactive,
                color: repoFilter === 'ecosystem' ? currentTheme.buttonActiveText : currentTheme.text,
              }}
            >
              Ecosystem
            </button>
          </div>
        </div>
        
        {/* Developer search filter */}
        <div className="mb-4">
          <div className="flex items-center">
            <label 
              htmlFor="devFilter"
              className="mr-2 text-xs md:text-sm font-medium" 
              style={{ color: currentTheme.primary }}
            >
              Search Developer:
            </label>
            <input
              id="devFilter"
              type="text"
              value={devFilter}
              onChange={(e) => setDevFilter(e.target.value)}
              placeholder="Filter by developer name..."
              className="px-3 py-1 text-xs md:text-sm rounded-md w-full max-w-xs"
              style={{ 
                backgroundColor: currentTheme.controlsBg,
                color: currentTheme.text,
                border: `1px solid ${currentTheme.tableBorder}`
              }}
            />
          </div>
        </div>
        
        {commitLoading ? (
          <div className="py-4 text-center" style={{ color: currentTheme.text }}>
            Loading commit data...
          </div>
        ) : commitError ? (
          <div className="py-4 text-center text-red-500">
            {commitError}
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ maxHeight: "400px", overflowY: "auto" }}>
            {/* Results count */}
            <div className="mb-2 text-xs" style={{ color: currentTheme.text }}>
              Showing {getFilteredAndSortedCommitData().length} results
              {devFilter && ` for "${devFilter}"`}
            </div>
            <table className="w-full" style={{ color: currentTheme.text }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <tr style={{ backgroundColor: currentTheme.tableHeader }}>
                  <th 
                    className="py-1 md:py-2 px-2 md:px-4 text-left border-b text-xs md:text-sm cursor-pointer" 
                    style={{ borderColor: currentTheme.tableBorder }}
                    onClick={() => handleSortChange('dev')}
                  >
                    <div className="flex items-center">
                      Developer
                      {sortBy === 'dev' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-1 md:py-2 px-2 md:px-4 text-left border-b text-xs md:text-sm cursor-pointer" 
                    style={{ borderColor: currentTheme.tableBorder }}
                    onClick={() => handleSortChange('repo')}
                  >
                    <div className="flex items-center">
                      Repository
                      {sortBy === 'repo' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-1 md:py-2 px-2 md:px-4 text-right border-b text-xs md:text-sm cursor-pointer" 
                    style={{ borderColor: currentTheme.tableBorder }}
                    onClick={() => handleSortChange('commits')}
                  >
                    <div className="flex items-center justify-end">
                      Commits
                      {sortBy === 'commits' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {getFilteredAndSortedCommitData().map((entry, index) => (
                  <tr 
                    key={`${entry.dev}-${entry.repo}`}
                    style={{ 
                      backgroundColor: index % 2 === 0 ? 
                        currentTheme.tableRowEven : 
                        currentTheme.tableRowOdd 
                    }}
                  >
                    <td className="py-1 md:py-2 px-2 md:px-4 border-b text-xs md:text-sm" style={{ borderColor: currentTheme.tableBorder }}>
                      <a 
                        href={`https://github.com/${entry.dev}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: currentTheme.primary, textDecoration: "underline" }}
                      >
                        {entry.dev}
                      </a>
                    </td>
                    <td className="py-1 md:py-2 px-2 md:px-4 border-b text-xs md:text-sm" style={{ borderColor: currentTheme.tableBorder }}>
                      <a 
                        href={`https://github.com/${entry.repo}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: currentTheme.primary, textDecoration: "underline" }}
                      >
                        {entry.repo}
                      </a>
                    </td>
                    <td className="py-1 md:py-2 px-2 md:px-4 text-right border-b text-xs md:text-sm" style={{ borderColor: currentTheme.tableBorder }}>
                      {entry.totalCommits}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="mt-10 pt-6 border-t text-center" style={{ borderColor: currentTheme.tableBorder }}>
        <div className="mb-4">
          <p className="text-sm" style={{ color: currentTheme.text }}>
            Data Source: <a 
              href="https://github.com/electric-capital/crypto-ecosystems"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: currentTheme.primary, textDecoration: "underline" }}
            >
              Electric Capital Crypto Ecosystems
            </a>
          </p>
          <p className="text-sm mt-2" style={{ color: currentTheme.text }}>
            If you're working in open source crypto, submit your repository <a 
              href="https://github.com/electric-capital/crypto-ecosystems"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: currentTheme.primary, textDecoration: "underline" }}
            >
               here
            </a> to be counted.
          </p>
        </div>
        <p className="text-xs pb-2" style={{ color: currentTheme.text, opacity: 0.8 }}>
          Dashboard powered by Algorand Foundation BI team
        </p>
      </footer>
    </div>
  );
}