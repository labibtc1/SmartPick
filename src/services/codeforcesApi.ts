import { User, RatingChange, Submission, UserStats } from '../types';

const BASE_URL = 'https://codeforces.com/api';

export class CodeforcesAPI {
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static async makeRequest(endpoint: string): Promise<any> {
    let retries = 3;
    let delay = 1000; // Start with 1 second delay

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        
        if (response.status === 429) {
          // Rate limited, wait and retry
          if (i < retries - 1) {
            await this.delay(delay);
            delay *= 2; // Exponential backoff
            continue;
          }
          throw new Error('Codeforces API rate limit exceeded. Please try again later.');
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'FAILED') {
          throw new Error(data.comment || 'API request failed');
        }
        
        return data.result;
      } catch (error) {
        if (i === retries - 1) {
          // Last retry failed
          if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Network connection failed. Please check your internet connection and try again.');
          }
          throw error;
        }
        // Wait before retrying
        await this.delay(delay);
        delay *= 2;
      }
    }
  }

  static async getUserInfo(handle: string): Promise<User> {
    await this.delay(500); // Add delay between requests
    const users = await this.makeRequest(`/user.info?handles=${handle}`);
    return users[0];
  }

  static async getUserRating(handle: string): Promise<RatingChange[]> {
    try {
      await this.delay(500); // Add delay between requests
      return await this.makeRequest(`/user.rating?handle=${handle}`);
    } catch (error) {
      // User might not have participated in rated contests
      return [];
    }
  }

  static async getUserSubmissions(handle: string, count: number = 10000): Promise<Submission[]> {
    await this.delay(500); // Add delay between requests
    return await this.makeRequest(`/user.status?handle=${handle}&from=1&count=${count}`);
  }

  static async getUserStats(handle: string, email: string): Promise<UserStats> {
    try {
      // Add delays between sequential API calls to avoid rate limiting
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
        leetcodeHandle: undefined,
        maxRating: userInfo.maxRating || 0,
        maxRank: userInfo.maxRank || 'Unrated',
        problemsSolved: solvedProblems.size,
        leetcodeProblemsSolved: 0,
        totalProblemsSolved: solvedProblems.size,
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