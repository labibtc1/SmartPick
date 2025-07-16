import React, { useState } from 'react';
import { User, Settings, Trophy, LogOut } from 'lucide-react';
import { FirebaseService } from '../../services/firebaseService';
import { CodeforcesAPI } from '../../services/codeforcesApi';
import { LeetCodeAPI } from '../../services/leetcodeApi';
import { useAuth } from '../../hooks/useAuth';

export const UserDashboard: React.FC = () => {
  const { user, userData } = useAuth();
  const [codeforcesHandle, setCodeforcesHandle] = useState('');
  const [leetcodeHandle, setLeetcodeHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [leetcodeLoading, setLeetcodeLoading] = useState(false);
  const [error, setError] = useState('');
  const [leetcodeError, setLeetcodeError] = useState('');
  const [success, setSuccess] = useState('');
  const [leetcodeSuccess, setLeetcodeSuccess] = useState('');

  const handleSubmitHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate handle by fetching user info
      const userInfo = await CodeforcesAPI.getUserInfo(codeforcesHandle);
      
      // Get user stats
      const stats = await CodeforcesAPI.getUserStats(codeforcesHandle, user.email!);
      
      // Save to Firebase
      await FirebaseService.updateCodeforcesHandle(user.uid, codeforcesHandle);
      await FirebaseService.saveUserStats(user.uid, stats);
      
      setSuccess('Codeforces handle updated successfully!');
      setCodeforcesHandle('');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLeetcodeHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLeetcodeLoading(true);
    setLeetcodeError('');
    setLeetcodeSuccess('');

    try {
      // Validate LeetCode handle
      await LeetCodeAPI.getUserStats(leetcodeHandle);
      
      // Update LeetCode handle in Firebase
      await FirebaseService.updateLeetcodeHandle(user.uid, leetcodeHandle);
      
      // If user has Codeforces handle, update combined stats
      if (userData?.codeforcesHandle) {
        const codeforcesStats = await CodeforcesAPI.getUserStats(userData.codeforcesHandle, user.email!);
        await FirebaseService.updateUserStatsWithLeetcode(user.uid, codeforcesStats, leetcodeHandle);
      }
      
      setLeetcodeSuccess('LeetCode handle updated successfully!');
      setLeetcodeHandle('');
    } catch (error: any) {
      setLeetcodeError(error.message);
    } finally {
      setLeetcodeLoading(false);
    }
  };

  const handleSignOut = async () => {
    await FirebaseService.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Trophy className="text-blue-600 w-8 h-8 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Codeforces Leaderboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.email}</span>
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="text-blue-600 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">User Profile</h2>
            <p className="text-gray-600">
              {userData?.codeforcesHandle 
                ? `Connected to Codeforces: ${userData.codeforcesHandle}`
                : 'Connect your Codeforces account to participate in the leaderboard'
              }
            </p>
            <p className="text-gray-600">
              {userData?.leetcodeHandle 
                ? `LeetCode: ${userData.leetcodeHandle}`
                : 'Connect your LeetCode account'
              }
            </p>
          </div>

          <div className="space-y-8">
            <form onSubmit={handleSubmitHandle} className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Codeforces Account</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Codeforces Handle
                </label>
                <input
                  type="text"
                  value={codeforcesHandle}
                  onChange={(e) => setCodeforcesHandle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your Codeforces handle"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Your Codeforces username (e.g., tourist, Petr)
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Updating...' : 'Update Codeforces Handle'}
              </button>
            </form>

            <div className="border-t border-gray-200 pt-8">
              <form onSubmit={handleSubmitLeetcodeHandle} className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">LeetCode Account</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LeetCode Handle
                  </label>
                  <input
                    type="text"
                    value={leetcodeHandle}
                    onChange={(e) => setLeetcodeHandle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your LeetCode handle"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Your LeetCode username (e.g., john_doe)
                  </p>
                </div>

                {leetcodeError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{leetcodeError}</p>
                  </div>
                )}

                {leetcodeSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-700 text-sm">{leetcodeSuccess}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={leetcodeLoading}
                  className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {leetcodeLoading ? 'Updating...' : 'Update LeetCode Handle'}
                </button>
              </form>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">How it works</h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• Enter your Codeforces and LeetCode handles to connect your accounts</li>
              <li>• Your statistics will be automatically fetched and combined</li>
              <li>• Only the admin can view the leaderboard rankings</li>
              <li>• Combined problem count includes both platforms</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};