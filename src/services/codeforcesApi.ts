import { User, RatingChange, Submission, UserStats } from '../types';

const BASE_URL = 'https://codeforces.com/api';

export class CodeforcesAPI {
  private static async makeRequest(endpoint: string): Promise<any> {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    if (data.status === 'FAILED') {
      throw new Error(data.comment || 'API request failed');
    }
    
    return data.result;
  }

  static async getUserInfo(handle: string): Promise<User> {
    const users = await this.makeRequest(`/user.info?handles=${handle}`);
    return users[0];
  }

  static async getUserRating(handle: string): Promise<RatingChange[]> {
    try {
      return await this.makeRequest(`/user.rating?handle=${handle}`);
    } catch (error) {
      // User might not have participated in rated contests
      return [];
    }
  }

  static async getUserSubmissions(handle: string, count: number = 10000): Promise<Submission[]> {
    return await this.makeRequest(`/user.status?handle=${handle}&from=1&count=${count}`);
  }

  static async getUserStats(handle: string, email: string): Promise<UserStats> {
    try {
      const [userInfo, ratingHistory, submissions] = await Promise.all([
        this.getUserInfo(handle),
        this.getUserRating(handle),
        this.getUserSubmissions(handle)
      ]);

      // Calculate problems solved (unique problems with OK verdict)
      const solvedProblems = new Set();
      submissions.forEach(submission => {
        if (submission.verdict === 'OK') {
          solvedProblems.add(`${submission.problem.contestId}-${submission.problem.index}`);
        }
      });

      // Calculate average rating
      let averageRating = 0;
      if (ratingHistory.length > 0) {
        const totalRating = ratingHistory.reduce((sum, change) => sum + change.newRating, 0);
        averageRating = Math.round(totalRating / ratingHistory.length);
      }

      // Find best rank
      const bestRank = ratingHistory.length > 0 
        ? Math.min(...ratingHistory.map(change => change.rank))
        : 0;

      return {
        handle,
        email,
        maxRating: userInfo.maxRating || 0,
        maxRank: userInfo.maxRank || 'Unrated',
        problemsSolved: solvedProblems.size,
        averageRating,
        bestRank,
        currentRating: userInfo.rating || 0,
        lastUpdated: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to fetch stats for ${handle}: ${error}`);
    }
  }
}