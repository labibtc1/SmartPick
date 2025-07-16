const LEETCODE_API_URL = 'https://leetcode.com/graphql';

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
  private static async makeGraphQLRequest(query: string, variables: any): Promise<any> {
    try {
      const response = await fetch(LEETCODE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: JSON.stringify({
          query,
          variables
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(data.errors[0].message || 'GraphQL query failed');
      }
      
      return data.data;
    } catch (error) {
      throw new Error(`Failed to fetch LeetCode data: ${error}`);
    }
  }

  static async getUserStats(username: string): Promise<LeetCodeStats> {
    const query = `
      query getUserProfile($username: String!) {
        allQuestionsCount {
          difficulty
          count
        }
        matchedUser(username: $username) {
          username
          contributions {
            points
            questionCount
            testcaseCount
          }
          profile {
            realName
            ranking
            reputation
          }
          submitStats {
            totalSubmissionNum {
              difficulty
              count
              submissions
            }
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
        }
      }
    `;

    try {
      const data = await this.makeGraphQLRequest(query, { username });
      
      if (!data.matchedUser) {
        throw new Error(`User ${username} not found on LeetCode`);
      }

      const user = data.matchedUser;
      const acSubmissions = user.submitStats.acSubmissionNum;
      
      // Calculate total solved problems
      let totalSolved = 0;
      let easySolved = 0;
      let mediumSolved = 0;
      let hardSolved = 0;

      acSubmissions.forEach((submission: any) => {
        const count = submission.count;
        totalSolved += count;
        
        switch (submission.difficulty) {
          case 'Easy':
            easySolved = count;
            break;
          case 'Medium':
            mediumSolved = count;
            break;
          case 'Hard':
            hardSolved = count;
            break;
        }
      });

      return {
        username: user.username,
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        ranking: user.profile?.ranking || 0,
        reputation: user.profile?.reputation || 0
      };
    } catch (error) {
      throw new Error(`Failed to fetch LeetCode stats for ${username}: ${error}`);
    }
  }
}