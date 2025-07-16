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
  createdAt: number;
  isAdmin: boolean;
}