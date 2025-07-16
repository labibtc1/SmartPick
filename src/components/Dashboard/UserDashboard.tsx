import React, { useState } from 'react';
import { User, Settings, Trophy, LogOut } from 'lucide-react';
import { FirebaseService } from '../../services/firebaseService';
import { CodeforcesAPI } from '../../services/codeforcesApi';
import { useAuth } from '../../hooks/useAuth';

export const UserDashboard: React.FC = () => {
  const { user, userData } = useAuth();
  const [codeforcesHandle, setCodeforcesHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
          </div>

          <form onSubmit={handleSubmitHandle} className="space-y-6">
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

          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">How it works</h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• Enter your Codeforces handle to connect your account</li>
              <li>• Your statistics will be automatically fetched and updated</li>
              <li>• Only the admin can view the leaderboard rankings</li>
              <li>• Your data includes solved problems, ratings, and contest performance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};