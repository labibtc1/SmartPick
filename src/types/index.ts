export interface User {
  handle: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution: number;
  rank: string;
  rating: number;
  maxRank: string;
  maxRating: number;
  lastOnlineTimeSeconds: number;
  registrationTimeSeconds: number;
  friendOfCount: number;
  avatar?: string;
  titlePhoto?: string;
}

export interface RatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

export interface Submission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  relativeTimeSeconds: number;
  problem: {
    contestId: number;
    index: string;
    name: string;
    type: string;
    rating?: number;
    tags: string[];
  };
  author: {
    contestId: number;
    members: Array<{
      handle: string;
    }>;
    participantType: string;
  };
  programmingLanguage: string;
  verdict?: string;
  testset: string;
  passedTestCount: number;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
  points?: number;
}

export interface Problem {
  contestId: number;
  problemsetName?: string;
  index: string;
  name: string;
  type: string;
  points?: number;
  rating?: number;
  tags: string[];
}

export interface UserStats {
  handle: string;
  email: string;
  leetcodeHandle?: string;
  maxRating: number;
  maxRank: string;
  problemsSolved: number;
  leetcodeProblemsSolved: number;
  totalProblemsSolved: number;
  averageRating: number;
  bestRank: number;
  currentRating: number;
  lastUpdated: number;
}

export interface FirebaseUser {
  uid: string;
  email: string;
  codeforcesHandle?: string;
  leetcodeHandle?: string;
  githubHandle?: string;
  createdAt: number;
  isAdmin: boolean;
}

export interface GitHubStats {
  username: string;
  publicRepos: number;
  followers: number;
  following: number;
  totalStars: number;
  totalForks: number;
  contributions: number;
  topLanguages: { [key: string]: number };
  createdAt: string;
  bio?: string;
  location?: string;
  company?: string;
}