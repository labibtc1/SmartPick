import React, { useState, useEffect } from 'react';
import { ArrowLeft, Target, Code, Star, ExternalLink, RefreshCw, Search, Filter } from 'lucide-react';
import { CodeforcesAPI } from '../../services/codeforcesApi';
import { FirebaseService } from '../../services/firebaseService';
import { UserStats, Submission, Problem } from '../../types';

interface RecommendedProblemsProps {
  onBack: () => void;
}

interface ProblemWithScore {
  problem: Problem;
  score: number;
  tags: string[];
  link: string;
}

export const RecommendedProblems: React.FC<RecommendedProblemsProps> = ({ onBack }) => {
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [selectedHandle, setSelectedHandle] = useState<string>('');
  const [recommendedProblems, setRecommendedProblems] = useState<ProblemWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

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

  const analyzeProblems = async () => {
    if (!selectedHandle) return;

    setAnalyzing(true);
    setError('');
    setRecommendedProblems([]);

    try {
      // Get user info to find current rating
      const userInfo = await CodeforcesAPI.getUserInfo(selectedHandle);
      const peakRating = userInfo.maxRating || 0;

      // Get user submissions
      const submissions = await CodeforcesAPI.getUserSubmissions(selectedHandle, 10000);

      // Step 1: Filter submissions with points > 0 OR verdict === 'OK'
      const validSubmissions = submissions.filter(submission => 
        (submission.points !== undefined && submission.points > 0) 
        ||  submission.verdict === 'OK'
      );

      // Step 2: Extract unique problems from submissions
      const problemMap = new Map<string, Problem>();
      validSubmissions.forEach(submission => {
        const problemKey = `${submission.problem.contestId}-${submission.problem.index}`;
        if (!problemMap.has(problemKey)) {
          problemMap.set(problemKey, submission.problem);
        }
      });

      // Step 3: Filter problems by peak rating + 200 (include problems without rating)
      const solvedProblems = Array.from(problemMap.values()).filter(problem => 
        problem.rating 
       // problem.rating <= peakRating + 200
        //&& problem.rating >= peakRating
        
      );

      if (solvedProblems.length === 0) {
        setError(`No problems found for user ${selectedHandle}. Make sure the handle is correct and the user has solved some problems.`);
        return;
      }

      // Step 4: Count tags across all filtered problems
      const tagCounts = new Map<string, number>();
      solvedProblems.forEach(problem => {
        problem.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      // Debug logging
      console.log(`Found ${validSubmissions.length} valid submissions`);
      console.log(`Found ${problemMap.size} unique problems`);
      console.log(`Found ${solvedProblems.length} problems after rating filter`);
      console.log(`Peak rating: ${peakRating}, filter: <= ${peakRating + 200}`);
      // Extract all unique tags for filtering
      const uniqueTags = Array.from(tagCounts.keys()).sort();
      setAllTags(uniqueTags);

      // create a new array named unsolvedproblems, 
      //how to create this array? 
      //create an array issolved, than mark all problems in ratingFilteredProblems as true
      //fetch all problems from codeforces and store only the problems with issolved = false in
      //unsolvedproblems array
      //how to fetch all problems? use this api  
      //https://codeforces.com/api/problemset.problems

      // Step 4.5: Create an array of solved problem keys
const isSolved = new Set(
  solvedProblems.map(p => `${p.contestId}-${p.index}`)
);

// Fetch all Codeforces problems
const allProblemsResponse = await fetch('https://codeforces.com/api/problemset.problems');
const allProblemsData = await allProblemsResponse.json();

if (allProblemsData.status !== 'OK') {
  throw new Error('Failed to fetch all problems from Codeforces');
}

// Extract all problems
const allProblems: Problem[] = allProblemsData.result.problems;

// Filter to only include problems not yet solved and rating within range
const unsolvedProblems = allProblems.filter(problem => {
  const key = `${problem.contestId}-${problem.index}`;
  return !isSolved.has(key) && 
    (problem.rating && problem.rating >= peakRating && problem.rating <= peakRating + 200);
});


      // Step 5 & 6: Calculate score for each problem and sort
      const problemsWithScores: ProblemWithScore[] = unsolvedProblems.map(problem => {
        const score = problem.tags.length > 0 
          ? problem.tags.reduce((sum, tag) => sum + (tagCounts.get(tag) || 0), 0)
          : 1; // Give problems without tags a base score of 1
        const link = `https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`;
        
        return {
          problem,
          score,
          tags: problem.tags,
          link
        };
      });

      // Sort by score in descending order
      problemsWithScores.sort((a, b) => b.score - a.score);

      console.log(`Generated ${problemsWithScores.length} recommendations`);
      setRecommendedProblems(problemsWithScores);
    } catch (error: any) {
      console.error('Error analyzing problems:', error);
      setError(`Failed to analyze problems: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredProblems = selectedTags.length > 0 
    ? recommendedProblems.filter(item => 
        selectedTags.some(tag => item.tags.includes(tag))
      )
    : recommendedProblems;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getDifficultyColor = (rating: number) => {
    if (rating < 1200) return 'text-gray-600';
    if (rating < 1400) return 'text-green-600';
    if (rating < 1600) return 'text-cyan-600';
    if (rating < 1900) return 'text-blue-600';
    if (rating < 2100) return 'text-purple-600';
    if (rating < 2300) return 'text-orange-600';
    if (rating < 2400) return 'text-red-600';
    return 'text-red-800';
  };

  const getTagColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            <Target className="text-blue-600 w-8 h-8 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Recommended Problems</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select User for Problem Recommendations</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Codeforces Handle
              </label>
              <select
                value={selectedHandle}
                onChange={(e) => setSelectedHandle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a user...</option>
                {userStats.map(user => (
                  <option key={user.handle} value={user.handle}>
                    {user.handle} (Peak Rating: {user.maxRating})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={analyzeProblems}
              disabled={!selectedHandle || analyzing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Get Recommendations
                </>
              )}
            </button>
          </div>
          
          {selectedHandle && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>How it works:</strong> We analyze {selectedHandle}'s solved problems to find patterns in their preferred tags, 
                then recommend problems with rating ≤ peak rating + 200 that match those preferences.
              </p>
            </div>
          )}
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <Filter className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Filter by Tags</h3>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="ml-4 text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag, index) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : getTagColor(index)
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Recommended Problems */}
        {filteredProblems.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Recommended Problems ({filteredProblems.length})
                </h2>
                <div className="text-sm text-gray-600">
                  Sorted by tag preference score
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredProblems.map((item, index) => (
                <div key={`${item.problem.contestId}-${item.problem.index}`} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-sm font-medium text-gray-500 mr-3">
                          #{index + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900 mr-3">
                          {item.problem.name}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {item.problem.contestId}{item.problem.index}
                        </span>
                      </div>
                      
                      <div className="flex items-center mb-3">
                        <div className="flex items-center mr-6">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="text-sm font-medium">Score: {item.score}</span>
                        </div>
                        {item.problem.rating && (
                          <div className="flex items-center">
                            <Code className="w-4 h-4 text-gray-500 mr-1" />
                            <span className={`text-sm font-medium ${getDifficultyColor(item.problem.rating)}`}>
                              {item.problem.rating}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.tags.map((tag, tagIndex) => (
                          <span
                            key={tag}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tagIndex)}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Solve Problem
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!analyzing && !error && filteredProblems.length === 0 && selectedHandle && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No recommended problems found.</p>
            <p className="text-gray-400 text-sm mt-2">
              Try selecting a different user or adjusting the tag filters.
            </p>
          </div>
        )}

        {/* Initial State */}
        {!selectedHandle && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Select a user to get problem recommendations</p>
            <p className="text-gray-400 text-sm mt-2">
              We'll analyze their solving patterns and suggest problems with rating ≤ peak rating + 200.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};