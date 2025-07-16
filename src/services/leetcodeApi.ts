const LEETCODE_PROXY_URL = 'https://alfa-leetcode-api.onrender.com';

export interface LeetCodeStats {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  reputation: number;
}

export class LeetCodeAPI {
  static async getUserStats(username: string): Promise<LeetCodeStats> {
    try {
      const response = await fetch(`${LEETCODE_PROXY_URL}/${username}/solved`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`User ${username} not found on LeetCode`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response formats from the proxy API
      if (data.errors || !data.solvedProblem) {
        throw new Error(`User ${username} not found or data unavailable`);
      }

      const solvedData = data.solvedProblem;
      
      return {
        username: username,
        totalSolved: solvedData.solvedProblem || 0,
        easySolved: solvedData.easySolved || 0,
        mediumSolved: solvedData.mediumSolved || 0,
        hardSolved: solvedData.hardSolved || 0,
        ranking: data.ranking || 0,
        reputation: 0 // Not available in this API
      };
    } catch (error) {
      // Fallback to alternative proxy if the first one fails
      try {
        const fallbackResponse = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
        
        if (!fallbackResponse.ok) {
          throw new Error(`User ${username} not found on LeetCode`);
        }

        const fallbackData = await fallbackResponse.json();
        
        return {
          username: username,
          totalSolved: fallbackData.totalSolved || 0,
          easySolved: fallbackData.easySolved || 0,
          mediumSolved: fallbackData.mediumSolved || 0,
          hardSolved: fallbackData.hardSolved || 0,
          ranking: fallbackData.ranking || 0,
          reputation: 0
        };
      } catch (fallbackError) {
        throw new Error(`Failed to fetch LeetCode stats for ${username}. Please verify the username is correct.`);
      }
    }
  }
}