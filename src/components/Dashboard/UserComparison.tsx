import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Target, Star, Award, Calendar, Code, Zap, Github, Users, GitBranch } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { FirebaseService } from '../../services/firebaseService';
import { GitHubAPI } from '../../services/githubApi';
import { UserStats, GitHubStats } from '../../types';

interface UserComparisonProps {
  onBack: () => void;
}

export const UserComparison: React.FC<UserComparisonProps> = ({ onBack }) => {
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [githubStats, setGithubStats] = useState<{ [key: string]: GitHubStats }>({});
  const [selectedUser1, setSelectedUser1] = useState<UserStats | null>(null);
  const [selectedUser2, setSelectedUser2] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [githubLoading, setGithubLoading] = useState(false);

  useEffect(() => {
    loadUserStats();
  }, []);

  useEffect(() => {
    if (selectedUser1 || selectedUser2) {
      loadGithubStats();
    }
  }, [selectedUser1, selectedUser2]);

  const loadUserStats = async () => {
    try {
      const stats = await FirebaseService.getAllUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGithubStats = async () => {
    setGithubLoading(true);
    const users = [selectedUser1, selectedUser2].filter(Boolean) as UserStats[];
    
    for (const user of users) {
      // Find the user's GitHub handle from Firebase
      try {
        const userData = await FirebaseService.getUserData(user.handle); // Assuming handle maps to uid
        if (userData?.githubHandle && !githubStats[user.handle]) {
          try {
            const stats = await GitHubAPI.getUserStats(userData.githubHandle);
            setGithubStats(prev => ({
              ...prev,
              [user.handle]: stats
            }));
          } catch (error) {
            console.warn(`Could not load GitHub stats for ${userData.githubHandle}:`, error);
          }
        }
      } catch (error) {
        console.warn(`Could not load user data for ${user.handle}:`, error);
      }
    }
    setGithubLoading(false);
  };

  const getRankColor = (rank: string) => {
    const colors: { [key: string]: string } = {
      'legendary grandmaster': 'from-red-600 to-red-800',
      'international grandmaster': 'from-red-500 to-red-700',
      'grandmaster': 'from-red-400 to-red-600',
      'international master': 'from-orange-500 to-orange-700',
      'master': 'from-orange-400 to-orange-600',
      'candidate master': 'from-purple-500 to-purple-700',
      'expert': 'from-blue-500 to-blue-700',
      'specialist': 'from-cyan-500 to-cyan-700',
      'pupil': 'from-green-500 to-green-700',
      'newbie': 'from-gray-400 to-gray-600'
    };
    return colors[rank?.toLowerCase()] || 'from-gray-400 to-gray-600';
  };

  const getRankTextColor = (rank: string) => {
    const colors: { [key: string]: string } = {
      'legendary grandmaster': 'text-red-100',
      'international grandmaster': 'text-red-100',
      'grandmaster': 'text-red-100',
      'international master': 'text-orange-100',
      'master': 'text-orange-100',
      'candidate master': 'text-purple-100',
      'expert': 'text-blue-100',
      'specialist': 'text-cyan-100',
      'pupil': 'text-green-100',
      'newbie': 'text-gray-100'
    };
    return colors[rank?.toLowerCase()] || 'text-gray-100';
  };

  const getWinner = (stat1: number, stat2: number, higherIsBetter: boolean = true) => {
    if (stat1 === stat2) return 'tie';
    if (higherIsBetter) {
      return stat1 > stat2 ? 'user1' : 'user2';
    } else {
      return stat1 < stat2 ? 'user1' : 'user2';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const GitHubStatsCard: React.FC<{ 
    userHandle: string; 
    stats: GitHubStats;
    position: 'left' | 'right';
  }> = ({ userHandle, stats, position }) => {
    const languageData = Object.entries(stats.topLanguages).map(([name, value]) => ({
      name,
      value
    }));

    const contributionData = [
      { name: 'Contributions', value: stats.contributions, fill: '#22c55e' },
      { name: 'Public Repos', value: stats.publicRepos, fill: '#3b82f6' },
      { name: 'Total Stars', value: stats.totalStars, fill: '#f59e0b' },
      { name: 'Followers', value: stats.followers, fill: '#8b5cf6' }
    ];

    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <Github className="w-8 h-8 text-gray-800" />
          </div>
          <h3 className="text-xl font-bold mb-2">{stats.username}</h3>
          <p className="text-gray-300 text-sm">{stats.bio || 'GitHub Developer'}</p>
          {stats.location && (
            <p className="text-gray-400 text-xs mt-1">📍 {stats.location}</p>
          )}
        </div>

        {/* GitHub Stats Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.publicRepos}</div>
            <div className="text-xs text-gray-300">Repositories</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.followers}</div>
            <div className="text-xs text-gray-300">Followers</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.totalStars}</div>
            <div className="text-xs text-gray-300">Total Stars</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{stats.contributions}</div>
            <div className="text-xs text-gray-300">Contributions</div>
          </div>
        </div>

        {/* Top Languages Pie Chart */}
        {languageData.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3 text-center">Top Languages</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={languageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {languageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: 'white'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {languageData.slice(0, 3).map((lang, index) => (
                <div key={lang.name} className="flex items-center text-xs">
                  <div 
                    className="w-3 h-3 rounded-full mr-1" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span>{lang.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Stats */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-300">Account Age</span>
            <span>{new Date(stats.createdAt).getFullYear()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-300">Following</span>
            <span>{stats.following}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-300">Total Forks</span>
            <span>{stats.totalForks}</span>
          </div>
        </div>
      </div>
    );
  };

  const StatCard: React.FC<{ 
    user: UserStats; 
    position: 'left' | 'right';
    isWinner?: boolean;
    isTie?: boolean;
  }> = ({ user, position, isWinner, isTie }) => (
    <div className={`relative transform transition-all duration-300 ${
      isWinner ? 'scale-105 z-10' : isTie ? 'scale-102' : 'scale-100'
    }`}>
      <div className={`bg-gradient-to-br ${getRankColor(user.maxRank)} rounded-2xl p-1 shadow-2xl`}>
        <div className="bg-white rounded-xl p-6 h-full">
          {/* Header */}
          <div className="text-center mb-6">
            <div className={`w-20 h-20 bg-gradient-to-br ${getRankColor(user.maxRank)} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
              <Code className={`w-10 h-10 ${getRankTextColor(user.maxRank)}`} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{user.handle}</h3>
            <p className="text-sm text-gray-600 mb-2">{user.email}</p>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getRankColor(user.maxRank)} text-white`}>
              {user.maxRank}
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="text-sm font-medium">Max Rating</span>
              </div>
              <span className="font-bold text-lg">{user.maxRating}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Target className="w-5 h-5 text-blue-500 mr-2" />
                <span className="text-sm font-medium">Current Rating</span>
              </div>
              <span className="font-bold text-lg">{user.currentRating}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Code className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-sm font-medium">CF Problems</span>
              </div>
              <span className="font-bold text-lg">{user.problemsSolved}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Zap className="w-5 h-5 text-orange-500 mr-2" />
                <span className="text-sm font-medium">Total Problems</span>
              </div>
              <span className="font-bold text-lg">{user.totalProblemsSolved}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-purple-500 mr-2" />
                <span className="text-sm font-medium">Avg Rating</span>
              </div>
              <span className="font-bold text-lg">{user.averageRating}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Award className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-sm font-medium">Best Rank</span>
              </div>
              <span className="font-bold text-lg">{user.bestRank || 'N/A'}</span>
            </div>

            {user.leetcodeHandle && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center">
                  <Code className="w-5 h-5 text-orange-600 mr-2" />
                  <span className="text-sm font-medium">LeetCode</span>
                </div>
                <span className="font-bold text-lg text-orange-600">{user.leetcodeProblemsSolved}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Winner Badge */}
      {isWinner && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
            🏆 WINNER
          </div>
        </div>
      )}
      
      {isTie && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gray-400 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            🤝 TIE
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back
            </button>
            <Trophy className="text-blue-600 w-8 h-8 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">User Comparison</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Selection */}
        {(!selectedUser1 || !selectedUser2) && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Users to Compare</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First User
                </label>
                <select
                  value={selectedUser1?.handle || ''}
                  onChange={(e) => {
                    const user = userStats.find(u => u.handle === e.target.value);
                    setSelectedUser1(user || null);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a user...</option>
                  {userStats
                    .filter(user => user.handle !== selectedUser2?.handle)
                    .map(user => (
                      <option key={user.handle} value={user.handle}>
                        {user.handle} ({user.maxRank})
                      </option>
                    ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Second User
                </label>
                <select
                  value={selectedUser2?.handle || ''}
                  onChange={(e) => {
                    const user = userStats.find(u => u.handle === e.target.value);
                    setSelectedUser2(user || null);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a user...</option>
                  {userStats
                    .filter(user => user.handle !== selectedUser1?.handle)
                    .map(user => (
                      <option key={user.handle} value={user.handle}>
                        {user.handle} ({user.maxRank})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Cards */}
        {selectedUser1 && selectedUser2 && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Head to Head</h2>
              <p className="text-gray-600">Compare coding achievements and statistics</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <StatCard 
                user={selectedUser1} 
                position="left"
                isWinner={
                  selectedUser1.totalProblemsSolved > selectedUser2.totalProblemsSolved ||
                  selectedUser1.maxRating > selectedUser2.maxRating
                }
                isTie={
                  selectedUser1.totalProblemsSolved === selectedUser2.totalProblemsSolved &&
                  selectedUser1.maxRating === selectedUser2.maxRating
                }
              />
              <StatCard 
                user={selectedUser2} 
                position="right"
                isWinner={
                  selectedUser2.totalProblemsSolved > selectedUser1.totalProblemsSolved ||
                  selectedUser2.maxRating > selectedUser1.maxRating
                }
                isTie={
                  selectedUser1.totalProblemsSolved === selectedUser2.totalProblemsSolved &&
                  selectedUser1.maxRating === selectedUser2.maxRating
                }
              />
            </div>

            {/* GitHub Stats Comparison */}
            {(githubStats[selectedUser1.handle] || githubStats[selectedUser2.handle]) && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">GitHub Development Activity</h2>
                  <p className="text-gray-600">Compare coding activity and contributions</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {githubStats[selectedUser1.handle] && (
                    <GitHubStatsCard 
                      userHandle={selectedUser1.handle}
                      stats={githubStats[selectedUser1.handle]}
                      position="left"
                    />
                  )}
                  {githubStats[selectedUser2.handle] && (
                    <GitHubStatsCard 
                      userHandle={selectedUser2.handle}
                      stats={githubStats[selectedUser2.handle]}
                      position="right"
                    />
                  )}
                </div>

                {/* GitHub Comparison Chart */}
                {githubStats[selectedUser1.handle] && githubStats[selectedUser2.handle] && (
                  <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">GitHub Stats Comparison</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            {
                              metric: 'Repositories',
                              [selectedUser1.handle]: githubStats[selectedUser1.handle].publicRepos,
                              [selectedUser2.handle]: githubStats[selectedUser2.handle].publicRepos,
                            },
                            {
                              metric: 'Followers',
                              [selectedUser1.handle]: githubStats[selectedUser1.handle].followers,
                              [selectedUser2.handle]: githubStats[selectedUser2.handle].followers,
                            },
                            {
                              metric: 'Stars Received',
                              [selectedUser1.handle]: githubStats[selectedUser1.handle].totalStars,
                              [selectedUser2.handle]: githubStats[selectedUser2.handle].totalStars,
                            },
                            {
                              metric: 'Contributions',
                              [selectedUser1.handle]: githubStats[selectedUser1.handle].contributions,
                              [selectedUser2.handle]: githubStats[selectedUser2.handle].contributions,
                            },
                          ]}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="metric" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey={selectedUser1.handle} fill="#3b82f6" />
                          <Bar dataKey={selectedUser2.handle} fill="#ef4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Detailed Comparison */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Detailed Comparison</h3>
              <div className="space-y-4">
                {[
                  { label: 'Max Rating', key: 'maxRating', icon: Trophy, higherIsBetter: true },
                  { label: 'Current Rating', key: 'currentRating', icon: Target, higherIsBetter: true },
                  { label: 'Total Problems', key: 'totalProblemsSolved', icon: Zap, higherIsBetter: true },
                  { label: 'CF Problems', key: 'problemsSolved', icon: Code, higherIsBetter: true },
                  { label: 'Average Rating', key: 'averageRating', icon: Star, higherIsBetter: true },
                  { label: 'Best Rank', key: 'bestRank', icon: Award, higherIsBetter: false },
                ].map(({ label, key, icon: Icon, higherIsBetter }) => {
                  const val1 = selectedUser1[key as keyof UserStats] as number;
                  const val2 = selectedUser2[key as keyof UserStats] as number;
                  const winner = getWinner(val1 || 0, val2 || 0, higherIsBetter);
                  
                  return (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Icon className="w-5 h-5 text-gray-600 mr-3" />
                        <span className="font-medium text-gray-900">{label}</span>
                      </div>
                      <div className="flex items-center space-x-8">
                        <div className={`text-right ${winner === 'user1' ? 'text-green-600 font-bold' : winner === 'tie' ? 'text-yellow-600 font-bold' : 'text-gray-600'}`}>
                          {val1 || 'N/A'}
                        </div>
                        <div className="text-gray-400">vs</div>
                        <div className={`text-left ${winner === 'user2' ? 'text-green-600 font-bold' : winner === 'tie' ? 'text-yellow-600 font-bold' : 'text-gray-600'}`}>
                          {val2 || 'N/A'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reset Button */}
            <div className="text-center mt-8">
              <button
                onClick={() => {
                  setSelectedUser1(null);
                  setSelectedUser2(null);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Compare Different Users
              </button>
            </div>
          </>
        )}

        {userStats.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No users available for comparison.</p>
          </div>
        )}
      </div>
    </div>
  );
};