import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
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
  const [sliderValue, setSliderValue] = useState<number>(70); // Default to 70% of time range
  const [darkMode, setDarkMode] = useState<boolean>(initialDarkMode);
  const [commitData, setCommitData] = useState<AggregatedCommit[]>([]);
  const [devLeaderboardData, setDevLeaderboardData] = useState<DevTotalCommits[]>([]);
  const [commitLoading, setCommitLoading] = useState<boolean>(true);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'last30d' | 'allTime'>('last30d');
  const [repoFilter, setRepoFilter] = useState<RepoFilter>('all');
  const [parsedData, setParsedData] = useState<CommitEntry[]>([]);
  const [maxDate, setMaxDate] = useState<Date | null>(null);

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
      buttonInactive: "#94a3b8"
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
      buttonInactive: "#475569"
    }
  };

  const currentTheme = darkMode ? theme.dark : theme.light;

  // Process data based on time filter
  const processDataByTimeFilter = (allData: CommitEntry[], filter: 'last30d' | 'allTime', maxDateValue: Date | null) => {
    if (!maxDateValue || allData.length === 0) return { devs: [], commits: [] };
    
    // Filter out 'forosuru' user and filter data based on time range if needed
    const filteredData = filter === 'last30d' 
      ? allData.filter(entry => {
          const entryDate = new Date(entry.date);
          const cutoffDate = new Date(maxDateValue);
          cutoffDate.setDate(cutoffDate.getDate() - 30);
          return entryDate >= cutoffDate && entryDate <= maxDateValue && entry.dev !== 'forosuru';
        })
      : allData.filter(entry => entry.dev !== 'forosuru');
    
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
  const handleTimeFilterChange = (filter: 'last30d' | 'allTime') => {
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

  // Get filtered data based on the slider value
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
    setSliderValue(parseInt(e.target.value, 10));
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
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-center w-full md:w-auto" style={{ color: currentTheme.primary }}>Active Developers Dashboard</h1>
        
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="px-4 py-2 rounded-lg font-medium text-sm flex items-center self-center md:self-auto"
          style={{ 
            backgroundColor: currentTheme.controlsBg,
            color: currentTheme.secondary
          }}
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
      
      {/* Chart */}
      <div className="mb-6 md:mb-8 p-3 md:p-4 rounded-lg" style={{ backgroundColor: currentTheme.chartBg }}>
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
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Date-based Slider Control */}
      <div className="p-3 md:p-4 rounded-lg" style={{ backgroundColor: currentTheme.controlsBg }}>
        <h2 className="text-base md:text-lg font-semibold mb-4" style={{ color: currentTheme.primary }}>Time Range</h2>
        
        <div>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={handleSliderChange}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{ 
              backgroundColor: darkMode ? "#1e3a5f" : "#d1d5db",
              accentColor: currentTheme.primary 
            }}
          />
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
                color: timeFilter === 'last30d' ? currentTheme.secondary : currentTheme.text,
              }}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handleTimeFilterChange('allTime')}
              className="px-3 py-1 text-xs md:text-sm font-medium"
              style={{ 
                backgroundColor: timeFilter === 'allTime' ? currentTheme.buttonActive : currentTheme.buttonInactive, 
                color: timeFilter === 'allTime' ? currentTheme.secondary : currentTheme.text,
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
                color: repoFilter === 'all' ? currentTheme.secondary : currentTheme.text,
              }}
            >
              All
            </button>
            <button
              onClick={() => setRepoFilter('foundation')}
              className="px-3 py-1 text-xs font-medium rounded-md"
              style={{ 
                backgroundColor: repoFilter === 'foundation' ? currentTheme.buttonActive : currentTheme.buttonInactive,
                color: repoFilter === 'foundation' ? currentTheme.secondary : currentTheme.text,
              }}
            >
              Algorand Foundation
            </button>
            <button
              onClick={() => setRepoFilter('core')}
              className="px-3 py-1 text-xs font-medium rounded-md"
              style={{ 
                backgroundColor: repoFilter === 'core' ? currentTheme.buttonActive : currentTheme.buttonInactive,
                color: repoFilter === 'core' ? currentTheme.secondary : currentTheme.text,
              }}
            >
              Algorand Core
            </button>
            <button
              onClick={() => setRepoFilter('ecosystem')}
              className="px-3 py-1 text-xs font-medium rounded-md"
              style={{ 
                backgroundColor: repoFilter === 'ecosystem' ? currentTheme.buttonActive : currentTheme.buttonInactive,
                color: repoFilter === 'ecosystem' ? currentTheme.secondary : currentTheme.text,
              }}
            >
              Ecosystem
            </button>
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
            <table className="w-full" style={{ color: currentTheme.text }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <tr style={{ backgroundColor: currentTheme.tableHeader }}>
                  <th className="py-1 md:py-2 px-2 md:px-4 text-left border-b text-xs md:text-sm" style={{ borderColor: currentTheme.tableBorder }}>
                    Developer
                  </th>
                  <th className="py-1 md:py-2 px-2 md:px-4 text-left border-b text-xs md:text-sm" style={{ borderColor: currentTheme.tableBorder }}>
                    Repository
                  </th>
                  <th className="py-1 md:py-2 px-2 md:px-4 text-right border-b text-xs md:text-sm" style={{ borderColor: currentTheme.tableBorder }}>
                    Commits
                  </th>
                </tr>
              </thead>
              <tbody>
                {getFilteredCommitData().map((entry, index) => (
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
    </div>
  );
}