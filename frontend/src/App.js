import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image,
  Dna,
  Loader,
  CheckCircle,
  AlertTriangle,
  Home,
  Settings,
  BookOpen,
  Moon,
  Calendar,
  Utensils,
  History,
  Trash2,
  Save,
  ArrowLeft,
  Eye,
  Sparkles,
  Activity,
  Brain,
  Lightbulb,
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Plus,
  Clock as ClockIcon,
  Users as UsersIcon,
  Flame,
  Drumstick as DrumstickIcon,
  // ← APENAS O Tag É NECESSÁRIO:
  Tag,
  UserIcon,
  Edit3,
  Target,
  TrendingUp,
  Award,
  Scale,
  Ruler,
  User,
  Mail,
  Heart,
  Zap,
  Star,
  Trophy,
  ArrowUp,
  ArrowDown,
  Coffee,
Sun,
Sunset
} from 'lucide-react';

const defaultUserProfile = {
  user: {
    username: "Alex Johnson",
    email: "alex.johnson@example.com",
    age: 28,
    current_weight: 75.5,
    target_weight: 70.0,
    height: 175,
    gender: "male",
    profile_photo: null,
    streak_days: 12,
    level: "Nutrition Explorer",
    total_xp: 1250,
    badges_earned: 8,
  },
  metrics: {
    bmi: 24.6,
    bmr: 1680,
    tdee: 2350,
  },
  nutrition_plan: {
    plan_name: "Balanced Weight Loss",
    plan_type: "weight_loss",
    daily_targets: {
      calories: 2100,
      protein: 140,
      carbs: 220,
      fat: 75,
    },
    today_progress: {
      calories_consumed: 1650,
      protein_consumed: 98,
      carbs_consumed: 180,
      fat_consumed: 62,
    },
    meal_distribution: {
      breakfast: 0.25,
      lunch: 0.35,
      dinner: 0.30,
      snacks: 0.10,
    },
  },
};

