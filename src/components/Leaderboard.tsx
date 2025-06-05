import React from 'react';
import { DevTotalCommits, RepoFilter } from './types';

interface LeaderboardProps {
  devLeaderboardData: DevTotalCommits[];
  currentTheme: any;
  timeFilter: 'last30d' | 'last90d' | 'last1y' | 'allTime';
  handleTimeFilterChange: (filter: 'last30d' | 'last90d' | 'last1y' | 'allTime') => void;
  repoFilter: RepoFilter;
  setRepoFilter: React.Dispatch<React.SetStateAction<RepoFilter>>;
  commitLoading: boolean;
  commitError: string | null;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  devLeaderboardData,
  currentTheme,
  timeFilter,
  handleTimeFilterChange,
  repoFilter,
  setRepoFilter,
  commitLoading,
  commitError
}) => {
  return (
    <div className="mt-6 md:mt-8 p-3 md:p-4 rounded-lg" style={{ backgroundColor: currentTheme.chartBg }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <h2 className="text-base md:text-lg font-semibold" style={{ color: currentTheme.primary }}>
          Developer Leaderboard
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
                    className="relative h-24 w-20 flex items-center justify-center rounded-lg mb-2 overflow-hidden">
                    <img 
                    src={currentTheme.leaderboard2}
                    alt="Algorand Dashboard" 
                    className="absolute inset-0 h-full w-full object-contain"
                  />
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
              <div className="relative h-32 w-24 flex items-center justify-center rounded-lg mb-2 overflow-hidden">
                  <img 
                    src={currentTheme.leaderboard1}
                    alt="Algorand Dashboard" 
                    className="absolute inset-0 h-full w-full object-contain"
                  />
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
                      className="relative h-20 w-20 flex items-center justify-center rounded-lg mb-2 overflow-hidden">
                      <img 
                    src={currentTheme.leaderboard3}
                    alt="Algorand Dashboard" 
                    className="absolute inset-0 h-full w-full object-contain"
                      />
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
  );
};

export default Leaderboard;