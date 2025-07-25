import React, { useState, useEffect } from 'react';
import { Trophy, Users, Filter, RefreshCw, LogOut, ArrowUpDown, Users as Versus, Target } from 'lucide-react';
import { FirebaseService } from '../../services/firebaseService';
import { UserComparison } from './UserComparison';
import { RecommendedProblems } from './RecommendedProblems';
import { UserStats } from '../../types';
import { useAuth } from '../../hooks/useAuth';

type SortField = 'problemsSolved' | 'totalProblemsSolved' | 'maxRating' | 'bestRank' | 'averageRating';
type SortOrder = 'asc' | 'desc';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [showComparison, setShowComparison] = useState(false);
  const [showRecommendedProblems, setShowRecommendedProblems] = useState(false);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('maxRating');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      const stats = await FirebaseService.getAllUserStats();
      setUserStats(stats);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedStats = [...userStats].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortField) {
      case 'problemsSolved':
        aValue = a.problemsSolved;
        bValue = b.problemsSolved;
        break;
      case 'totalProblemsSolved':
        aValue = a.totalProblemsSolved;
        bValue = b.totalProblemsSolved;
        break;
      case 'maxRating':
        aValue = a.maxRating;
        bValue = b.maxRating;
        break;
      case 'bestRank':
        aValue = a.bestRank || 999999;
        bValue = b.bestRank || 999999;
        break;
      case 'averageRating':
        aValue = a.averageRating;
        bValue = b.averageRating;
        break;
      default:
        aValue = a.maxRating;
        bValue = b.maxRating;
    }

    if (sortOrder === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  const getRankColor = (rank: string) => {
    const colors: { [key: string]: string } = {
      'legendary grandmaster': 'text-red-600',
      'international grandmaster': 'text-red-500',
      'grandmaster': 'text-red-400',
      'international master': 'text-orange-500',
      'master': 'text-orange-400',
      'candidate master': 'text-purple-500',
      'expert': 'text-blue-500',
      'specialist': 'text-cyan-500',
      'pupil': 'text-green-500',
      'newbie': 'text-gray-500'
    };
    return colors[rank?.toLowerCase()] || 'text-gray-500';
  };

  const handleSignOut = async () => {
    await FirebaseService.signOut();
  };

  if (showComparison) {
    return <UserComparison onBack={() => setShowComparison(false)} />;
  }

  if (showRecommendedProblems) {
    return <RecommendedProblems onBack={() => setShowRecommendedProblems(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Trophy className="text-blue-600 w-8 h-8 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Admin Panel</span>
              <button
                onClick={handleSignOut}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5 mr-1" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Users className="text-blue-600 w-6 h-6 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">
                  Codeforces Leaderboard ({userStats.length} users)
                </h2>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowRecommendedProblems(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Recommended Problems
                </button>
                <button
                  onClick={() => setShowComparison(true)}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Versus className="w-4 h-4 mr-2" />
                  Compare Users
                </button>
                <button
                  onClick={loadUserStats}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Handle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('problemsSolved')}
                  >
                    <div className="flex items-center">
                      CF Problems
                      <ArrowUpDown className="w-4 h-4 ml-1" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('totalProblemsSolved')}
                  >
                    <div className="flex items-center">
                      Total Problems
                      <ArrowUpDown className="w-4 h-4 ml-1" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('maxRating')}
                  >
                    <div className="flex items-center">
                      Max Rating
                      <ArrowUpDown className="w-4 h-4 ml-1" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('bestRank')}
                  >
                    <div className="flex items-center">
                      Best Rank
                      <ArrowUpDown className="w-4 h-4 ml-1" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('averageRating')}
                  >
                    <div className="flex items-center">
                      Avg Rating
                      <ArrowUpDown className="w-4 h-4 ml-1" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Rating
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedStats.map((stat, index) => (
                  <tr key={stat.handle} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">CF: {stat.handle}</div>
                        {stat.leetcodeHandle && (
                          <div className="text-sm text-orange-600">LC: {stat.leetcodeHandle}</div>
                        )}
                      </div>
                      <div className={`text-sm ${getRankColor(stat.maxRank)}`}>
                        {stat.maxRank}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.problemsSolved}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{stat.totalProblemsSolved}</div>
                      {stat.leetcodeProblemsSolved > 0 && (
                        <div className="text-xs text-gray-500">
                          CF: {stat.problemsSolved} + LC: {stat.leetcodeProblemsSolved}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.maxRating}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.bestRank || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.averageRating}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.currentRating}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {userStats.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users have submitted their handles yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};