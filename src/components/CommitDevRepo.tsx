import React from 'react';
import { AggregatedCommit, RepoFilter } from './types';

interface CommitDevRepoProps {
  commitData: AggregatedCommit[];
  currentTheme: any;
  repoFilter: RepoFilter;
  setRepoFilter: React.Dispatch<React.SetStateAction<RepoFilter>>;
  commitLoading: boolean;
  commitError: string | null;
  devFilter: string;
  setDevFilter: React.Dispatch<React.SetStateAction<string>>;
  sortBy: 'dev' | 'repo' | 'commits';
  sortOrder: 'asc' | 'desc';
  handleSortChange: (columnName: 'dev' | 'repo' | 'commits') => void;
  timeFilter: 'last30d' | 'last90d' | 'last1y' | 'allTime';
  handleTimeFilterChange: (filter: 'last30d' | 'last90d' | 'last1y' | 'allTime') => void;
}

const CommitDevRepo: React.FC<CommitDevRepoProps> = ({
  commitData,
  currentTheme,
  repoFilter,
  setRepoFilter,
  commitLoading,
  commitError,
  devFilter,
  setDevFilter,
  sortBy,
  sortOrder,
  handleSortChange,
  timeFilter,
  handleTimeFilterChange
}) => {
  // Filter commits by repository type
  const getFilteredCommitData = () => {
    switch(repoFilter) {
      case 'foundation':
        return commitData.filter(entry => 
          entry.repo.startsWith('algorand-devrel/') || 
          entry.repo.startsWith('algorandfoundation/')
        );;
      case 'core':
        return commitData.filter(entry => entry.repo.startsWith('algorand/'));
      case 'ecosystem':
        return commitData.filter(entry => 
          !entry.repo.startsWith('algorandfoundation/') && 
          !entry.repo.startsWith('algorand/') &&
          !entry.repo.startsWith('algorand-devrel/')
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

  return (
    <div className="mt-6 md:mt-8 p-3 md:p-4 rounded-lg" style={{ backgroundColor: currentTheme.chartBg }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <h2 className="text-base md:text-lg font-semibold" style={{ color: currentTheme.primary }}>
          Commits by Developer and Repository
        </h2>
        
        {/* Filters */}
        <div className="flex flex-col gap-2 w-full md:w-auto">
          {/* Time period toggle buttons */}
          <div className="flex justify-end">
            <div className="flex justify-end flex-wrap gap-1">
              <button
                onClick={() => handleTimeFilterChange('last30d')}
                className="px-2 py-1 text-xs font-medium rounded-lg"
                style={{ 
                  backgroundColor: timeFilter === 'last30d' ? currentTheme.buttonActive : currentTheme.buttonInactive,
                  color: timeFilter === 'last30d' ? currentTheme.buttonActiveText : currentTheme.text,
                }}
              >
                Last 30d
              </button>
              <button
                onClick={() => handleTimeFilterChange('last90d')}
                className="px-2 py-1 text-xs font-medium rounded-lg"
                style={{ 
                  backgroundColor: timeFilter === 'last90d' ? currentTheme.buttonActive : currentTheme.buttonInactive,
                  color: timeFilter === 'last90d' ? currentTheme.buttonActiveText : currentTheme.text,
                }}
              >
                Last 90d
              </button>
              <button
                onClick={() => handleTimeFilterChange('last1y')}
                className="px-2 py-1 text-xs font-medium rounded-lg"
                style={{ 
                  backgroundColor: timeFilter === 'last1y' ? currentTheme.buttonActive : currentTheme.buttonInactive,
                  color: timeFilter === 'last1y' ? currentTheme.buttonActiveText : currentTheme.text,
                }}
              >
                Last 1Y
              </button>
              <button
                onClick={() => handleTimeFilterChange('allTime')}
                className="px-2 py-1 text-xs font-medium rounded-lg"
                style={{ 
                  backgroundColor: timeFilter === 'allTime' ? currentTheme.buttonActive : currentTheme.buttonInactive, 
                  color: timeFilter === 'allTime' ? currentTheme.buttonActiveText : currentTheme.text,
                }}
              >
                All Time
              </button>
            </div>
          </div>

          {/* Repository Filter */}
          <div className="flex justify-end flex-wrap gap-1">
            <button
              onClick={() => setRepoFilter('all')}
              className="px-2 py-1 text-xs font-medium rounded-lg"
              style={{ 
                backgroundColor: repoFilter === 'all' ? currentTheme.buttonActive : currentTheme.buttonInactive,
                color: repoFilter === 'all' ? currentTheme.buttonActiveText : currentTheme.text,
              }}
            >
              All
            </button>
            <button
              onClick={() => setRepoFilter('foundation')}
              className="px-2 py-1 text-xs font-medium rounded-lg"
              style={{ 
                backgroundColor: repoFilter === 'foundation' ? currentTheme.buttonActive : currentTheme.buttonInactive,
                color: repoFilter === 'foundation' ? currentTheme.buttonActiveText : currentTheme.text,
              }}
            >
              Algorand Foundation
            </button>
            <button
              onClick={() => setRepoFilter('core')}
              className="px-2 py-1 text-xs font-medium rounded-lg"
              style={{ 
                backgroundColor: repoFilter === 'core' ? currentTheme.buttonActive : currentTheme.buttonInactive,
                color: repoFilter === 'core' ? currentTheme.buttonActiveText : currentTheme.text,
              }}
            >
              Algorand Core
            </button>
            <button
              onClick={() => setRepoFilter('ecosystem')}
              className="px-2 py-1 text-xs font-medium rounded-lg"
              style={{ 
                backgroundColor: repoFilter === 'ecosystem' ? currentTheme.buttonActive : currentTheme.buttonInactive,
                color: repoFilter === 'ecosystem' ? currentTheme.buttonActiveText : currentTheme.text,
              }}
            >
              Ecosystem
            </button>
          </div>
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
  );
};

export default CommitDevRepo; 