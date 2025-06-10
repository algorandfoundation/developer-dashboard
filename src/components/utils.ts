import { 
  DevDataPoint, 
  AggregatedCommit,
  DevTotalCommits,
  CommitEntry
} from './types';

import endpoints from './endpoints.config';
import axios from 'axios';

// Constants
export const FILTERED_USERS = ['forosuru']; // Users to filter out from data

// Export functions to fetch URLs
export const fetchCSVURL = () => axios.get(endpoints.CSV_URL);
export const fetchDataURL = () => axios.get(endpoints.DATA_URL);

// Process data by time filter (30 days, 90 days, or all time)
export const processDataByTimeFilter = (
  allData: CommitEntry[], 
  filter: 'last30d' | 'last90d' | 'last1y' | 'allTime',
  maxDateValue: Date | null,
  repoFilter: 'all' | 'foundation'| 'core' | 'ecosystem' = 'all'
) => {
  if (!maxDateValue || allData.length === 0) return { devs: [], commits: [] };
  
  // Filter data by time period
  let filteredData: CommitEntry[] = [];
  
  if (filter === 'last30d') {
    // Last 30 days
    const cutoffDate = new Date(maxDateValue);
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    filteredData = allData.filter(entry => {
      // Filter out users in the FILTERED_USERS array
      if (FILTERED_USERS.includes(entry.dev)) return false;
      
      const entryDate = new Date(entry.date);
      return entryDate >= cutoffDate;
    });
  } else if (filter === 'last90d') {
    // Last 90 days
    const cutoffDate = new Date(maxDateValue);
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    filteredData = allData.filter(entry => {
      // Filter out users in the FILTERED_USERS array
      if (FILTERED_USERS.includes(entry.dev)) return false;
      
      const entryDate = new Date(entry.date);
      return entryDate >= cutoffDate;
    });
  } else if (filter === 'last1y') {
    // Last 1 year
    const cutoffDate = new Date(maxDateValue);
    cutoffDate.setDate(cutoffDate.getDate() - 365);
    filteredData = allData.filter(entry => {
      // Filter out users in the FILTERED_USERS array
      if (FILTERED_USERS.includes(entry.dev)) return false;
      
      const entryDate = new Date(entry.date);
      return entryDate >= cutoffDate;
    });
  } else {
    // All time
    filteredData = allData.filter(entry => !FILTERED_USERS.includes(entry.dev));
  }

  // Apply repository filter
  if (repoFilter !== 'all') {
    filteredData = filteredData.filter(entry => {
      switch(repoFilter) {
        case 'foundation':
          return entry.repo.startsWith('algorand-devrel/') ||
                 entry.repo.startsWith('algorandfoundation/');
        case 'core':
          return entry.repo.startsWith('algorand/');
        case 'ecosystem':
          return !entry.repo.startsWith('algorandfoundation/') && 
                 !entry.repo.startsWith('algorand/') &&
                 !entry.repo.startsWith('algorand-devrel/');
        default:
          return true;
      }
    });
  }
  
  return aggregateData(filteredData);
};

// Aggregate data by developer and repository
export const aggregateData = (filteredData: CommitEntry[]) => {
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
  
  // Group just by dev - leaderboard
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

// Filter data by date range based on slider value
export const filterDataByDateRange = (
  data: DevDataPoint[], 
  dateRange: [Date, Date], 
  sliderValue: number
): DevDataPoint[] => {
  if (!data || data.length === 0) return [];
  
  const [startDate, endDate] = dateRange;
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate how many days to show based on slider value
  const daysToShow = Math.max(1, Math.ceil((totalDays * sliderValue) / 100));
  
  // Calculate the actual start date based on days to show
  const actualStartDate = new Date(endDate.getTime() - (daysToShow - 1) * 24 * 60 * 60 * 1000);
  
  // Filter data to show only the selected range
  return data.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= actualStartDate && itemDate <= endDate;
  });
};

// Parse CSV data into CommitEntry objects
export const parseCSVData = (csvText: string): CommitEntry[] => {
  const rows = csvText.split('\n');
  
  // Parse CSV into array of objects (skip header row)
  return rows.slice(1).map(row => {
    const values = row.split(',');
    return {
      date: values[0]?.trim() || '',
      dev: values[1]?.trim() || '',
      repo: values[2]?.trim() || '',
      commits: parseInt(values[3]?.trim() || '0', 10)
    };
  }).filter(entry => entry.date && entry.dev && entry.repo);
};

// Get the maximum date from an array of CommitEntry objects
export const getMaxDate = (entries: CommitEntry[]): Date | null => {
  const dates = entries
    .map(entry => new Date(entry.date))
    .filter(date => !isNaN(date.getTime()));
  
  if (dates.length === 0) return null;
  
  return new Date(Math.max(...dates.map(date => date.getTime())));
};

// Check if a date is at the end of a month
export const isMonthEnd = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  // Create a new date for the next day
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);
  
  // If the month changes, this was the end of a month
  return nextDay.getMonth() !== date.getMonth();
};

// Identify month-end data points
export const getMonthEndDataPoints = (dataPoints: DevDataPoint[]): DevDataPoint[] => {
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
    
    const isLastDayOfMonth = nextDay.getMonth() !== currentDate.getMonth();
    
    // Add to month-end points if it's the last day of month
    // or if it's the last point in our dataset
    if (isLastDayOfMonth || i === sortedData.length - 1) {
      monthEndPoints.push(sortedData[i]);
    }
  }
  
  return monthEndPoints;
}; 

