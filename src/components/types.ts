// TypeScript interfaces
export interface DevDataPoint {
    date: string;
    activeDevs: number;
  }
  
export interface CommitEntry {
    date: string;
    dev: string;
    repo: string;
    commits: number;
}

export interface AggregatedCommit {
    dev: string;
    repo: string;
    totalCommits: number;
}

export interface DevTotalCommits {
    dev: string;
    totalCommits: number;
}

export type RepoFilter = 'all' | 'foundation' | 'core' | 'ecosystem';

export interface DashboardProps {
    dataUrl: string; // URL to your S3 JSON file
    showActiveDevs: boolean; // Whether to show the Active Devs chart
    showLeaderboard: boolean; // Whether to show the Leaderboard and Table
}

export interface ThemeColors {
    bg: string;
    primary: string;
    secondary: string;
    text: string;
    chartBg: string;
    controlsBg: string;
    tableBorder: string;
    tableHeader: string;
    tableRowEven: string;
    tableRowOdd: string;
    buttonActive: string;
    buttonInactive: string;
    buttonActiveText: string;
}

export interface Theme {
    light: ThemeColors;
    dark: ThemeColors;
}
