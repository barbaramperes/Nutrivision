import React, { useState, useRef, useEffect } from 'react';
import { Camera, TrendingUp, Target, Users, Award, Zap, Eye, Brain, Heart, Share2, BarChart3, Trophy, BookOpen, Briefcase, GraduationCap, Stethoscope, Globe, Crown, Star, Play, Mic, Home, Bell, User, Settings, CheckCircle, AlertTriangle, Loader, LogIn, UserPlus, History, Dna, Sparkles, Clock, Flame, MessageCircle, ThumbsUp, Rocket, Lightbulb, Timer, Activity, TrendingDown } from 'lucide-react';

const NutriVisionRevolutionaryApp = () => {
  const [currentView, setCurrentView] = useState('login');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '', email: '', password: '', age: '', current_weight: '', target_weight: '', height: '', gender: 'male'
  });

  // Revolutionary features state
  const [foodDNA, setFoodDNA] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [socialFeed, setSocialFeed] = useState([]);
  const [predictiveInsights, setPredictiveInsights] = useState(null);
  const [moodBefore, setMoodBefore] = useState('neutral');
  const [socialContext, setSocialContext] = useState('alone');

  const fileInputRef = useRef(null);
  const API_BASE = 'http://localhost:5001/api';

  // API helper function
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API Error');
      }

      return data;
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  };

  // Revolutionary logo component
  const renderRevolutionaryLogo = () => (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Eye className="w-7 h-7 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
      </div>
      <div>
        <h1 className="text-2xl font-black text-gray-900">
          Nutri<span className="text-orange-500">Vision</span>
          <span className="text-pink-500 text-sm"> PRO</span>
        </h1>
        <p className="text-xs text-gray-600 font-medium">Revolutionary AI Coach</p>
      </div>
    </div>
  );

  // Login function
  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await apiCall('/login', {
        method: 'POST',
        body: JSON.stringify(loginData)
      });

      setUser(result.user);
      setCurrentView('dashboard');
      await loadAdvancedUserStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await apiCall('/register', {
        method: 'POST',
        body: JSON.stringify({
          ...registerData,
          age: parseInt(registerData.age),
          current_weight: parseFloat(registerData.current_weight),
          target_weight: parseFloat(registerData.target_weight),
          height: parseFloat(registerData.height)
        })
      });

      setUser(result.user);
      setCurrentView('dashboard');
      await loadAdvancedUserStats();

      alert(`🎉 Welcome ${result.user.username}! Your revolutionary journey begins!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load user stats
  const loadAdvancedUserStats = async () => {
    try {
      const stats = await apiCall('/user/stats-advanced');
      setUserStats(stats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Load Food DNA
  const loadFoodDNA = async () => {
    try {
      const dna = await apiCall('/food-dna');
      setFoodDNA(dna);
    } catch (err) {
      console.error('Error loading DNA:', err);
    }
  };

  // Load predictions
  const loadPredictiveInsights = async () => {
    try {
      const insights = await apiCall('/predictive-insights');
      setPredictiveInsights(insights);
    } catch (err) {
      console.error('Error loading predictions:', err);
    }
  };

  // Handle image upload and analysis
  const handleRevolutionaryImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      setUploadedImage(e.target.result);
      setIsAnalyzing(true);
      setCurrentView('revolutionary-analysis');

      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('meal_type', 'lunch');
        formData.append('mood_before', moodBefore);
        formData.append('social_context', socialContext);

        const response = await fetch(`${API_BASE}/analyze-revolutionary`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Analysis error');
        }

        setAnalysisResult(result.analysis);

        // Update user stats
        if (user) {
          setUser(prev => ({
            ...prev,
            total_xp: result.new_total_xp,
            level: result.new_level,
            streak_days: result.streak_days
          }));
        }

        // Show revolutionary features unlocked
        if (result.dna_unlocked) {
          alert('🧬 REVOLUTIONARY FEATURE UNLOCKED: Your Food DNA Profile is now available!');
          loadFoodDNA();
        }

        if (result.new_badges && result.new_badges.length > 0) {
          alert(`🏆 New badges unlocked: ${result.new_badges.map(b => b.name).join(', ')}!`);
        }

      } catch (err) {
        setError(err.message);
        setAnalysisResult({
          foods_detected: ['Analysis error'],
          nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          revolutionary_insights: {},
          health_assessment: { score: 0, obesity_risk: 'Unknown' },
          ai_feedback: 'Error processing analysis. Please try again.',
          suggestions: ['Check connection and try again']
        });
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const stats = await apiCall('/user/stats-advanced');
        setUser(stats.user);
        setUserStats(stats);
        setCurrentView('dashboard');
      } catch (err) {
        setCurrentView('login');
      }
    };

    checkAuth();
  }, []);

  // Load data when views change
  useEffect(() => {
    if (currentView === 'food-dna' && user) {
      loadFoodDNA();
    } else if (currentView === 'predictions' && user) {
      loadPredictiveInsights();
    }
  }, [currentView, user]);

  // Login screen
  const renderLogin = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          {renderRevolutionaryLogo()}
          <p className="text-gray-600 mt-4 font-medium">See, Analyze, Transform with Revolutionary AI</p>
          <div className="flex justify-center space-x-2 mt-3">
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">🧬 Food DNA</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">🔮 Predictions</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={login} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : '🚀 Enter Revolutionary AI'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => setCurrentView('register')}
            className="text-orange-600 font-medium hover:text-orange-700"
          >
            Don't have an account? Join the Revolution
          </button>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl border border-orange-200">
          <p className="text-xs text-center font-bold text-gray-700 mb-2">🎯 TRY DEMO ACCOUNT</p>
          <p className="text-xs text-gray-600 text-center">
            <strong>Email:</strong> demo@nutrivision.com<br />
            <strong>Password:</strong> password123
          </p>
        </div>
      </div>
    </div>
  );

  // Register screen
  const renderRegister = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md max-h-screen overflow-y-auto">
        <div className="text-center mb-6">
          {renderRevolutionaryLogo()}
          <p className="text-gray-600 mt-2">Join the Revolution</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={register} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Username</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={registerData.username}
              onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={registerData.email}
              onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={registerData.password}
              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Age</label>
              <input
                type="number"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={registerData.age}
                onChange={(e) => setRegisterData({ ...registerData, age: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Gender</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={registerData.gender}
                onChange={(e) => setRegisterData({ ...registerData, gender: e.target.value })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Current Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={registerData.current_weight}
                onChange={(e) => setRegisterData({ ...registerData, current_weight: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Target (kg)</label>
              <input
                type="number"
                step="0.1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={registerData.target_weight}
                onChange={(e) => setRegisterData({ ...registerData, target_weight: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Height (cm)</label>
            <input
              type="number"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={registerData.height}
              onChange={(e) => setRegisterData({ ...registerData, height: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : '🚀 Join Revolution'}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => setCurrentView('login')}
            className="text-orange-600 font-medium hover:text-orange-700"
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  );

  // Dashboard screen  
  const renderDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 pb-20">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          {renderRevolutionaryLogo()}
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">Hi, {user?.username}! 🚀</div>
            <div className="text-sm text-gray-600">{user?.level} • Level {user?.total_xp || 0} XP</div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 p-4 rounded-2xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">🧬 Revolutionary AI Active</p>
              <p className="text-orange-100 text-sm">Food DNA • Predictions • AI Coach</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{userStats?.advanced_stats?.personality_unlocked ? '🧬' : '⏳'}</div>
              <div className="text-xs text-orange-200">
                {userStats?.advanced_stats?.personality_unlocked ? 'DNA Unlocked' : 'DNA Pending'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-orange-500 to-red-600 p-4 rounded-2xl text-white shadow-lg">
          <Crown className="w-8 h-8 mb-2" />
          <div className="text-2xl font-bold">{user?.total_xp || 0}</div>
          <div className="text-orange-100 text-sm">Total XP</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-2xl text-white shadow-lg">
          <Flame className="w-8 h-8 mb-2" />
          <div className="text-2xl font-bold">{user?.streak_days || 0}</div>
          <div className="text-purple-100 text-sm">Day Streak</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl text-white shadow-lg">
          <Brain className="w-8 h-8 mb-2" />
          <div className="text-2xl font-bold">{userStats?.advanced_stats?.total_analyses || 0}</div>
          <div className="text-blue-100 text-sm">AI Analyses</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-4 rounded-2xl text-white shadow-lg">
          <Trophy className="w-8 h-8 mb-2" />
          <div className="text-2xl font-bold">{userStats?.advanced_stats?.badges_earned || 0}</div>
          <div className="text-emerald-100 text-sm">Badges</div>
        </div>
      </div>

      {/* Revolutionary Features */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setCurrentView('food-dna')}
          className="bg-gradient-to-br from-pink-500 to-rose-600 p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          <Dna className="w-10 h-10 mb-3 mx-auto" />
          <div className="font-bold text-lg">🧬 Food DNA</div>
          <div className="text-pink-100 text-sm">
            {userStats?.advanced_stats?.personality_unlocked ? 'View Profile' : 'Unlock Soon'}
          </div>
        </button>

        <button
          onClick={() => setCurrentView('predictions')}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          <Sparkles className="w-10 h-10 mb-3 mx-auto" />
          <div className="font-bold text-lg">🔮 Predictions</div>
          <div className="text-indigo-100 text-sm">Future Insights</div>
        </button>
      </div>

      {/* AI Scanner */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Camera className="w-6 h-6 mr-2 text-orange-500" />
          Revolutionary AI Scanner
        </h2>

        {/* Context Selection */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
            <select
              value={moodBefore}
              onChange={(e) => setMoodBefore(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="happy">😊 Happy</option>
              <option value="neutral">😐 Neutral</option>
              <option value="stressed">😰 Stressed</option>
              <option value="sad">😢 Sad</option>
              <option value="excited">🤩 Excited</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Social Context</label>
            <select
              value={socialContext}
              onChange={(e) => setSocialContext(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="alone">🧘 Alone</option>
              <option value="family">👨‍👩‍👧‍👦 Family</option>
              <option value="friends">👥 Friends</option>
              <option value="work">💼 Work</option>
            </select>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-8 text-center border-2 border-dashed border-gray-300">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Revolutionary Analysis</h3>
          <p className="text-gray-600 mb-6">AI will predict satisfaction, energy, sleep impact, and more!</p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-orange-500/30 transform hover:scale-105 transition-all duration-300"
          >
            🚀 Analyze with Revolutionary AI (+50 XP)
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleRevolutionaryImageUpload}
        className="hidden"
      />
    </div>
  );

  // Analysis screen with loading animation
  const renderRevolutionaryAnalysis = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentView('dashboard')} className="text-gray-800 text-2xl font-bold">←</button>
        <h1 className="text-lg font-bold text-gray-900">🚀 Revolutionary AI Analysis</h1>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isAnalyzing ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`}></div>
          <span className={`text-sm font-medium ${isAnalyzing ? 'text-orange-600' : 'text-emerald-600'}`}>
            {isAnalyzing ? 'Analyzing...' : 'Complete'}
          </span>
        </div>
      </div>

      {uploadedImage && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
            <div className="relative">
              <img src={uploadedImage} className="w-full h-64 object-cover" alt="Analyzed meal" />

              {isAnalyzing && (
                <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="relative mb-6">
                      <Brain className="w-16 h-16 text-orange-500 mx-auto animate-pulse" />
                      <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">🧬 Revolutionary AI Analyzing...</h3>
                    <p className="text-orange-300 mb-4">Processing with GPT-4o Vision + Psychology</p>

                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center justify-center space-x-2">
                        <Sparkles className="w-4 h-4 text-pink-400" />
                        <span>Analyzing food DNA impact...</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <span>Predicting energy timeline...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!isAnalyzing && analysisResult && (
                <>
                  <div className="absolute top-4 left-4 bg-red-600 bg-opacity-95 backdrop-blur-sm px-3 py-2 rounded-xl text-white font-bold text-sm shadow-lg">
                    ⚠️ {analysisResult.nutrition?.calories || 0} kcal
                  </div>
                  <div className="absolute top-4 right-4 bg-emerald-600 bg-opacity-95 backdrop-blur-sm px-3 py-2 rounded-xl text-white font-bold text-sm shadow-lg">
                    ✓ {analysisResult.nutrition?.protein || 0}g protein
                  </div>
                  <div className="absolute bottom-4 left-4 bg-orange-600 bg-opacity-95 backdrop-blur-sm px-3 py-2 rounded-xl text-white font-bold text-sm shadow-lg">
                    🎯 Score: {analysisResult.health_assessment?.score || 0}/10
                  </div>
                </>
              )}
            </div>

            {!isAnalyzing && analysisResult && (
              <div className="p-6">
                {/* Foods Detected */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-orange-500" />
                    Foods Detected by AI
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.foods_detected?.map((food, index) => (
                      <span key={index} className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium border border-orange-200">
                        {food}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Revolutionary Insights */}
                {analysisResult.revolutionary_insights && (
                  <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-6 rounded-2xl text-white mb-6 shadow-lg">
                    <h3 className="font-bold text-xl mb-4 flex items-center">
                      <Sparkles className="w-6 h-6 mr-2" />
                      🚀 Revolutionary Insights
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                        <div className="text-sm text-purple-100">Satisfaction</div>
                        <div className="text-2xl font-bold">
                          {analysisResult.revolutionary_insights?.satisfaction_prediction || 7.5}/10
                        </div>
                      </div>
                      <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                        <div className="text-sm text-purple-100">Sleep Impact</div>
                        <div className="text-2xl font-bold">
                          {analysisResult.revolutionary_insights?.sleep_impact > 0 ? '+' : ''}{analysisResult.revolutionary_insights?.sleep_impact || 0}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain className="w-5 h-5" />
                        <span className="font-semibold">Eating Personality:</span>
                      </div>
                      <div className="text-lg font-bold text-yellow-200">
                        {analysisResult.revolutionary_insights?.personality_type || 'Balanced Eater'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Nutritional Breakdown */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="bg-gradient-to-br from-red-500 to-red-700 p-3 rounded-xl text-white text-center shadow-md">
                    <div className="text-lg font-bold">{analysisResult.nutrition?.calories || 0}</div>
                    <div className="text-red-200 text-xs">Calories</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-3 rounded-xl text-white text-center shadow-md">
                    <div className="text-lg font-bold">{analysisResult.nutrition?.protein || 0}g</div>
                    <div className="text-blue-200 text-xs">Protein</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl text-white text-center shadow-md">
                    <div className="text-lg font-bold">{analysisResult.nutrition?.carbs || 0}g</div>
                    <div className="text-amber-200 text-xs">Carbs</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl text-white text-center shadow-md">
                    <div className="text-lg font-bold">{analysisResult.nutrition?.fat || 0}g</div>
                    <div className="text-purple-200 text-xs">Fat</div>
                  </div>
                </div>

                {/* AI Feedback */}
                <div className="bg-gradient-to-r from-orange-500 to-red-600 p-5 rounded-2xl text-white mb-6 shadow-lg">
                  <h3 className="font-bold text-lg mb-3 flex items-center">
                    <Brain className="w-6 h-6 mr-2" />
                    🧠 AI Analysis
                  </h3>
                  <p className="text-orange-100 leading-relaxed">{analysisResult.ai_feedback}</p>
                </div>

                {/* Suggestions */}
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-5 rounded-2xl text-white shadow-lg">
                  <h3 className="font-bold text-lg mb-3 flex items-center">
                    <Lightbulb className="w-6 h-6 mr-2" />
                    🎯 Suggestions
                  </h3>
                  <div className="space-y-2">
                    {analysisResult.suggestions?.map((suggestion, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-200 mt-0.5 flex-shrink-0" />
                        <span className="text-green-100 text-sm">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isAnalyzing && analysisResult && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setCurrentView('dashboard');
                  loadAdvancedUserStats();
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-green-500/30 transform hover:scale-105 transition-all"
              >
                💾 Save & Continue
              </button>
              <button
                onClick={() => setCurrentView('food-dna')}
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-purple-500/30 transform hover:scale-105 transition-all"
              >
                🧬 View DNA Impact
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Food DNA screen
  const renderFoodDNA = () => (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentView('dashboard')} className="text-gray-800 text-2xl font-bold">←</button>
        <h1 className="text-lg font-bold text-gray-900 flex items-center">
          <Dna className="w-6 h-6 mr-2 text-pink-500" />
          🧬 Your Food DNA
        </h1>
        <div className="w-8"></div>
      </div>

      {!foodDNA?.dna_profile ? (
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Dna className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🧬 Food DNA Generating...</h2>
          <p className="text-gray-600 mb-6">
            Your unique eating personality is being analyzed. Complete more meal analyses to unlock!
          </p>
          <div className="bg-gray-100 rounded-full h-4 mb-4">
            <div
              className="bg-gradient-to-r from-pink-500 to-purple-600 h-4 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (foodDNA?.current_analyses || 0) * 20)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">
            {foodDNA?.current_analyses || 0}/5 analyses complete
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* DNA Profile Header */}
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 p-6 rounded-3xl text-white shadow-lg">
            <h2 className="text-2xl font-bold mb-2">🧬 Your Food DNA Unlocked!</h2>
            <p className="text-pink-100">Based on your meal analyses</p>
          </div>

          {/* Dominant Genes */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-pink-500" />
              🧬 Dominant Food Genes
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {foodDNA.dna_profile.dominant_genes?.map((gene, index) => (
                <div key={index} className="bg-gradient-to-r from-pink-100 to-purple-100 p-4 rounded-xl border border-pink-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {gene === 'Optimizer' ? '🎯' :
                          gene === 'Explorer' ? '🌍' :
                            gene === 'Emotional' ? '💭' :
                              gene === 'Social' ? '👥' : '🌱'}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{gene} Gene</div>
                      <div className="text-sm text-gray-600">
                        {gene === 'Optimizer' ? 'You prioritize health and efficiency' :
                          gene === 'Explorer' ? 'You love trying new foods' :
                            gene === 'Emotional' ? 'Mood influences your choices' :
                              gene === 'Social' ? 'You enjoy food socially' : 'Still developing'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Predictions screen
  const renderPredictions = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentView('dashboard')} className="text-gray-800 text-2xl font-bold">←</button>
        <h1 className="text-lg font-bold text-gray-900 flex items-center">
          <Sparkles className="w-6 h-6 mr-2 text-indigo-500" />
          🔮 Predictive Insights
        </h1>
        <div className="w-8"></div>
      </div>

      {!predictiveInsights?.predictions ? (
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🔮 Generating Predictions...</h2>
          <p className="text-gray-600 mb-6">
            {predictiveInsights?.analyses_needed ?
              `Need ${predictiveInsights.analyses_needed} more analyses for predictions` :
              'Analyzing your patterns to predict future outcomes'
            }
          </p>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-bold"
          >
            Analyze More Meals
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Prediction Header */}
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-600 p-6 rounded-3xl text-white shadow-lg">
            <h2 className="text-2xl font-bold mb-2">🔮 Future Insights Ready!</h2>
            <p className="text-indigo-100">Based on your eating patterns</p>
          </div>

          {/* Weight Predictions */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              ⚖️ Weight Predictions
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="text-sm text-blue-600 mb-1">1 Month</div>
                <div className="text-xl font-bold text-blue-700">
                  {predictiveInsights.predictions.weight_prediction?.['1_month'] || user?.current_weight}kg
                </div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <div className="text-sm text-purple-600 mb-1">3 Months</div>
                <div className="text-xl font-bold text-purple-700">
                  {predictiveInsights.predictions.weight_prediction?.['3_months'] || user?.current_weight}kg
                </div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-red-50 rounded-xl border border-pink-200">
                <div className="text-sm text-pink-600 mb-1">6 Months</div>
                <div className="text-xl font-bold text-pink-700">
                  {predictiveInsights.predictions.weight_prediction?.['6_months'] || user?.current_weight}kg
                </div>
              </div>
            </div>
          </div>

          {/* Health Trajectory */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-500" />
              💊 Health Trajectory
            </h3>

            <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200">
              <div className="text-sm text-emerald-600 mb-1">Health Trend</div>
              <div className="text-xl font-bold text-emerald-700">
                {predictiveInsights.predictions.health_trajectory === 'improving' ? '📈 Improving' :
                  predictiveInsights.predictions.health_trajectory === 'concerning' ? '📉 Concerning' : '➡️ Stable'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Navigation bar
  const renderRevolutionaryNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 shadow-2xl">
      <div className="flex justify-around items-center">
        {[
          { id: 'dashboard', icon: Home, label: 'Dashboard' },
          { id: 'food-dna', icon: Dna, label: 'DNA' },
          { id: 'predictions', icon: Sparkles, label: 'Predictions' },
          { id: 'profile', icon: User, label: 'Profile' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${currentView === item.id
              ? 'text-orange-600 bg-orange-50'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <item.icon className={`w-5 h-5 mb-1 ${currentView === item.id ? 'text-orange-600' : ''
              }`} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // Profile screen
  const renderProfile = () => (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.username}</h1>
            <p className="text-gray-600">{user?.level} • {user?.total_xp || 0} XP</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-xl">
            <div className="text-blue-600 font-semibold">Current</div>
            <div className="text-2xl font-bold text-blue-700">{user?.current_weight || 0}kg</div>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl">
            <div className="text-emerald-600 font-semibold">Target</div>
            <div className="text-2xl font-bold text-emerald-700">{user?.target_weight || 0}kg</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Settings</h2>

        <div className="space-y-3">
          <button
            onClick={() => setCurrentView('food-dna')}
            className="w-full flex items-center justify-between p-4 bg-pink-50 rounded-xl hover:bg-pink-100 transition-all"
          >
            <div className="flex items-center space-x-3">
              <Dna className="w-5 h-5 text-pink-600" />
              <span className="font-medium text-pink-900">Food DNA Profile</span>
            </div>
            <span className="text-pink-500">→</span>
          </button>

          <button
            onClick={() => setCurrentView('predictions')}
            className="w-full flex items-center justify-between p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-all"
          >
            <div className="flex items-center space-x-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">Predictive Insights</span>
            </div>
            <span className="text-purple-500">→</span>
          </button>

          <button
            onClick={() => {
              setUser(null);
              setCurrentView('login');
            }}
            className="w-full flex items-center justify-between p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-all"
          >
            <div className="flex items-center space-x-3">
              <LogIn className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-700">Sign Out</span>
            </div>
            <span className="text-red-500">→</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="relative min-h-screen bg-gray-50">
      {currentView === 'login' && renderLogin()}
      {currentView === 'register' && renderRegister()}
      {currentView === 'dashboard' && renderDashboard()}
      {currentView === 'revolutionary-analysis' && renderRevolutionaryAnalysis()}
      {currentView === 'food-dna' && renderFoodDNA()}
      {currentView === 'predictions' && renderPredictions()}
      {currentView === 'profile' && renderProfile()}

      {/* Navigation */}
      {user && !['login', 'register'].includes(currentView) && renderRevolutionaryNavigation()}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 max-w-sm">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <div className="flex-1">
              <div className="font-bold text-sm">Error</div>
              <div className="text-xs text-red-100">{error}</div>
            </div>
            <button onClick={() => setError('')} className="text-red-200 hover:text-white">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 flex items-center space-x-4">
            <Loader className="w-6 h-6 animate-spin text-orange-500" />
            <span className="font-medium text-gray-900">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutriVisionRevolutionaryApp;