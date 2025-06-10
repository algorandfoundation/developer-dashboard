import { useState, useEffect } from 'react';
import {
  DevDataPoint, 
  AggregatedCommit, 
  DevTotalCommits, 
  RepoFilter, 
  CommitEntry, 
  DashboardProps
} from './types';

import { theme } from './theme';
import Leaderboard from './Leaderboard';
import CommitDevRepo from './CommitDevRepo';
import Header from './Header';
import Footer from './Footer';
import ActiveDevs from './ActiveDevs';
import { 
  processDataByTimeFilter, 
  filterDataByDateRange, 
  isMonthEnd, 
  parseCSVData, 
  getMaxDate,
  fetchCSVURL,
  fetchDataURL,
  FILTERED_USERS
} from './utils';

interface DevDashboardProps {
  showActiveDevs: boolean;
  showLeaderboard: boolean;
}

const DevDashboard: React.FC<DevDashboardProps> = ({ showActiveDevs, showLeaderboard }) => {
  // State for our data, slider, and theme
  const [data, setData] = useState<DevDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date, Date]>([new Date(), new Date()]);
  const [selectedDateRange, setSelectedDateRange] = useState<[Date, Date] | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(document.body.classList.contains('dark-mode'));
  const [commitData, setCommitData] = useState<AggregatedCommit[]>([]);
  const [devLeaderboardData, setDevLeaderboardData] = useState<DevTotalCommits[]>([]);
  const [commitLoading, setCommitLoading] = useState<boolean>(true);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'last30d' | 'last90d' | 'last1y' | 'allTime'>('last30d');
  const [repoFilter, setRepoFilter] = useState<RepoFilter>('all');
  const [parsedData, setParsedData] = useState<CommitEntry[]>([]);
  const [sliderValue, setSliderValue] = useState<number>(20);
  const [maxDate, setMaxDate] = useState<Date | null>(null);
  const [devFilter, setDevFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'dev' | 'repo' | 'commits'>('commits');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const currentTheme = darkMode ? theme.dark : theme.light;

  // Handle time filter change
  const handleTimeFilterChange = (filter: 'last30d' | 'last90d' | 'last1y' |'allTime') => {
    setTimeFilter(filter);
    const processedData = processDataByTimeFilter(parsedData, filter, maxDate, repoFilter);
    setDevLeaderboardData(processedData.devs);
    setCommitData(processedData.commits);
  };

  // Handle repo filter change
  const handleRepoFilterChange = (value: RepoFilter | ((prev: RepoFilter) => RepoFilter)) => {
    const newFilter = typeof value === 'function' ? value(repoFilter) : value;
    setRepoFilter(newFilter);
    const processedData = processDataByTimeFilter(parsedData, timeFilter, maxDate, newFilter);
    setDevLeaderboardData(processedData.devs);
    setCommitData(processedData.commits);
  };

  // Fetch commit data from CSV
  useEffect(() => {
    const fetchCommitData = async () => {
      try {
        setCommitLoading(true);
        
        const csvResponse = await fetchCSVURL();
        const csvText = csvResponse.data;
        
        // Parse CSV data
        const parsed = parseCSVData(csvText);
        
        // Find max date in the data
        const maxDateValue = getMaxDate(parsed);
        
        if (!maxDateValue) {
          throw new Error("No valid dates found in data");
        }
        
        setMaxDate(maxDateValue);
        setParsedData(parsed);
        
        // Process the data
        const processedData = processDataByTimeFilter(parsed, timeFilter, maxDateValue, repoFilter);
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
  }, [timeFilter, repoFilter]);

  // Fetch data from S3
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const dataResponse = await fetchDataURL();
        const rawData = dataResponse.data;
        
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
  }, []);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderValue(parseFloat(e.target.value));
  };
  
  // Get filtered data based on slider value - invert the slider value for data processing
  const filteredData = () => {
    const proportion = sliderValue / 100; // smaller = more data
    const [start, end] = dateRange;
  
    const rangeDuration = end.getTime() - start.getTime();
    const cutoffTime = end.getTime() - (rangeDuration * proportion); // keep more when proportion is small
  
    const filtered = data.filter(d => {
      const time = new Date(d.date).getTime();
      return time >= cutoffTime && time <= end.getTime();
    });
  
    return filtered;
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
      <Header currentTheme={currentTheme} />

      {/* Active Developers Chart */}
      {showActiveDevs && (
        <ActiveDevs
          data={data}
          displayData={displayData}
          dateRange={dateRange}
          sliderValue={sliderValue}
          currentTheme={currentTheme}
          handleSliderChange={handleSliderChange}
          isMonthEnd={isMonthEnd}
        />
      )}
      
      {/* Developer Leaderboard and Table */}
      {showLeaderboard && (
        <>
          <Leaderboard 
            devLeaderboardData={devLeaderboardData}
            currentTheme={currentTheme}
            timeFilter={timeFilter}
            handleTimeFilterChange={handleTimeFilterChange}
            repoFilter={repoFilter}
            setRepoFilter={handleRepoFilterChange}
            commitLoading={commitLoading}
            commitError={commitError}
          />
          
          <CommitDevRepo
            commitData={commitData}
            currentTheme={currentTheme}
            repoFilter={repoFilter}
            setRepoFilter={handleRepoFilterChange}
            commitLoading={commitLoading}
            commitError={commitError}
            devFilter={devFilter}
            setDevFilter={setDevFilter}
            sortBy={sortBy}
            sortOrder={sortOrder}
            handleSortChange={handleSortChange}
            timeFilter={timeFilter}
            handleTimeFilterChange={handleTimeFilterChange}
          />
        </>
      )}
      
      {/* Footer */}
      <Footer currentTheme={currentTheme} />
    </div>
  );
}

export default DevDashboard;