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
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async getUserStats(username: string): Promise<LeetCodeStats> {
    let retries = 3;
    let delay = 1000;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`${LEETCODE_PROXY_URL}/${username}/solved`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          if (response.status === 429) {
            if (i < retries - 1) {
              await this.delay(delay);
              delay *= 2;
              continue;
            }
            throw new Error('LeetCode API rate limit exceeded. Please try again later.');
          }
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
        if (i === retries - 1) {
          // Last retry failed, try fallback
          break;
        }
        await this.delay(delay);
        delay *= 2;
      }
    }

    // Fallback to alternative proxy if the first one fails
    try {
      const fallbackResponse = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
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
      throw new Error(`Failed to fetch LeetCode stats for ${username}. Please verify the username is correct or try again later.`);
    }
  }
}