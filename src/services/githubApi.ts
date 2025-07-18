const GITHUB_API_BASE = 'https://api.github.com';

export interface GitHubUser {
  login: string;
  name: string;
  bio: string;
  location: string;
  company: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GitHubRepo {
  name: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  private: boolean;
}

export class GitHubAPI {
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static async makeRequest(endpoint: string): Promise<any> {
    let retries = 3;
    let delay = 1000;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Codeforces-Leaderboard-App'
          }
        });

        if (response.status === 429) {
          if (i < retries - 1) {
            await this.delay(delay);
            delay *= 2;
            continue;
          }
          throw new Error('GitHub API rate limit exceeded. Please try again later.');
        }

        if (response.status === 404) {
          throw new Error('GitHub user not found. Please check the username.');
        }

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        if (i === retries - 1) {
          if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Network connection failed. Please check your internet connection.');
          }
          throw error;
        }
        await this.delay(delay);
        delay *= 2;
      }
    }
  }

  static async getUserInfo(username: string): Promise<GitHubUser> {
    return await this.makeRequest(`/users/${username}`);
  }

  static async getUserRepos(username: string): Promise<GitHubRepo[]> {
    try {
      // Get all public repositories
      const repos = await this.makeRequest(`/users/${username}/repos?type=public&per_page=100`);
      return repos || [];
    } catch (error) {
      console.warn('Could not fetch repositories:', error);
      return [];
    }
  }

  static async getContributions(username: string): Promise<number> {
    try {
      // This is a simplified approach - GitHub's contribution graph requires scraping
      // For now, we'll estimate based on recent activity
      const events = await this.makeRequest(`/users/${username}/events/public?per_page=100`);
      
      // Count unique days with activity in the last year
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const activeDays = new Set();
      events.forEach((event: any) => {
        const eventDate = new Date(event.created_at);
        if (eventDate >= oneYearAgo) {
          const dayKey = eventDate.toISOString().split('T')[0];
          activeDays.add(dayKey);
        }
      });
      
      // Estimate contributions (this is approximate)
      return activeDays.size * 2; // Rough estimate
    } catch (error) {
      console.warn('Could not fetch contributions:', error);
      return 0;
    }
  }

  static async getUserStats(username: string): Promise<import('../types').GitHubStats> {
    try {
      await this.delay(500); // Rate limiting

      const [userInfo, repos, contributions] = await Promise.all([
        this.getUserInfo(username),
        this.getUserRepos(username),
        this.getContributions(username)
      ]);

      // Calculate total stars and forks
      const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
      const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

      // Calculate top languages
      const languageCount: { [key: string]: number } = {};
      repos.forEach(repo => {
        if (repo.language) {
          languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
        }
      });

      // Sort languages by count and take top 5
      const topLanguages = Object.entries(languageCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .reduce((obj, [lang, count]) => {
          obj[lang] = count;
          return obj;
        }, {} as { [key: string]: number });

      return {
        username: userInfo.login,
        publicRepos: userInfo.public_repos,
        followers: userInfo.followers,
        following: userInfo.following,
        totalStars,
        totalForks,
        contributions,
        topLanguages,
        createdAt: userInfo.created_at,
        bio: userInfo.bio,
        location: userInfo.location,
        company: userInfo.company
      };
    } catch (error) {
      throw new Error(`Failed to fetch GitHub stats for ${username}: ${error}`);
    }
  }
}