const ImprovedProfileSection = ({ user, userProfile: initialUserProfile, onSaveProfile, onOpenSettings, apiCall }) => {
  const [userProfile, setUserProfile] = useState(initialUserProfile || defaultUserProfile);

  useEffect(() => {
    setUserProfile(initialUserProfile || defaultUserProfile);
  }, [initialUserProfile]);

  useEffect(() => {
    if (userProfile?.user?.current_weight && userProfile?.user?.height) {
      const heightInM = userProfile.user.height / 100;
      const calculatedBMI = (userProfile.user.current_weight / (heightInM * heightInM)).toFixed(1);

      setUserProfile(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          bmi: parseFloat(calculatedBMI),
          bmr: Math.round(
            userProfile.user.gender === 'male'
              ? (10 * userProfile.user.current_weight) + (6.25 * userProfile.user.height) - (5 * userProfile.user.age) + 5
              : (10 * userProfile.user.current_weight) + (6.25 * userProfile.user.height) - (5 * userProfile.user.age) - 161
          ),
          tdee: Math.round(
            (userProfile.user.gender === 'male'
              ? (10 * userProfile.user.current_weight) + (6.25 * userProfile.user.height) - (5 * userProfile.user.age) + 5
              : (10 * userProfile.user.current_weight) + (6.25 * userProfile.user.height) - (5 * userProfile.user.age) - 161
            ) * 1.4
          )
        }
      }));
    }
  }, [userProfile?.user?.current_weight, userProfile?.user?.height, userProfile?.user?.age, userProfile?.user?.gender]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    age: '',
    current_weight: '',
    target_weight: '',
    height: '',
    gender: 'male'
  });
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const profilePhotoInputRef = useRef(null);

  const handleEditProfile = () => {
    setProfileForm({
      username: userProfile.user.username || '',
      email: userProfile.user.email || '',
      age: userProfile.user.age || '',
      current_weight: userProfile.user.current_weight || '',
      target_weight: userProfile.user.target_weight || '',
      height: userProfile.user.height || '',
      gender: userProfile.user.gender || 'male'
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    const updatedUser = {
      ...userProfile.user,
      ...profileForm,
      age: parseInt(profileForm.age) || userProfile.user.age,
      current_weight: parseFloat(profileForm.current_weight) || userProfile.user.current_weight,
      target_weight: parseFloat(profileForm.target_weight) || userProfile.user.target_weight,
      height: parseFloat(profileForm.height) || userProfile.user.height
    };

    const heightInM = updatedUser.height / 100;
    const calculatedBMI = (updatedUser.current_weight / (heightInM * heightInM)).toFixed(1);
    const calculatedBMR = Math.round(
      updatedUser.gender === 'male'
        ? (10 * updatedUser.current_weight) + (6.25 * updatedUser.height) - (5 * updatedUser.age) + 5
        : (10 * updatedUser.current_weight) + (6.25 * updatedUser.height) - (5 * updatedUser.age) - 161
    );

    const updatedProfile = {
      ...userProfile,
      user: updatedUser,
      metrics: {
        ...userProfile.metrics,
        bmi: parseFloat(calculatedBMI),
        bmr: calculatedBMR,
        tdee: Math.round(calculatedBMR * 1.4)
      }
    };
    try {
      await apiCall('/user-profile', {
        method: 'PUT',
        body: JSON.stringify({
          username: updatedUser.username,
          email: updatedUser.email,
          age: updatedUser.age,
          current_weight: updatedUser.current_weight,
          target_weight: updatedUser.target_weight,
          height: updatedUser.height,
          gender: updatedUser.gender,
        }),
      });

      setUserProfile(updatedProfile);
      if (onSaveProfile) {
        onSaveProfile(updatedProfile);
      }
      setIsEditingProfile(false);
      setProfilePhotoPreview(null);
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfilePhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const getDefaultAvatar = (gender, username) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500',
      'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
    ];
    const colorIndex = username.charCodeAt(0) % colors.length;
    const initials = username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return (
      <div className={`w-full h-full ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-lg`}>
        {initials}
      </div>
    );
  };

  const getProgressColor = (current, target) => {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { text: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { text: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { text: 'Overweight', color: 'text-yellow-600' };
    return { text: 'Obese', color: 'text-red-600' };
  };

  const bmiCategory = getBMICategory(userProfile.metrics?.bmi || 0);

  const getWeightTrend = () => {
    const diff = userProfile.user.current_weight - userProfile.user.target_weight;
    if (Math.abs(diff) < 0.5) return { icon: Target, color: 'text-green-500', text: 'At target' };
    if (diff > 0) return { icon: ArrowDown, color: 'text-blue-500', text: `${diff.toFixed(1)}kg to lose` };
    return { icon: ArrowUp, color: 'text-orange-500', text: `${Math.abs(diff).toFixed(1)}kg to gain` };
  };

  const weightTrend = getWeightTrend();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full opacity-50"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <User className="w-7 h-7 mr-3 text-blue-600" />
                Profile
              </h1>
              {!isEditingProfile && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onOpenSettings}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                    aria-label="Settings"
                  >
                    <Settings className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={handleEditProfile}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg border-4 border-white">
                  {profilePhotoPreview ? (
                    <img src={profilePhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : userProfile.user.profile_photo ? (
                    <img src={userProfile.user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    getDefaultAvatar(userProfile.user.gender, userProfile.user.username)
                  )}
                </div>
                {isEditingProfile && (
                  <button
                    onClick={() => profilePhotoInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
                <input ref={profilePhotoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </div>
              <div className="flex-1">
                {!isEditingProfile ? (
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-gray-900">{userProfile.user.username}</h2>
                    <p className="text-gray-600 flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {userProfile.user.email}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {userProfile.user.age} years
                      </span>
                      <span className="capitalize">{userProfile.user.gender}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input type="text" placeholder="Username" value={profileForm.username} onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    <input type="email" placeholder="Email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" placeholder="Age" value={profileForm.age} onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      <select value={profileForm.gender} onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {isEditingProfile && (
              <div className="flex space-x-3 mt-6">
                <button onClick={handleSaveProfile} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button onClick={() => { setIsEditingProfile(false); setProfilePhotoPreview(null); }} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl text-white shadow-lg">
            <Trophy className="w-6 h-6 mb-2" />
            <div className="text-2xl font-bold">{userProfile.user.level}</div>
            <div className="text-blue-100 text-sm">Current Level</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl text-white shadow-lg">
            <Star className="w-6 h-6 mb-2" />
            <div className="text-2xl font-bold">{userProfile.user.total_xp}</div>
            <div className="text-purple-100 text-sm">Total XP</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl text-white shadow-lg">
            <Flame className="w-6 h-6 mb-2" />
            <div className="text-2xl font-bold">{userProfile.user.streak_days}</div>
            <div className="text-green-100 text-sm">Day Streak</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-2xl text-white shadow-lg">
            <Award className="w-6 h-6 mb-2" />
            <div className="text-2xl font-bold">{userProfile.user.badges_earned}</div>
            <div className="text-orange-100 text-sm">Badges</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Scale className="w-6 h-6 mr-3 text-green-600" />
            Body Metrics
          </h3>
          {!isEditingProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <Scale className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-700">{userProfile.user.current_weight} kg</div>
                <div className="text-sm text-blue-600">Current Weight</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-2xl border border-green-100">
                <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-700">{userProfile.user.target_weight} kg</div>
                <div className="text-sm text-green-600">Target Weight</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <Ruler className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-700">{userProfile.user.height} cm</div>
                <div className="text-sm text-purple-600">Height</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Weight (kg)</label>
                <input type="number" step="0.1" min="30" max="300" value={profileForm.current_weight} onChange={(e) => setProfileForm({ ...profileForm, current_weight: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="70.5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Weight (kg)</label>
                <input type="number" step="0.1" min="30" max="300" value={profileForm.target_weight} onChange={(e) => setProfileForm({ ...profileForm, target_weight: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="65.0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                <input type="number" min="100" max="250" value={profileForm.height} onChange={(e) => setProfileForm({ ...profileForm, height: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="175" />
              </div>
            </div>
          )}
          {!isEditingProfile && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <weightTrend.icon className={`w-6 h-6 ${weightTrend.color}`} />
                  <div>
                    <div className="font-semibold text-gray-900">Weight Goal Progress</div>
                    <div className={`text-sm ${weightTrend.color.replace('text-', 'text-')}`}>{weightTrend.text}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{Math.abs(userProfile.user.current_weight - userProfile.user.target_weight).toFixed(1)}</div>
                  <div className="text-sm text-gray-600">kg difference</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Heart className="w-6 h-6 mr-3 text-red-500" />
            Health Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-red-50 rounded-2xl border border-red-100">
              <div className="text-2xl font-bold text-red-600">{userProfile.metrics?.bmi || 0}</div>
              <div className="text-sm text-red-700 font-medium">BMI</div>
              <div className={`text-xs font-medium mt-1 ${bmiCategory.color}`}>{bmiCategory.text}</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-2xl border border-orange-100">
              <div className="text-2xl font-bold text-orange-600">{userProfile.metrics?.bmr || 0}</div>
              <div className="text-sm text-orange-700 font-medium">BMR</div>
              <div className="text-xs text-gray-600 mt-1">cal/day at rest</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
              <div className="text-2xl font-bold text-yellow-600">{userProfile.metrics?.tdee || 0}</div>
              <div className="text-sm text-yellow-700 font-medium">TDEE</div>
              <div className="text-xs text-gray-600 mt-1">cal/day active</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Zap className="w-6 h-6 mr-3 text-yellow-500" />
            Nutrition Plan
          </h3>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-2xl border border-green-100 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900">{userProfile.nutrition_plan?.plan_name}</h4>
                <p className="text-sm text-gray-600 capitalize">{userProfile.nutrition_plan?.plan_type?.replace('_', ' ')} Plan</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="text-xl font-bold text-red-600">{userProfile.nutrition_plan?.daily_targets?.calories || 0}</div>
              <div className="text-sm text-red-700">Calories</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="text-xl font-bold text-blue-600">{userProfile.nutrition_plan?.daily_targets?.protein || 0}g</div>
              <div className="text-sm text-blue-700">Protein</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-100">
              <div className="text-xl font-bold text-yellow-600">{userProfile.nutrition_plan?.daily_targets?.carbs || 0}g</div>
              <div className="text-sm text-yellow-700">Carbs</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="text-xl font-bold text-purple-600">{userProfile.nutrition_plan?.daily_targets?.fat || 0}g</div>
              <div className="text-sm text-purple-700">Fat</div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Today's Progress</h4>
            {[{ label: 'Calories', current: userProfile.nutrition_plan?.today_progress?.calories_consumed || 0, target: userProfile.nutrition_plan?.daily_targets?.calories || 1, color: 'red' }, { label: 'Protein', current: userProfile.nutrition_plan?.today_progress?.protein_consumed || 0, target: userProfile.nutrition_plan?.daily_targets?.protein || 1, color: 'blue', unit: 'g' }, { label: 'Carbs', current: userProfile.nutrition_plan?.today_progress?.carbs_consumed || 0, target: userProfile.nutrition_plan?.daily_targets?.carbs || 1, color: 'yellow', unit: 'g' }, { label: 'Fat', current: userProfile.nutrition_plan?.today_progress?.fat_consumed || 0, target: userProfile.nutrition_plan?.daily_targets?.fat || 1, color: 'purple', unit: 'g' }].map((item) => {
              const percentage = Math.min((item.current / item.target) * 100, 100);
              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className="text-sm text-gray-600">{item.current}{item.unit || ''} / {item.target}{item.unit || ''}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(item.current, item.target)}`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-3 text-indigo-500" />
            Meal Distribution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[{ name: 'Breakfast', value: userProfile.nutrition_plan?.meal_distribution?.breakfast || 0.25, color: 'from-orange-400 to-orange-500', icon: Sun }, { name: 'Lunch', value: userProfile.nutrition_plan?.meal_distribution?.lunch || 0.35, color: 'from-blue-400 to-blue-500', icon: Sunset }, { name: 'Dinner', value: userProfile.nutrition_plan?.meal_distribution?.dinner || 0.30, color: 'from-purple-400 to-purple-500', icon: Moon }, { name: 'Snacks', value: userProfile.nutrition_plan?.meal_distribution?.snacks || 0.10, color: 'from-green-400 to-green-500', icon: Coffee }].map((meal) => (
              <div key={meal.name} className={`bg-gradient-to-br ${meal.color} p-4 rounded-2xl text-white shadow-lg`}>
                <meal.icon className="w-6 h-6 mb-2" />
                <div className="text-xl font-bold">{Math.round(meal.value * 100)}%</div>
                <div className="text-sm opacity-90">{meal.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl shadow-xl p-6 text-white">
          <h3 className="text-xl font-bold mb-6 flex items-center">
            <CheckCircle className="w-6 h-6 mr-3" />
            Smart Recommendations
          </h3>
          <div className="grid gap-4">
            {[{ icon: Heart, text: 'Focus on whole foods and lean proteins for optimal health' }, { icon: Activity, text: 'Stay hydrated with 8-10 glasses of water daily' }, { icon: Zap, text: 'Time your meals every 3-4 hours for sustained energy' }, { icon: Star, text: 'Include colorful vegetables in every meal for nutrients' }].map((rec, index) => (
              <div key={index} className="flex items-start space-x-3 bg-white bg-opacity-10 p-4 rounded-xl backdrop-blur-sm">
                <rec.icon className="w-5 h-5 mt-0.5 text-white opacity-80" />
                <span className="text-sm text-white opacity-90">{rec.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
const NutriVisionApp = () => {
  // ────────────── CORE STATE & REFS ──────────────

  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Auth Forms
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    age: '',
    current_weight: '',
    target_weight: '',
    height: '',
    gender: 'male',
    track_menstrual_cycle: false,
  });

  // Dashboard & Stats
  const [mealSuggestions, setMealSuggestions] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Daily Log & “Add Meal”
  const [dailyMeals, setDailyMeals] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMeal, setCurrentMeal] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    meal_type: 'breakfast',
    time: '',
  });
  const [showMealForm, setShowMealForm] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [aiMealEstimation, setAiMealEstimation] = useState(null);
  const [mealImageFile, setMealImageFile] = useState(null);
  const [mealImagePreview, setMealImagePreview] = useState(null);

  // Meal History
  const [mealHistory, setMealHistory] = useState([]);
  const [selectedHistoryMeal, setSelectedHistoryMeal] = useState(null);

  // Recipe Book
  const [recipeIngredients, setRecipeIngredients] = useState('');
  const [recipePersonalization, setRecipePersonalization] = useState({
    meal_type: 'any',
    temperature: 'any',
    cooking_time: 'medium',
    cuisine_style: 'any',
    dietary_pref: 'none',
  });
  const [recipeOptions, setRecipeOptions] = useState([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [recipeImageFile, setRecipeImageFile] = useState(null);
  const [recipeImagePreview, setRecipeImagePreview] = useState(null);

  // Menstrual Cycle Tracking
  const [menstrualCycleData, setMenstrualCycleData] = useState(null);

  // AI‐Analysis & Camera
  const [uploadedImage, setUploadedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);

  // User Profile & Recipes
  const [userProfile, setUserProfile] = useState(null);
  const [userRecipes, setUserRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    age: '',
    current_weight: '',
    target_weight: '',
    height: '',
    gender: 'male',
    activity_level: 'light'  // ← ADICIONADO
  });
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const profilePhotoInputRef = useRef(null);

  // Refs for file inputs & video
  const fileInputRef = useRef(null);
  const recipeFileInputRef = useRef(null);
  const mealImageInputRef = useRef(null);
  const videoRef = useRef(null);

  // const API_BASE = '/api';
  const API_BASE = 'http://localhost:5001/api';

  // ─────────── UTILITY HELPERS ───────────

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const apiCall = async (endpoint, options = {}) => {
    try {
      const resp = await fetch(`${API_BASE}${endpoint}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      });
      if (!resp.ok) {
        let msg;
        try {
          const data = await resp.json();
          msg = data.error || `HTTP ${resp.status}: ${resp.statusText}`;
        } catch {
          msg = `HTTP ${resp.status}: ${resp.statusText}`;
        }
        throw new Error(msg);
      }
      const ct = resp.headers.get('content-type');
      if (!ct || !ct.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      return await resp.json();
    } catch (err) {
      console.error('API Error:', err);
      if (
        err.message.includes('Failed to fetch') ||
        err.message.includes('NetworkError')
      ) {
        throw new Error('Connection error. Please check if backend is running.');
      }
      throw err;
    }
  };

  const formatDate = (date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getDayName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // ─────────── AUTH / REGISTER / LOGOUT ───────────

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiCall('/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      });
      setUser(res.user);
      setCurrentView('dashboard');
      setTimeout(async () => {
        try {
          await loadDashboardStats();
          await loadMealSuggestions();
        } catch (_) { }
      }, 300);
      showSuccess(`Welcome back, ${res.user.username}!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...registerData,
        age: parseInt(registerData.age, 10),
        current_weight: parseFloat(registerData.current_weight),
        target_weight: parseFloat(registerData.target_weight),
        height: parseFloat(registerData.height),
      };
      const res = await apiCall('/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setUser(res.user);
      setCurrentView('dashboard');
      setTimeout(async () => {
        try {
          await loadDashboardStats();
          await loadMealSuggestions();
        } catch (_) { }
      }, 300);
      showSuccess(`Welcome, ${res.user.username}!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiCall('/logout', { method: 'POST' });
      // Clear all state on sign‐out
      setUser(null);
      setUserStats(null);
      setCurrentView('login');
      setDailyMeals([]);
      setMealHistory([]);
      setDashboardStats(null);
      setRecipeOptions([]);
      setGeneratedRecipe(null);
      setSelectedHistoryMeal(null);
      setMenstrualCycleData(null);
      showSuccess('Signed out successfully!');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  // ─────────── INITIAL AUTH CHECK & DATA LOADING ───────────

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiCall('/health');
        const stats = await apiCall('/user/stats-advanced');
        setUser(stats.user);
        setUserStats(stats);
        setCurrentView('dashboard');
      } catch (err) {
        console.log('Not authenticated or API unavailable');
        setCurrentView('login');
        if (err.message.includes('Connection error')) {
          setError('Server not responding. Please check backend.');
        }
      }
    };
    const timeoutId = setTimeout(checkAuth, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // Whenever `currentView` changes (and user exists), load appropriate data
  useEffect(() => {
    if (user && !['login', 'register'].includes(currentView)) {
      const timer = setTimeout(() => {
        switch (currentView) {
          case 'daily-log':
            loadDailyMeals();
            break;
          case 'meal-history':
            loadMealHistory();
            break;
          case 'recipe-book':
            loadUserRecipes();
            break;
          case 'dashboard':
            loadDashboardStats();
            loadMealSuggestions();
            break;
          case 'profile':
            loadUserProfile();
            break;
          case 'menstrual-cycle':
            if (user.gender === 'female' && user.track_menstrual_cycle) {
              loadMenstrualCycleData();
            }
            break;
          default:
            break;
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [currentView, user]);

  // When `selectedDate` changes (and user exists) on Daily Log
  useEffect(() => {
    if (user && currentView === 'daily-log') {
      loadDailyMeals();
    }
  }, [selectedDate, user, currentView]);

  // Clear error messages automatically
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  useEffect(() => {
    if (user && !localStorage.getItem('tutorialShown')) {
      setShowHelp(true);
      localStorage.setItem('tutorialShown', 'true');
    }
  }, [user]);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // ─────────── DATA LOADER FUNCTIONS ───────────

  const loadDashboardStats = async () => {
    try {
      const res = await apiCall('/dashboard-stats');
      setDashboardStats(res);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    }
  };

  const loadMealSuggestions = async () => {
    try {
      const res = await apiCall('/meal-suggestions');
      setMealSuggestions(res.suggestions || []);
    } catch (err) {
      console.error('Error loading meal suggestions:', err);
      setMealSuggestions([]);
    }
  };

  const loadDailyMeals = async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await apiCall(`/daily-meals?date=${dateStr}`);
      setDailyMeals(res.meals || []);
    } catch (err) {
      console.error('Error loading daily meals:', err);
      setDailyMeals([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMealHistory = async () => {
    try {
      const res = await apiCall('/meal-history');
      setMealHistory(res.history || []);
    } catch (err) {
      console.error('Error loading meal history:', err);
      setMealHistory([]);
    }
  };

  const loadUserProfile = async () => {
    try {
      const res = await apiCall('/user-profile');
      setUserProfile(res);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setUserProfile(null);
    }
  };

  const loadMenstrualCycleData = async () => {
    try {
      const res = await apiCall('/menstrual-cycle');
      setMenstrualCycleData(res);
    } catch (err) {
      console.error('Error loading cycle data:', err);
      setMenstrualCycleData(null);
    }
  };
  const loadUserRecipes = async () => {
    try {
      const res = await apiCall('/recipes');
      console.log('RES.RECIPES →', res.recipes);
      setUserRecipes(res.recipes || []);
    } catch (err) {
      console.error('Error loading recipes:', err);
      setUserRecipes([]);
    }
  };


  // ─────────── DAILY LOG: SAVE & DELETE MEAL ───────────

  const saveMeal = async () => {
    if (!currentMeal.name.trim()) {
      setError('Please enter a meal name');
      return;
    }
    if (
      !currentMeal.calories &&
      !currentMeal.protein &&
      !currentMeal.carbs &&
      !currentMeal.fat
    ) {
      setError('Run AI estimation or fill in nutrition before saving');
      return;
    }
    const newMeal = {
      id: Date.now(),
      ...currentMeal,
      calories: parseInt(currentMeal.calories, 10) || 0,
      protein: parseFloat(currentMeal.protein) || 0,
      carbs: parseFloat(currentMeal.carbs) || 0,
      fat: parseFloat(currentMeal.fat) || 0,
      date: selectedDate.toISOString().split('T')[0],
    };
    try {
      await apiCall('/daily-meals', {
        method: 'POST',
        body: JSON.stringify(newMeal),
      });
      setDailyMeals((prev) => [...prev, newMeal]);
      showSuccess('Meal saved successfully!');
    } catch (err) {
      console.error('Error saving meal:', err);
      // Mesmo que falhe no backend, adiciona localmente
      setDailyMeals((prev) => [...prev, newMeal]);
      showSuccess('Meal added locally!');
    }
    // Limpa a estimativa de IA e preview ao salvar
    setAiMealEstimation(null);
    setMealImagePreview(null);

    setCurrentMeal({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      meal_type: 'breakfast',
      time: '',
    });
    setShowMealForm(false);
  };

  const deleteMeal = async (mealId) => {
    try {
      await apiCall(`/daily-meals/${mealId}`, { method: 'DELETE' });
      setDailyMeals((prev) => prev.filter((m) => m.id !== mealId));
      await loadDashboardStats();
      showSuccess('Meal removed!');
    } catch (err) {
      console.error('Error removing meal:', err);
      setDailyMeals((prev) => prev.filter((m) => m.id !== mealId));
      showSuccess('Meal removed locally!');
    }
  };

  // ─────────── AI‐ASSISTED MEAL ESTIMATION ───────────

  const estimateMealWithAI = async () => {
    if (!currentMeal.name.trim() && !mealImageFile) {
      setError('Please enter a meal name or upload an image');
      return;
    }
    setIsEstimating(true);
    try {
      let result;
      if (mealImageFile) {
        const fd = new FormData();
        fd.append('image', mealImageFile);
        fd.append('action', 'estimate_nutrition');
        const resp = await fetch(`${API_BASE}/analyze-revolutionary`, {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
        if (!resp.ok) throw new Error('Failed to estimate meal from image');
        result = await resp.json();
      } else {
        result = await apiCall('/ai-meal-estimation', {
          method: 'POST',
          body: JSON.stringify({
            meal_description: currentMeal.name,
            action: 'estimate_nutrition',
          }),
        });
      }

      if (result.estimation) {
        if (result.estimation.title) {
          setAiMealEstimation(result.estimation);
          if (!currentMeal.name.trim()) {
            setCurrentMeal((prev) => ({ ...prev, name: result.estimation.title }));
          }
        } else {
          setAiMealEstimation(result.estimation);
        }
        setCurrentMeal((prev) => ({
          ...prev,
          calories: result.estimation.calories.toString(),
          protein: result.estimation.protein.toString(),
          carbs: result.estimation.carbs.toString(),
          fat: result.estimation.fat.toString(),
        }));
      } else if (result.analysis) {
        const nutrition = result.analysis.nutrition || {};
        setAiMealEstimation({
          title: result.analysis.title || currentMeal.name,
          calories: nutrition.calories || 0,
          protein: nutrition.protein || 0,
          carbs: nutrition.carbs || 0,
          fat: nutrition.fat || 0,
          confidence: null,
        });
        if (!currentMeal.name.trim() && result.analysis.title) {
          setCurrentMeal((prev) => ({ ...prev, name: result.analysis.title }));
        }
        setCurrentMeal((prev) => ({
          ...prev,
          calories: String(nutrition.calories || ''),
          protein: String(nutrition.protein || ''),
          carbs: String(nutrition.carbs || ''),
          fat: String(nutrition.fat || ''),
        }));
      } else {
        throw new Error('Unexpected AI response');
      }
      showSuccess('AI estimation completed!');
    } catch (err) {
      setError(`AI estimation failed: ${err.message}`);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleMealImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMealImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setMealImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfilePhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // ─────────── RECIPE GENERATION ───────────

  const generateRecipe = async () => {
    if (!recipeIngredients.trim() && !recipeImageFile) {
      setError('Please enter some ingredients or upload a photo');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let result;
      const personalizationPayload = {
        ingredients: recipeIngredients,
        meal_type: recipePersonalization.meal_type,
        temperature: recipePersonalization.temperature,
        cooking_time: recipePersonalization.cooking_time,
        cuisine_style: recipePersonalization.cuisine_style,
        dietary_pref: recipePersonalization.dietary_pref,
      };

      if (recipeImageFile) {
        const formData = new FormData();
        formData.append('image', recipeImageFile);
        formData.append('payload', JSON.stringify(personalizationPayload));

        const resp = await fetch(`${API_BASE}/recipe-generation`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        const ct = resp.headers.get('content-type');

        if (!resp.ok) {
          let errMsg = '';
          try {
            const data = await resp.json();
            errMsg = data.error || `HTTP ${resp.status}: ${resp.statusText}`;
          } catch {
            errMsg = `HTTP ${resp.status}: ${resp.statusText}`;
          }
          throw new Error(errMsg);
        }

        if (!ct || !ct.includes('application/json')) {
          throw new Error('Server returned non-JSON response');
        }
        result = await resp.json();
      } else {
        // Envia apenas JSON se não houver imagem
        result = await apiCall('/recipe-generation', {
          method: 'POST',
          body: JSON.stringify(personalizationPayload),
        });
      }

      if (result.validation_result) {
        if (result.validation_result.invalid_items.length > 0) {
          setError(
            `Invalid items: ${result.validation_result.invalid_items.join(
              ', '
            )}. Suggestions: ${result.validation_result.suggestions.join(', ')}`
          );
        }
      }

      const options = Array.isArray(result.recipe_options)
        ? result.recipe_options.map((r) => ({ ...r }))
        : [];

      // Gerar imagens via Azure/DALL·E para cada opção (assíncrono)
      await Promise.all(
        options.map(async (opt, idx) => {
          try {
            const imageResp = await fetch(`${API_BASE}/recipe-image-generate`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: opt.title }),
            });
            const imageData = await imageResp.json();
            if (imageData.url) {
              options[idx].image_url = imageData.url;
            }
          } catch (e) {
            console.warn('Failed to generate image for option:', opt.title, e);
          }
        })
      );

      setRecipeOptions(options);
      setSelectedOptionIndex(0);
      setGeneratedRecipe(result.recipe || null);
      setRecipeIngredients('');
      setRecipeImageFile(null);
      setRecipeImagePreview(null);

      await loadUserRecipes();
      showSuccess('New personalized recipe generated successfully!');
    } catch (err) {
      console.error('Recipe generation error:', err);
      setError(`Recipe generation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getRecipeDetails = async (recipeId) => {
    try {
      const res = await apiCall(`/recipes/${recipeId}`);
      setSelectedRecipe(res.recipe);
      setCurrentView('recipe-details');
    } catch (err) {
      console.error('Error loading recipe details:', err);
      setError('Failed to load recipe details');
    }
  };

  const deleteRecipe = async (recipeId) => {
    try {
      await apiCall(`/recipes/${recipeId}`, { method: 'DELETE' });
      await loadUserRecipes();
      showSuccess('Recipe deleted successfully!');
    } catch (err) {
      console.error('Error deleting recipe:', err);
      setError('Failed to delete recipe');
    }
  };

  // ─────────── FOOD ANALYSIS (UPLOAD / CAMERA) ───────────

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      setUploadedImage(reader.result);
      setIsEstimating(true);
      setCurrentView('food-analysis');

      try {
        const fd = new FormData();
        fd.append('image', file);
        fd.append('meal_type', 'lunch');

        const resp = await fetch(`${API_BASE}/analyze-revolutionary`, {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
        const result = await resp.json();
        if (!resp.ok) {
          throw new Error(result.error || 'Analysis error');
        }

        setAnalysisResult(result.analysis);

        if (user) {
          setUser((prev) => ({
            ...prev,
            total_xp: result.new_total_xp,
            level: result.new_level,
            streak_days: result.streak_days,
          }));
        }
      } catch (err) {
        setError(err.message);
        setAnalysisResult({
          foods_detected: ['Analysis error'],
          nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          health_assessment: { score: 0, obesity_risk: 'Unknown' },
          ai_feedback: 'Error processing analysis. Please try again.',
          suggestions: ['Check connection and try again'],
        });
      } finally {
        setIsEstimating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        setCameraStream(stream);
        setCurrentView('camera-capture');
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        fileInputRef.current?.click();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      fileInputRef.current?.click();
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && cameraStream) {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        const reader = new FileReader();
        reader.onload = async () => {
          setUploadedImage(reader.result);
          setIsEstimating(true);
          setCurrentView('food-analysis');

          // Stop camera stream
          if (cameraStream) {
            cameraStream.getTracks().forEach((track) => track.stop());
            setCameraStream(null);
          }

          // Repeat analysis logic
          try {
            const fd = new FormData();
            fd.append('image', file);
            fd.append('meal_type', 'lunch');

            const resp = await fetch(`${API_BASE}/analyze-revolutionary`, {
              method: 'POST',
              credentials: 'include',
              body: fd,
            });
            const result = await resp.json();
            if (!resp.ok) {
              throw new Error(result.error || 'Analysis error');
            }

            setAnalysisResult(result.analysis);
            if (user) {
              setUser((prev) => ({
                ...prev,
                total_xp: result.new_total_xp,
                level: result.new_level,
                streak_days: result.streak_days,
              }));
            }
          } catch (err) {
            setError(err.message);
            setAnalysisResult({
              foods_detected: ['Analysis error'],
              nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
              health_assessment: { score: 0, obesity_risk: 'Unknown' },
              ai_feedback: 'Error processing analysis. Please try again.',
              suggestions: ['Check connection and try again'],
            });
          } finally {
            setIsEstimating(false);
          }
        };
        reader.readAsDataURL(blob);
      });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCurrentView('dashboard');
  };

  // ─────────── VIEW RENDERERS ───────────

  const renderLogin = () => (
    <div className="min-h-screen bg-gradient-to-br from-light-accent via-light-accent2 to-light-accent dark:from-dark-accent dark:via-dark-accent2 dark:to-dark-accent flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center space-x-3 justify-center">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-light-accent via-light-accent2 to-light-accent dark:from-dark-accent dark:via-dark-accent2 dark:to-dark-accent rounded-2xl flex items-center justify-center shadow-lg">
                <Eye className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                Nutri<span className="text-orange-500">Snap</span>
              </h1>
              <p className="text-xs text-gray-600 font-medium">Smart Food Coach</p>
            </div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">Smart Nutrition Analysis & Insights</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              placeholder="you@example.com"
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
            onClick={login}
            disabled={loading}
            className="w-full bg-gradient-to-r from-light-accent via-light-accent2 to-light-accent dark:from-dark-accent dark:via-dark-accent2 dark:to-dark-accent text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Login'}
          </button>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => setCurrentView('register')}
            className="text-orange-600 font-medium hover:text-orange-700"
          >
            Don’t have an account? Join now
          </button>
        </div>
      </div>
    </div>
  );


  const renderSmartScanner = () => (
    <div className="min-h-screen bg-gradient-to-br from-light-bgStart to-light-bgEnd dark:from-dark-bgStart dark:to-dark-bgEnd p-4 pb-20 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 w-full max-w-md">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-center">
          <Camera className="w-6 h-6 mr-2 text-orange-500" />
          Smart Food Analysis
        </h2>

        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-8 text-center border-2 border-dashed border-gray-300">
          <div className="w-20 h-20 bg-gradient-to-br from-light-accent via-light-accent2 to-light-accent dark:from-dark-accent dark:via-dark-accent2 dark:to-dark-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Instant Food Analysis</h3>
          <p className="text-gray-600 mb-6">Get instant insights about your meals with advanced AI!</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-gray-800 to-gray-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg hover:shadow-gray-500/30 transform hover:scale-105 transition-all"
            >
              <Image className="w-4 h-4 mr-1 inline" /> Choose Photo
            </button>
            <button
              onClick={handleCameraCapture}
              className="bg-gradient-to-r from-light-accent via-light-accent2 to-light-accent dark:from-dark-accent dark:via-dark-accent2 dark:to-dark-accent text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg hover:shadow-orange-500/30 transform hover:scale-105 transition-all"
            >
              <Camera className="w-4 h-4 mr-1 inline" /> Open Camera
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </div>
  );

  const renderRegister = () => (
    <div className="min-h-screen bg-gradient-to-br from-light-accent via-light-accent2 to-light-accent dark:from-dark-accent dark:via-dark-accent2 dark:to-dark-accent flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md max-h-screen overflow-y-auto">
        <div className="text-center mb-6">
          <div className="flex items-center space-x-3 justify-center">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-light-accent via-light-accent2 to-light-accent dark:from-dark-accent dark:via-dark-accent2 dark:to-dark-accent rounded-2xl flex items-center justify-center shadow-lg">
                <Eye className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                Nutri<span className="text-orange-500">Snap</span>
              </h1>
            </div>
          </div>
          <p className="text-gray-600 mt-2">Join the Movement</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Username</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={registerData.username}
              onChange={(e) =>
                setRegisterData({ ...registerData, username: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={registerData.email}
              onChange={(e) =>
                setRegisterData({ ...registerData, email: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={registerData.password}
              onChange={(e) =>
                setRegisterData({ ...registerData, password: e.target.value })
              }
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
                onChange={(e) =>
                  setRegisterData({ ...registerData, age: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Gender</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={registerData.gender}
                onChange={(e) =>
                  setRegisterData({ ...registerData, gender: e.target.value })
                }
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Current Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={registerData.current_weight}
                onChange={(e) =>
                  setRegisterData({ ...registerData, current_weight: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Target Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={registerData.target_weight}
                onChange={(e) =>
                  setRegisterData({ ...registerData, target_weight: e.target.value })
                }
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
              onChange={(e) =>
                setRegisterData({ ...registerData, height: e.target.value })
              }
            />
          </div>

          {registerData.gender === 'female' && (
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={registerData.track_menstrual_cycle}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      track_menstrual_cycle: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 flex items-center">
                    <Moon className="w-4 h-4 mr-1" />Track Menstrual Cycle
                  </span>
                  <p className="text-xs text-gray-600">
                    Enable personalized nutrition recommendations based on your cycle
                  </p>
                </div>
              </label>
            </div>
          )}

          <button
            onClick={register}
            disabled={loading}
            className="w-full bg-gradient-to-r from-light-accent via-light-accent2 to-light-accent2 dark:from-dark-accent dark:via-dark-accent2 dark:to-dark-accent2 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Get Started'}
          </button>
        </div>

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

  const renderDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-light-bgStart to-light-bgEnd dark:from-dark-bgStart dark:to-dark-bgEnd p-4 pb-20">
      {/* HEADER */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-light-accent via-light-accent2 to-light-accent dark:from-dark-accent dark:via-dark-accent2 dark:to-dark-accent rounded-2xl flex items-center justify-center shadow-lg">
                <Eye className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                Nutri<span className="text-orange-500">Snap</span>
              </h1>
              <p className="text-xs text-gray-600 font-medium">Smart Food Coach</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">Hi, {user?.username}! </div>
            <div className="text-sm text-gray-600">
              {user?.level} • {user?.total_xp || 0} XP
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-light-accent via-light-accent2 to-light-accent dark:from-dark-accent dark:via-dark-accent2 dark:to-dark-accent p-4 rounded-2xl text-white">
          <div className="flex items-center">
            <Lightbulb className="w-6 h-6 mr-2 text-yellow-200" />
            <div>
              <p className="font-bold text-lg">Your Smart Coach Is Active!</p>
              <p className="text-orange-100 text-sm mt-1">
                Personalized Insights • AI‐Powered Suggestions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TODAY’S SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-4 mb-6 px-4">
        <div className="bg-gradient-to-br from-light-accent to-light-accent2 dark:from-dark-accent dark:to-dark-accent2 p-4 rounded-2xl text-white shadow-lg">
          <Dna className="w-8 h-8 mb-2" />
          <div className="text-2xl font-bold">{user?.total_xp || 0}</div>
          <div className="text-orange-100 text-sm">Total XP</div>
        </div>
        <div className="bg-gradient-to-br from-light-accent2 to-light-accent dark:from-dark-accent2 dark:to-dark-accent p-4 rounded-2xl text-white shadow-lg">
          <Activity className="w-8 h-8 mb-2" />
          <div className="text-2xl font-bold">{user?.streak_days || 0}</div>
          <div className="text-yellow-100 text-sm">Streak Days</div>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-600 p-4 rounded-2xl text-white shadow-lg">
          <Brain className="w-8 h-8 mb-2" />
          <div className="text-2xl font-bold">
            {userStats?.advanced_stats?.total_analyses || 0}
          </div>
          <div className="text-gray-100 text-sm">Meal Analyses</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-600 to-orange-500 p-4 rounded-2xl text-white shadow-lg">
          <History className="w-8 h-8 mb-2" />
          <div className="text-2xl font-bold">
            {userStats?.advanced_stats?.badges_earned || 0}
          </div>
          <div className="text-yellow-100 text-sm">Badges</div>
        </div>
      </div>
      {dashboardStats && (
        <div className="space-y-6 px-4">
          <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Weekly Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-orange-600">{dashboardStats.weekly_summary.meals_logged}</div>
                <div className="text-sm text-gray-600">Meals Logged</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{dashboardStats.weekly_summary.total_calories}</div>
                <div className="text-sm text-gray-600">Calories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{dashboardStats.weekly_summary.avg_health_score}</div>
                <div className="text-sm text-gray-600">Avg Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{dashboardStats.weekly_summary.plan_progress}%</div>
                <div className="text-sm text-gray-600">Plan Progress</div>
              </div>
            </div>
          </div>


        </div>
      )}

    </div>
  );

  const renderFoodAnalysis = () => (
    <div className="min-h-screen bg-gradient-to-br from-light-bgStart to-light-bgEnd dark:from-dark-bgStart dark:to-dark-bgEnd p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentView('dashboard')}
          className="text-gray-800 text-2xl font-bold"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900"> Food Analysis</h1>
        <div
          className={`w-3 h-3 rounded-full ${isEstimating ? 'bg-orange-500 animate-pulse' : 'bg-green-500'
            }`}
        />
        <span
          className={`text-sm font-medium ${isEstimating ? 'text-orange-600' : 'text-green-600'
            }`}
        >
          {isEstimating ? 'Analyzing...' : 'Complete'}
        </span>
      </div>

      {uploadedImage && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
            <div className="relative">
              <img
                src={uploadedImage}
                className="w-full h-64 object-cover"
                alt="Analyzed meal"
              />

              {isEstimating && (
                <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center text-white">
                  <div className="relative mb-6">
                    <Brain className="w-16 h-16 text-orange-500 mx-auto animate-pulse" />
                    <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Smart Analysis in Progress...</h3>
                </div>
              )}

              {!isEstimating && analysisResult && (
                <>
                  <div className="absolute top-4 left-4 bg-red-600 bg-opacity-95 backdrop-blur-sm px-3 py-2 rounded-xl text-white font-bold text-sm shadow-lg">
                    <AlertTriangle className="inline w-4 h-4 mr-1" />
                    {analysisResult.nutrition?.calories || 0} kcal
                  </div>
                  <div className="absolute top-4 right-4 bg-green-600 bg-opacity-95 backdrop-blur-sm px-3 py-2 rounded-xl text-white font-bold text-sm shadow-lg">
                    <CheckCircle className="inline w-4 h-4 mr-1" />
                    {analysisResult.nutrition?.protein || 0}g protein
                  </div>
                  <div className="absolute bottom-4 left-4 bg-orange-600 bg-opacity-95 backdrop-blur-sm px-3 py-2 rounded-xl text-white font-bold text-sm shadow-lg">
                    <Eye className="inline w-4 h-4 mr-1" />
                    Score: {analysisResult.health_assessment?.score || 0}/10
                  </div>
                </>
              )}
            </div>



            {!isEstimating && analysisResult && (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-orange-500" />
                    AI-Detected Foods
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.foods_detected?.map((food, idx) => (
                      <span
                        key={idx}
                        className="bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium border border-orange-200"
                      >
                        {food}
                      </span>
                    ))}
                  </div>
                </div>

                {analysisResult.revolutionary_insights && (
                  <div className="bg-gradient-to-r from-light-accent via-light-accent2 to-light-accent dark:from-dark-accent dark:via-dark-accent2 dark:to-dark-accent p-6 rounded-2xl text-white mb-6 shadow-lg">
                    <h3 className="font-bold text-xl mb-4 flex items-center">
                      <Sparkles className="w-6 h-6 mr-2" />
                      Smart Insights
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                        <div className="text-sm text-orange-100">Satisfaction</div>
                        <div className="text-2xl font-bold">
                          {analysisResult.revolutionary_insights?.satisfaction_prediction || 7.5}
                          /10
                        </div>
                      </div>
                    </div>
                    <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain className="w-5 h-5" />
                        <span className="font-semibold">Eating Personality:</span>
                      </div>
                      <div className="text-lg font-bold text-yellow-200">
                        {analysisResult.revolutionary_insights?.personality_type || 'Balanced Consumer'}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="bg-gradient-to-br from-red-500 to-red-700 p-3 rounded-xl text-white text-center shadow-md">
                    <div className="text-lg font-bold">
                      {analysisResult.nutrition?.calories || 0}
                    </div>
                    <div className="text-red-200 text-xs">Calories</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-3 rounded-xl text-white text-center shadow-md">
                    <div className="text-lg font-bold">
                      {analysisResult.nutrition?.protein || 0}g
                    </div>
                    <div className="text-blue-200 text-xs">Protein</div>
                  </div>
                  <div className="bg-gradient-to-br from-light-accent2 to-light-accent dark:from-dark-accent2 dark:to-dark-accent p-3 rounded-xl text-white text-center shadow-md">
                    <div className="text-lg font-bold">
                      {analysisResult.nutrition?.carbs || 0}g
                    </div>
                    <div className="text-yellow-200 text-xs">Carbs</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl text-white text-center shadow-md">
                    <div className="text-lg font-bold">
                      {analysisResult.nutrition?.fat || 0}g
                    </div>
                    <div className="text-purple-200 text-xs">Fat</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-light-accent to-light-accent2 dark:from-dark-accent dark:to-dark-accent2 p-5 rounded-2xl text-white mb-6 shadow-lg">
                  <h3 className="font-bold text-lg mb-3 flex items-center">
                    <Brain className="w-6 h-6 mr-2" />AI Feedback
                  </h3>
                  <p className="text-orange-100 leading-relaxed">{analysisResult.ai_feedback}</p>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 p-5 rounded-2xl text-white shadow-lg">
                  <h3 className="font-bold text-lg mb-3 flex items-center">
                    <Lightbulb className="w-6 h-6 mr-2" />Suggestions
                  </h3>
                  <div className="space-y-2">
                    {analysisResult.suggestions?.map((suggestion, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-200 mt-0.5 flex-shrink-0" />
                        <span className="text-green-100 text-sm">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );




  // ─────────── RECIPE BOOK ───────────
  const renderRecipeBook = () => (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentView('dashboard')}
          className="text-gray-800 text-2xl font-bold hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Recipe Book</h1>
        <div className="w-6" />
      </div>

      {/* ─── Formulário de Criação de Receita ─── */}
      <div className="bg-white rounded-3xl shadow-lg p-8 mb-10 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Utensils className="w-6 h-6 mr-2 text-orange-500" />
          Create Personalized Recipe
        </h2>

        <div className="space-y-6">
          {/* Campo de Ingredientes (texto) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Ingredients
            </label>
            <textarea
              value={recipeIngredients}
              onChange={(e) => setRecipeIngredients(e.target.value)}
              placeholder="e.g., chicken, broccoli, quinoa, garlic"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50"
              rows="3"
            />

          </div>

          {/* Upload / Captura de Foto */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Or Upload a Photo of Your Fridge/Shelf
            </label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  if (
                    navigator.mediaDevices &&
                    navigator.mediaDevices.getUserMedia
                  ) {
                    navigator.mediaDevices
                      .getUserMedia({ video: { facingMode: 'environment' } })
                      .then((stream) => {
                        const video = document.createElement('video');
                        video.srcObject = stream;
                        video.play();
                        video.addEventListener('loadeddata', () => {
                          const canvas = document.createElement('canvas');
                          canvas.width = video.videoWidth;
                          canvas.height = video.videoHeight;
                          const ctx = canvas.getContext('2d');
                          ctx.drawImage(video, 0, 0);
                          canvas.toBlob((blob) => {
                            const file = new File(
                              [blob],
                              'fridge-capture.jpg',
                              { type: 'image/jpeg' }
                            );
                            setRecipeImageFile(file);
                            const reader = new FileReader();
                            reader.onload = () => {
                              setRecipeImagePreview(reader.result);
                            };
                            reader.readAsDataURL(file);
                          });
                          stream.getTracks().forEach((track) => track.stop());
                        });
                      })
                      .catch(() => {
                        recipeFileInputRef.current?.click();
                      });
                  } else {
                    recipeFileInputRef.current?.click();
                  }
                }}
                className="bg-gradient-to-r from-gray-800 to-gray-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-0.5"
              >
                <Camera className="w-4 h-4 mr-1 inline" /> Capture Photo
              </button>

              <button
                onClick={() => recipeFileInputRef.current?.click()}
                className="bg-gradient-to-r from-light-accent to-light-accent2 dark:from-dark-accent dark:to-dark-accent2 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-0.5"
              >
                <Image className="w-4 h-4 mr-1 inline" /> Choose Photo
              </button>
            </div>

            {recipeImagePreview && (
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-md">
                <img
                  src={recipeImagePreview}
                  alt="Fridge preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => {
                    setRecipeImageFile(null);
                    setRecipeImagePreview(null);
                  }}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 text-red-600 hover:text-red-800 shadow"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <input
              ref={recipeFileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                setRecipeImageFile(file);
                const reader = new FileReader();
                reader.onload = () => setRecipeImagePreview(reader.result);
                reader.readAsDataURL(file);
              }}
              className="hidden"
            />
          </div>

          {/* Personalização (selects em duas colunas) */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-5 rounded-2xl border border-orange-200">
            <h3 className="text-gray-900 font-bold mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-orange-600" />
              Personalization Options
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Meal Type */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Meal Type
                </label>
                <select
                  value={recipePersonalization.meal_type}
                  onChange={(e) =>
                    setRecipePersonalization({
                      ...recipePersonalization,
                      meal_type: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="any">Any Time</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Temperature
                </label>
                <select
                  value={recipePersonalization.temperature}
                  onChange={(e) =>
                    setRecipePersonalization({
                      ...recipePersonalization,
                      temperature: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="any">Any</option>
                  <option value="hot">Hot & Cozy</option>
                  <option value="cold">Cold & Fresh</option>
                  <option value="fresh">Fresh & Raw</option>
                </select>
              </div>

              {/* Cooking Time */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cooking Time
                </label>
                <select
                  value={recipePersonalization.cooking_time}
                  onChange={(e) =>
                    setRecipePersonalization({
                      ...recipePersonalization,
                      cooking_time: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="quick">Quick (&lt;20 min)</option>
                  <option value="medium">Medium (20–45 min)</option>
                  <option value="elaborate">Elaborate (&gt;45 min)</option>
                </select>
              </div>

              {/* Cuisine Style */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cuisine Style
                </label>
                <select
                  value={recipePersonalization.cuisine_style}
                  onChange={(e) =>
                    setRecipePersonalization({
                      ...recipePersonalization,
                      cuisine_style: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="any">Any Style</option>
                  <option value="mediterranean">Mediterranean</option>
                  <option value="asian">Asian</option>
                  <option value="fusion">Fusion</option>
                  <option value="traditional">Traditional</option>
                  <option value="modern">Modern</option>
                </select>
              </div>
            </div>

            {/* Dietary Preference (full width) */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Dietary Preference
              </label>
              <select
                value={recipePersonalization.dietary_pref}
                onChange={(e) =>
                  setRecipePersonalization({
                    ...recipePersonalization,
                    dietary_pref: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="none">No Restriction</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="keto">Keto</option>
                <option value="low-carb">Low Carb</option>
                <option value="high-protein">High Protein</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateRecipe}
            disabled={loading}
            className="w-full bg-gradient-to-r from-light-accent to-light-accent2 dark:from-dark-accent dark:to-dark-accent2 text-white py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-transform transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              'Generate Smart Recipe'
            )}
          </button>
        </div>
      </div>

      {/* ─── Lista de Opções de Receita (TABS) ─── */}
      {recipeOptions.length > 0 && (
        <div className="bg-white rounded-3xl shadow-lg mb-8 border border-gray-100">
          <div className="p-4 border-b border-gray-200 flex space-x-2 overflow-x-auto">
            {recipeOptions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedOptionIndex(idx)}
                className={`px-4 py-2 rounded-t-2xl text-sm font-medium whitespace-nowrap ${selectedOptionIndex === idx
                  ? 'bg-gradient-to-r from-light-accent to-light-accent2 dark:from-dark-accent dark:to-dark-accent2 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Option {idx + 1}
              </button>
            ))}
          </div>

          <div className="p-6">
            {recipeOptions[selectedOptionIndex] && (
              <div className="space-y-4 bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl">
                <h3 className="text-2xl font-bold text-yellow-900">
                  {recipeOptions[selectedOptionIndex].title}
                </h3>
                <p className="text-yellow-700">
                  {recipeOptions[selectedOptionIndex].description}
                </p>
                <div className="flex items-center space-x-5 mt-2 text-sm text-yellow-600">
                  <span className="flex items-center">
                    <ClockIcon className="w-5 h-5 mr-1 text-yellow-500" />
                    {recipeOptions[selectedOptionIndex].prep_time +
                      recipeOptions[selectedOptionIndex].cook_time}{' '}
                    min
                  </span>
                  <span className="flex items-center">
                    <UsersIcon className="w-5 h-5 mr-1 text-yellow-500" />
                    {recipeOptions[selectedOptionIndex].servings} servings
                  </span>
                  <span className="flex items-center">
                    <Flame className="w-5 h-5 mr-1 text-yellow-500" />
                    {recipeOptions[selectedOptionIndex].nutrition.calories} kcal
                  </span>
                  <span className="flex items-center">
                    <DrumstickIcon className="w-5 h-5 mr-1 text-yellow-500" />
                    {recipeOptions[selectedOptionIndex].nutrition.protein}g protein
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {recipeOptions[selectedOptionIndex].tags?.map((tag, idx2) => (
                    <span
                      key={idx2}
                      className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {recipeOptions[selectedOptionIndex].image_url && (
                  <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
                    <img
                      src={recipeOptions[selectedOptionIndex].image_url}
                      alt={recipeOptions[selectedOptionIndex].title}
                      className="w-full h-56 object-cover"
                    />
                  </div>
                )}

                {recipeOptions[selectedOptionIndex].chef_tips?.length > 0 && (
                  <div className="mt-4 p-4 bg-white bg-opacity-80 rounded-xl">
                    <h4 className="font-bold text-yellow-900 text-sm mb-2 flex items-center">
                      <Utensils className="w-4 h-4 mr-1" />Chef’s Tips:
                    </h4>
                    <ul className="space-y-1">
                      {recipeOptions[selectedOptionIndex].chef_tips.map((tip, idx3) => (
                        <li key={idx3} className="text-xs text-yellow-700 flex items-start">
                          <span className="text-yellow-500 mr-1">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}


      {/* ───── YOUR RECIPE COLLECTION ───── */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-yellow-500" />
          Your Recipe Collection
        </h2>

        {userRecipes.length > 0 ? (
          <div className="space-y-4">
            {userRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-2xl border border-yellow-200 flex flex-col sm:flex-row items-center"
              >
                { /* ─── Miniatura: verifica se existe `recipe.image_url` ─── */}
                {recipe.image_url ? (
                  <div className="w-full sm:w-24 h-24 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full sm:w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Utensils className="w-8 h-8 text-gray-400" />
                  </div>
                )}

                { /* ─── Conteúdo textual ao lado (título, descrição, ícones etc.) ─── */}
                <div className="flex-1 mt-4 sm:mt-0 sm:ml-4">
                  <h3 className="font-bold text-yellow-900">{recipe.title}</h3>
                  <p className="text-yellow-700 text-sm line-clamp-2">
                    {recipe.description}
                  </p>

                  <div className="flex items-center space-x-4 mt-2 text-xs text-yellow-600">
                    <span className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1 text-yellow-500" />
                      {recipe.prep_time + recipe.cook_time} min
                    </span>
                    <span className="flex items-center">
                      <UsersIcon className="w-4 h-4 mr-1 text-yellow-500" />
                      {recipe.servings} servings
                    </span>
                    <span className="flex items-center">
                      <Flame className="w-4 h-4 mr-1 text-yellow-500" />
                      {recipe.calories_per_serving} kcal
                    </span>
                    <span className="flex items-center">
                      <DrumstickIcon className="w-4 h-4 mr-1 text-yellow-500" />
                      {recipe.protein_per_serving}g protein
                    </span>
                  </div>
                </div>

                { /* ─── Botões “View” / “Delete” ─── */}
                <div className="flex flex-row space-x-2 mt-4 sm:mt-0 sm:flex-col sm:space-x-0 sm:space-y-2 sm:ml-4">
                  <button
                    onClick={() => getRecipeDetails(recipe.id)}
                    className="bg-yellow-600 text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-yellow-700 transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => deleteRecipe(recipe.id)}
                    className="bg-red-600 text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>


        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-gray-600">No recipes yet. Generate your first smart recipe!</p>
          </div>
        )}
      </div>

    </div>
  );


  const renderRecipeDetails = () => {
    if (!selectedRecipe) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              setSelectedRecipe(null);
              setCurrentView('recipe-book');
            }}
            className="text-gray-800 text-2xl font-bold hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900">Recipe Details</h1>
          <div className="w-6" />
        </div>
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          { /* ─── Exibe imagem grande SE existir ─── */}
          {selectedRecipe.image_url ? (
            <div className="mb-4 rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
              <img
                src={selectedRecipe.image_url}
                alt={selectedRecipe.title}
                className="w-full h-64 object-cover"
              />
            </div>
          ) : null}

          <div className="p-6 space-y-6">
            {/* Título e descrição */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedRecipe.title}
              </h2>
              <p className="text-gray-600">{selectedRecipe.description}</p>
            </div>

            {/* ─── Blocos centrais: Prep, Cook, Servings ─── */}
            <div className="grid grid-cols-3 gap-4">
              {/* Prep Time */}
              <div className="flex items-center p-4 bg-yellow-50 rounded-xl border border-yellow-200 justify-center">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-6 h-6 text-yellow-500" />
                  <div className="text-center">
                    <div className="text-lg font-semibold text-yellow-700">
                      {selectedRecipe.prep_time}
                    </div>
                    <div className="text-xs text-gray-600">Prep (min)</div>
                  </div>
                </div>
              </div>

              {/* Cook Time */}
              <div className="flex items-center p-4 bg-green-50 rounded-xl border border-green-200 justify-center">
                <div className="flex items-center space-x-2">
                  <Flame className="w-6 h-6 text-green-500" />
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-700">
                      {selectedRecipe.cook_time}
                    </div>
                    <div className="text-xs text-gray-600">Cook (min)</div>
                  </div>
                </div>
              </div>

              {/* Servings */}
              <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-200 justify-center">
                <div className="flex items-center space-x-2">
                  <UsersIcon className="w-6 h-6 text-blue-500" />
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-700">
                      {selectedRecipe.servings}
                    </div>
                    <div className="text-xs text-gray-600">Servings</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Blocos de Nutritional Facts: Calories / Protein / Carbs ─── */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="text-xl font-bold text-red-600">
                  {selectedRecipe.nutrition?.calories}
                </div>
                <div className="text-xs text-gray-600">Calories</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="text-xl font-bold text-blue-600">
                  {selectedRecipe.nutrition?.protein}g
                </div>
                <div className="text-xs text-gray-600">Protein</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="text-xl font-bold text-purple-600">
                  {selectedRecipe.nutrition?.carbs}g
                </div>
                <div className="text-xs text-gray-600">Carbs</div>
              </div>
            </div>

            {/* ─── Ingredientes ─── */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">🥘 Ingredients</h3>
              <div className="space-y-2">
                {selectedRecipe.ingredients?.map((ing, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="text-sm font-medium text-gray-800">
                      {ing.amount}
                    </div>
                    <div className="text-sm text-gray-700">{ing.item}</div>
                    {ing.notes && (
                      <div className="text-xs text-gray-500">({ing.notes})</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Instruções (com checkbox) ─── */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                <Utensils className="w-5 h-5 mr-2" />Instructions
              </h3>
              <div className="space-y-4">
                {selectedRecipe.instructions?.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200"
                  >
                    {/* Checkbox controlável */}
                    <input
                      type="checkbox"
                      id={`step-${idx}`}
                      className="mt-1 h-5 w-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                      onChange={(e) => {
                        // Se quiser armazenar o estado de “marcado/desmarcado”, crie um state separado
                        // Exemplo (fora deste return):
                        //   const [doneSteps, setDoneSteps] = useState({});
                        // Depois:
                        //   setDoneSteps(prev => ({ ...prev, [idx]: e.target.checked }));
                        //
                        // Aqui, apenas console.log:
                        console.log(`Step ${idx} marcado?`, e.target.checked);
                      }}
                    />
                    <label htmlFor={`step-${idx}`} className="flex-1 text-gray-700">
                      {step}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Tags (se existirem) ─── */}
            {selectedRecipe.tags?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRecipe.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };



  const renderMealHistory = () => (
    <div className="min-h-screen bg-gradient-to-br from-light-bgStart to-light-bgEnd dark:from-dark-bgStart dark:to-dark-bgEnd p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentView('dashboard')}
          className="text-gray-800 text-2xl font-bold"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex items-center">
          <History className="w-5 h-5 mr-2" />Meal History
        </h1>
        <div className="w-6" />
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <History className="w-6 h-6 mr-2 text-orange-500" />
          Your Analyzed Meals
        </h2>

        {mealHistory.length > 0 ? (
          <div className="space-y-4">
            {mealHistory.map((meal) => (
              <button
                key={meal.id}
                onClick={() => {
                  setSelectedHistoryMeal(meal);
                  setCurrentView('meal-details');
                }}
                className="w-full text-left bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-2xl border border-orange-200 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-orange-900 text-lg">
                      {meal.foods_detected?.[0] || 'Unknown Dish'}
                      {meal.foods_detected?.length > 1 &&
                        ` + ${meal.foods_detected.length - 1} more`}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(meal.created_at).toLocaleDateString()} at{' '}
                      {new Date(meal.created_at).toLocaleTimeString()}
                    </p>
                    <p className="text-sm text-orange-700 capitalize mt-1">
                      {meal.meal_type} • {meal.eating_personality_type || 'Balanced Eater'}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div
                      className={`text-lg font-bold ${meal.health_score >= 8
                        ? 'text-green-600'
                        : meal.health_score >= 6
                          ? 'text-yellow-600'
                          : 'text-red-600'
                        }`}
                    >
                      {meal.health_score}/10
                    </div>
                    <div className="text-xs text-gray-600">Health Score</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {meal.foods_detected?.map((food, index) => (
                    <span
                      key={index}
                      className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {food}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-2 bg-white rounded-lg">
                    <div className="text-sm font-bold text-red-600">{meal.total_calories}</div>
                    <div className="text-xs text-gray-600">Cal</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg">
                    <div className="text-sm font-bold text-blue-600">{meal.protein}g</div>
                    <div className="text-xs text-gray-600">Protein</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg">
                    <div className="text-sm font-bold text-yellow-600">{meal.carbs}g</div>
                    <div className="text-xs text-gray-600">Carbs</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg">
                    <div className="text-sm font-bold text-purple-600">{meal.fat}g</div>
                    <div className="text-xs text-gray-600">Fat</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600">No meal history yet. Start analyzing your meals!</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderMealDetails = () => {
    if (!selectedHistoryMeal) return null;
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-bgStart to-light-bgEnd dark:from-dark-bgStart dark:to-dark-bgEnd p-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              setSelectedHistoryMeal(null);
              setCurrentView('meal-history');
            }}
            className="text-gray-800 text-2xl font-bold"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">
            {selectedHistoryMeal.foods_detected?.[0] || 'Meal Details'}
          </h1>
          <div className="w-6" />
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          {selectedHistoryMeal.image_url && (
            <div className="mb-6">
              <img
                src={selectedHistoryMeal.image_url}
                alt="Meal"
                className="w-full h-64 object-cover rounded-2xl shadow-md"
              />
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {selectedHistoryMeal.foods_detected?.[0] || 'Unknown Dish'}
            </h2>
            <p className="text-sm text-gray-600">
              Analyzed on{' '}
              {new Date(selectedHistoryMeal.created_at).toLocaleDateString()}{' '}
              at{' '}
              {new Date(selectedHistoryMeal.created_at).toLocaleTimeString()}
            </p>
            <div className="flex items-center mt-2">
              <div
                className={`text-xl font-bold mr-4 ${selectedHistoryMeal.health_score >= 8
                  ? 'text-green-600'
                  : selectedHistoryMeal.health_score >= 6
                    ? 'text-yellow-600'
                    : 'text-red-600'
                  }`}
              >
                Health Score: {selectedHistoryMeal.health_score}/10
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Foods Detected:</h3>
            <div className="flex flex-wrap gap-2">
              {selectedHistoryMeal.foods_detected?.map((food, index) => (
                <span
                  key={index}
                  className="bg-orange-100 text-orange-800 px-3 py-2 rounded-full text-sm font-medium border border-orange-200"
                >
                  {food}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center p-2 bg-white rounded-lg">
              <div className="text-sm font-bold text-red-600">
                {selectedHistoryMeal.total_calories}
              </div>
              <div className="text-xs text-gray-600">Cal</div>
            </div>
            <div className="text-center p-2 bg-white rounded-lg">
              <div className="text-sm font-bold text-blue-600">
                {selectedHistoryMeal.protein}g
              </div>
              <div className="text-xs text-gray-600">Protein</div>
            </div>
            <div className="text-center p-2 bg-white rounded-lg">
              <div className="text-sm font-bold text-yellow-600">
                {selectedHistoryMeal.carbs}g
              </div>
              <div className="text-xs text-gray-600">Carbs</div>
            </div>
            <div className="text-center p-2 bg-white rounded-lg">
              <div className="text-sm font-bold text-purple-600">
                {selectedHistoryMeal.fat}g
              </div>
              <div className="text-xs text-gray-600">Fat</div>
            </div>
          </div>

          {selectedHistoryMeal.eating_personality_type && (
            <div className="mt-3 p-2 bg-white rounded-lg">
              <span className="text-sm text-gray-600">Eating Personality: </span>
              <span className="font-medium text-orange-700">
                {selectedHistoryMeal.eating_personality_type}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDailyLog = () => {
    // Gera todas as datas do mês selecionado
    const getDaysOfMonth = () => {
      const days = [];
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      for (let d = 1; d <= lastDay.getDate(); d++) {
        days.push(new Date(year, month, d));
      }
      return days;
    };

    const daysOfMonth = getDaysOfMonth();

    return (
      <div className="min-h-screen bg-gradient-to-br from-light-bgStart to-light-bgEnd dark:from-dark-bgStart dark:to-dark-bgEnd p-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="text-gray-800 text-2xl font-bold"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Daily Food Log</h1>
          <button
            onClick={() => setShowMealForm(true)}
            className="bg-orange-500 text-white p-2 rounded-xl"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* MONTH CALENDAR */}
        <div className="bg-white rounded-3xl shadow-lg p-4 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setSelectedDate(newDate);
              }}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-gray-900">
              {selectedDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </h2>
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() + 1);
                if (
                  new Date(
                    newDate.getFullYear(),
                    newDate.getMonth(),
                    1
                  ) <=
                  new Date()
                ) {
                  setSelectedDate(newDate);
                }
              }}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              disabled={(() => {
                const nextMonth = new Date(selectedDate);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1) > new Date();
              })()}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((wd) => (
              <div key={wd} className="text-xs font-medium text-gray-600 text-center">
                {wd}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 mt-2">
            {/* Preenche espaços vazios antes do primeiro dia */}
            {Array(daysOfMonth[0].getDay())
              .fill(null)
              .map((_, idx) => (
                <div key={`empty-${idx}`} className="text-center text-gray-300">
                  -
                </div>
              ))}
            {daysOfMonth.map((day, index) => {
              const isSelected = day.toDateString() === selectedDate.toDateString();
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedDate(day);
                    loadDailyMeals();
                  }}
                  className={`p-3 rounded-xl text-center transition-all ${isSelected
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white'
                    : isToday
                      ? 'bg-orange-100 text-orange-600 border border-orange-300'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <div className="text-sm font-medium">{day.getDate()}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* TODAY’S SUMMARY */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Eye className="w-6 h-6 mr-2 text-orange-500" />
            {formatDate(selectedDate)} Summary
          </h2>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-red-600">
                {dailyMeals.reduce((sum, meal) => sum + meal.calories, 0)}
              </div>
              <div className="text-sm text-red-700">Calories</div>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-blue-600">
                {dailyMeals
                  .reduce((sum, meal) => sum + meal.protein, 0)
                  .toFixed(1)}
                g
              </div>
              <div className="text-sm text-blue-700">Protein</div>
            </div>
            <div className="p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-yellow-600">
                {dailyMeals
                  .reduce((sum, meal) => sum + meal.carbs, 0)
                  .toFixed(1)}
                g
              </div>
              <div className="text-sm text-yellow-700">Carbs</div>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-purple-600">
                {dailyMeals
                  .reduce((sum, meal) => sum + meal.fat, 0)
                  .toFixed(1)}
                g
              </div>
              <div className="text-sm text-purple-700">Fat</div>
            </div>
          </div>
        </div>

        {/* MEALS LIST */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Utensils className="w-6 h-6 mr-2 text-orange-500" />
            {formatDate(selectedDate)} Meals
            {loading && (
              <Loader className="w-4 h-4 ml-2 animate-spin text-orange-500" />
            )}
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <Loader className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading meals...</p>
            </div>
          ) : dailyMeals.length > 0 ? (
            <div className="space-y-4">
              {dailyMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-2xl border border-orange-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-orange-900">{meal.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-orange-700">
                        <span className="capitalize">{meal.meal_type}</span>
                        {meal.time && <span>{meal.time}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMeal(meal.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-2 bg-white rounded-lg">
                      <div className="text-sm font-bold text-red-600">
                        {meal.calories}
                      </div>
                      <div className="text-xs text-gray-600">Cal</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg">
                      <div className="text-sm font-bold text-blue-600">
                        {meal.protein}g
                      </div>
                      <div className="text-xs text-gray-600">Protein</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg">
                      <div className="text-sm font-bold text-yellow-600">
                        {meal.carbs}g
                      </div>
                      <div className="text-xs text-gray-600">Carbs</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg">
                      <div className="text-sm font-bold text-purple-600">
                        {meal.fat}g
                      </div>
                      <div className="text-xs text-gray-600">Fat</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">
                No meals logged for {formatDate(selectedDate)}. Start tracking your
                food!
              </p>
            </div>
          )}
        </div>

        {/* ADD MEAL MODAL */}
        {showMealForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {currentMeal.name ? currentMeal.name : 'Add Meal'}
                </h3>
                <button onClick={() => setShowMealForm(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Meal Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meal Name
                  </label>
                  <input
                    type="text"
                    value={currentMeal.name}
                    onChange={(e) =>
                      setCurrentMeal({ ...currentMeal, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Greek Yogurt with Berries"
                  />
                </div>

                {/* AI‐Powered Estimation */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200">
                  <h4 className="font-bold text-purple-900 mb-3">Nutrition Estimation</h4>

                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => mealImageInputRef.current?.click()}
                        disabled={isEstimating}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 text-white py-2 px-3 rounded-lg text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        <Camera className="w-4 h-4 mr-1 inline" /> Add Photo
                      </button>
                      <button
                        onClick={estimateMealWithAI}
                        disabled={
                          isEstimating || (!currentMeal.name.trim() && !mealImageFile)
                        }
                        className="flex-1 bg-gradient-to-r from-light-accent to-light-accent2 dark:from-dark-accent dark:to-dark-accent2 text-white py-2 px-3 rounded-lg text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {isEstimating ? (
                          <Loader className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-1 inline" /> Estimate
                          </>
                        )}
                      </button>
                    </div>

                    {mealImagePreview && (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border border-purple-200">
                        <img
                          src={mealImagePreview}
                          alt="Meal preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => {
                            setMealImageFile(null);
                            setMealImagePreview(null);
                          }}
                          className="absolute top-1 right-1 bg-white rounded-full p-1 text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {aiMealEstimation && (
                      <div className="bg-white bg-opacity-70 p-3 rounded-lg">
                        <p className="text-sm font-medium text-purple-800 mb-1">
                          Suggested Title: {aiMealEstimation.title}
                        </p>
                        <p className="text-sm text-purple-800 font-medium">
                          {aiMealEstimation.calories} cal, {aiMealEstimation.protein}g protein
                        </p>
                        <p className="text-xs text-purple-600 mt-1">
                          {aiMealEstimation.confidence}% confidence
                        </p>
                      </div>
                    )}
                  </div>

                  <input
                    ref={mealImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleMealImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Editable Nutrition Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meal Type
                    </label>
                    <select
                      value={currentMeal.meal_type}
                      onChange={(e) =>
                        setCurrentMeal({ ...currentMeal, meal_type: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={currentMeal.time}
                      onChange={(e) =>
                        setCurrentMeal({ ...currentMeal, time: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Calories
                    </label>
                    <input
                      type="number"
                      value={currentMeal.calories}
                      onChange={(e) =>
                        setCurrentMeal({ ...currentMeal, calories: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={currentMeal.protein}
                      onChange={(e) =>
                        setCurrentMeal({ ...currentMeal, protein: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={currentMeal.carbs}
                      onChange={(e) =>
                        setCurrentMeal({ ...currentMeal, carbs: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fat (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={currentMeal.fat}
                      onChange={(e) =>
                        setCurrentMeal({ ...currentMeal, fat: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* CANCEL & SAVE BUTTONS */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowMealForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveMeal}
                    className="flex-1 bg-gradient-to-r from-light-accent to-light-accent2 dark:from-dark-accent dark:to-dark-accent2 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    <Save className="w-5 h-5 inline mr-2" />
                    Save Meal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMenstrualCycle = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentView('dashboard')}
          className="text-gray-800 text-2xl font-bold"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex items-center">
          <Moon className="w-5 h-5 mr-2" />Cycle Tracking
        </h1>
        <div className="w-6" />
      </div>
      {menstrualCycleData?.cycle_data ? (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Moon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Cycle Day {menstrualCycleData.cycle_data.cycle_day}
              </h2>
              <p className="text-gray-600 capitalize">
                {menstrualCycleData.cycle_data.current_phase} Phase
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-2xl border border-purple-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                  <Utensils className="w-5 h-5 mr-2" />Phase Nutrition Recommendations
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-purple-800">Focus Foods: </span>
                    <span className="text-purple-700">
                      {menstrualCycleData.cycle_data.recommendations.focus_foods?.join(
                        ', '
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-purple-800">Limit: </span>
                    <span className="text-purple-700">
                      {menstrualCycleData.cycle_data.recommendations.limit_foods?.join(
                        ', '
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-purple-800">Hydration: </span>
                    <span className="text-purple-700">
                      {menstrualCycleData.cycle_data.recommendations.hydration}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-4 rounded-2xl border border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-2">Energy Level</h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(menstrualCycleData.cycle_data.energy_level / 10) * 100
                            }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-blue-900">
                      {menstrualCycleData.cycle_data.energy_level}/10
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-pink-100 to-purple-100 p-4 rounded-2xl border border-pink-200">
                  <h4 className="font-bold text-pink-900 mb-2">Mood</h4>
                  <p className="text-lg font-bold text-pink-600 capitalize">
                    {menstrualCycleData.cycle_data.mood}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-100 to-yellow-100 p-4 rounded-2xl border border-orange-200">
                <h4 className="font-bold text-orange-900 mb-2">Current Cravings</h4>
                <div className="flex flex-wrap gap-2">
                  {menstrualCycleData.cycle_data.cravings?.length > 0 ? (
                    menstrualCycleData.cycle_data.cravings.map((craving, index) => (
                      <span
                        key={index}
                        className="bg-orange-200 text-orange-800 px-2 py-1 rounded-full text-sm"
                      >
                        {craving}
                      </span>
                    ))
                  ) : (
                    <span className="text-orange-700 text-sm">
                      No specific cravings logged
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Moon className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cycle Tracking Not Set Up</h2>
          <p className="text-gray-600 mb-6">
            Enable cycle tracking to get personalized nutrition recommendations
          </p>
          <button
            onClick={() => {
              showSuccess('Cycle tracking will be set up in your profile settings');
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-bold"
          >
            Set Up Tracking
          </button>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="min-h-screen bg-gradient-to-br from-light-bgStart to-light-bgEnd dark:from-dark-bgStart dark:to-dark-bgEnd p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentView('dashboard')} className="text-gray-800 text-2xl font-bold">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Settings</h1>
        <div className="w-6" />
      </div>
      <div className="space-y-6">
        {/* PREFERENCES */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Preferences</h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <span className="font-medium text-gray-900">Dark Mode</span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-1 rounded-full bg-gray-200"
            >
              {darkMode ? 'Disable' : 'Enable'}
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mt-3">
            <span className="font-medium text-gray-900">Email Notifications</span>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className="px-3 py-1 rounded-full bg-gray-200"
            >
              {emailNotifications ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => setCurrentView('meal-history')}
              className="w-full flex items-center space-x-3 p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
            >
              <History className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-orange-900">View Meal History</span>
            </button>

            <button
              onClick={() => setCurrentView('profile')}
              className="w-full flex items-center space-x-3 p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors"
            >
              <Edit3 className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-900">Edit Profile</span>
            </button>

            {user?.gender === 'female' && user?.track_menstrual_cycle && (
              <button
                onClick={() => setCurrentView('menstrual-cycle')}
                className="w-full flex items-center space-x-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
              >
                <Moon className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">Cycle Tracking</span>
              </button>
            )}
          </div>
        </div>

        {/* ACCOUNT */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Account</h2>
          <button
            onClick={logout}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <ImprovedProfileSection
      user={user}
      userProfile={userProfile}
      onSaveProfile={(updated) => setUserProfile(updated)}
      onOpenSettings={() => setCurrentView('settings')}
      apiCall={apiCall}
    />
  );

  const renderCameraCapture = () => {
    return (
      <div className="min-h-screen bg-black relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
        ></video>

        <div className="absolute bottom-0 left-0 w-full p-6 flex justify-center space-x-4">
          <button
            onClick={capturePhoto}
            className="bg-white text-gray-900 p-4 rounded-full shadow-lg"
          >
            <div className="w-12 h-12 border-4 border-gray-900 rounded-full"></div>
          </button>

          <button
            onClick={stopCamera}
            className="bg-red-500 text-white p-4 rounded-full shadow-lg flex items-center justify-center"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="absolute top-4 left-4">
          <button
            onClick={stopCamera}
            className="bg-black bg-opacity-50 text-white p-2 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  };

  const renderNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2">
      <div className="grid grid-cols-5 items-end">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center py-2 px-2 rounded-xl ${currentView === 'dashboard' ? 'bg-orange-100 text-orange-600' : 'text-gray-600'}`}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Home</span>
        </button>

        <button
          onClick={() => setCurrentView('daily-log')}
          className={`flex flex-col items-center py-2 px-2 rounded-xl ${currentView === 'daily-log' ? 'bg-yellow-100 text-yellow-600' : 'text-gray-600'
            }`}
        >
          <Calendar className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Log</span>
        </button>

        <button
          onClick={() => setCurrentView('smart-scanner')}
          className={`justify-self-center p-3 rounded-full ${currentView === 'smart-scanner' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'} shadow-lg -mt-6`}
        >
          <Camera className="w-6 h-6" />
        </button>

        <button
          onClick={() => setCurrentView('recipe-book')}
          className={`flex flex-col items-center py-2 px-2 rounded-xl ${currentView === 'recipe-book' ? 'bg-yellow-100 text-yellow-600' : 'text-gray-600'
            }`}
        >
          <BookOpen className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Recipes</span>
        </button>

        <button
          onClick={() => setCurrentView('profile')}
          className={`flex flex-col items-center py-2 px-2 rounded-xl ${currentView === 'profile' ? 'bg-gray-100 text-gray-600' : 'text-gray-600'
            }`}
        >
          <UserIcon className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Profile</span>
        </button>
      </div>
    </div>
  );

  // ─────────── RENDER CURRENT VIEW ───────────

  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return renderLogin();
      case 'register':
        return renderRegister();
      case 'dashboard':
        return renderDashboard();
      case 'food-analysis':
        return renderFoodAnalysis();
      case 'recipe-book':
        return renderRecipeBook();
      case 'recipe-details':
        return renderRecipeDetails();
      case 'meal-history':
        return renderMealHistory();
      case 'meal-details':
        return renderMealDetails();
      case 'daily-log':
        return renderDailyLog();
      case 'smart-scanner':
        return renderSmartScanner();
      case 'menstrual-cycle':
        return renderMenstrualCycle();
      case 'profile':
        return renderProfile();
      case 'settings':
        return renderSettings();
      case 'camera-capture':
        return renderCameraCapture();
      default:
        return renderDashboard();
    }
  };

  // ─────────── MAIN RETURN ───────────
  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentView()}
      {user && !['login', 'register', 'camera-capture'].includes(currentView) && (
        <>
          {renderNavigation()}
          <button
            onClick={() => setShowHelp(true)}
            className="fixed bottom-20 right-4 bg-orange-500 text-white p-3 rounded-full shadow-lg z-40"
            aria-label="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </>
      )}

      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Quick Tour</h2>
              <button onClick={() => setShowHelp(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-2 text-gray-700 text-sm">
              <p><strong>Home:</strong> overview and suggestions.</p>
              <p><strong>Log:</strong> track your meals.</p>
              <p><strong>Recipes:</strong> create personalized dishes.</p>
              <p><strong>Profile:</strong> manage your information and settings.</p>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed top-4 left-4 right-4 bg-green-500 text-white p-4 rounded-xl shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 left-4 right-4 bg-red-500 text-white p-4 rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-white hover:text-red-200 ml-4">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {loading && currentView !== 'food-analysis' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 flex items-center space-x-3">
            <Loader className="w-6 h-6 animate-spin text-orange-500" />
            <span className="font-medium text-gray-900">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutriVisionApp;
