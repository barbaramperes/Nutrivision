import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Loader,
  CheckCircle,
  AlertTriangle,
  Home,
  Settings,
  BookOpen,
  Dna,
  Moon,
  Calendar,
  Utensils,
  History,
  ScanLine,
  Plus,
  Search,
  Trash2,
  Save,
  ArrowLeft,
  Eye,
  Sparkles,
  Activity,
  Brain,
  Lightbulb,
  X,
  ChevronLeft,
  ChevronRight,
  Wand2, // NOVO

} from 'lucide-react';

const NutriVisionApp = () => {
  const [currentView, setCurrentView] = useState('login');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dailyLogLoading, setDailyLogLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  const [moodBefore, setMoodBefore] = useState('neutral');
  const [socialContext, setSocialContext] = useState('alone');
  const [mealSuggestions, setMealSuggestions] = useState([]);
  const [nutritionPlan, setNutritionPlan] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);

  // Recipe states
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

  // New state for image–based recipe detection:
  const [recipeImageFile, setRecipeImageFile] = useState(null);
  const [recipeImagePreview, setRecipeImagePreview] = useState(null);

  const [menstrualCycleData, setMenstrualCycleData] = useState(null);
  const [userRecipes, setUserRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [mealHistory, setMealHistory] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Daily log & barcode scanner states
  const [dailyMeals, setDailyMeals] = useState([]);
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
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedProduct, setScannedProduct] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [aiMealEstimation, setAiMealEstimation] = useState(null);
  const [mealImageFile, setMealImageFile] = useState(null);
  const [mealImagePreview, setMealImagePreview] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  // Meal History → Meal Details
  const [selectedHistoryMeal, setSelectedHistoryMeal] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const barcodeImageRef = useRef(null);
  // New file input specifically for recipe images:
  const recipeFileInputRef = useRef(null);
  const mealImageInputRef = useRef(null);

  const API_BASE = '/api';

  // Generic API call com JSON
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      });

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      return await response.json();
    } catch (err) {
      console.error('API Error:', err);
      if (
        err.message.includes('Failed to fetch') ||
        err.message.includes('NetworkError')
      ) {
        throw new Error('Connection error. Please check if the server is running.');
      }
      throw err;
    }
  };
  // ADICIONAR ESTAS FUNÇÕES antes de renderCurrentView():

  const estimateMealWithAI = async () => {
    if (!currentMeal.name.trim() && !mealImageFile) {
      setError('Please enter a meal name or upload an image');
      return;
    }

    setIsEstimating(true);
    try {
      let result;

      if (mealImageFile) {
        // Image-based estimation
        const formData = new FormData();
        formData.append('image', mealImageFile);
        formData.append('action', 'estimate_nutrition');

        const response = await fetch(`${API_BASE}/ai-meal-estimation`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to estimate meal from image');
        }

        result = await response.json();
      } else {
        // Text-based estimation
        result = await apiCall('/ai-meal-estimation', {
          method: 'POST',
          body: JSON.stringify({
            meal_description: currentMeal.name,
            action: 'estimate_nutrition'
          }),
        });
      }

      setAiMealEstimation(result.estimation);
      setCurrentMeal(prev => ({
        ...prev,
        calories: result.estimation.calories.toString(),
        protein: result.estimation.protein.toString(),
        carbs: result.estimation.carbs.toString(),
        fat: result.estimation.fat.toString(),
      }));

      showSuccess('AI estimation completed! 🤖');
    } catch (err) {
      setError(`AI estimation failed: ${err.message}`);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleMealImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setMealImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setMealImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const resetMealForm = () => {
    setCurrentMeal({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      meal_type: 'breakfast',
      time: '',
    });
    setMealImageFile(null);
    setMealImagePreview(null);
    setAiMealEstimation(null);
    setShowMealForm(false);
  };

  // 16. Dispatcher (renderCurrentView deve ficar fora do apiCall)
  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return renderLogin();
      case 'register':
        return renderRegister();
      case 'dashboard':
        return renderDashboard();
      case 'camera-capture':
        return renderCameraCapture();
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
      case 'nutrition-plan':
        return renderNutritionPlan();
      case 'menstrual-cycle':
        return renderMenstrualCycle();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  // 10. Meal History
  // SUBSTITUIR COMPLETAMENTE a função renderMealHistory():
  const renderMealHistory = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentView('dashboard')} className="text-gray-800 text-2xl font-bold">
          ←
        </button>
        <h1 className="text-lg font-bold text-gray-900">📊 Meal History</h1>
        <div className="w-6"></div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <History className="w-6 h-6 mr-2 text-orange-500" />
          📈 Your Analyzed Meals
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
                      {meal.foods_detected?.length > 1 && ` + ${meal.foods_detected.length - 1} more`}
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

  // SUBSTITUIR COMPLETAMENTE renderMealDetails():
  const renderMealDetails = () => {
    if (!selectedHistoryMeal) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              setSelectedHistoryMeal(null);
              setCurrentView('meal-history');
            }}
            className="text-gray-800 text-2xl font-bold"
          >
            ←
          </button>
          <h1 className="text-lg font-bold text-gray-900">
            {selectedHistoryMeal.foods_detected?.[0] || 'Meal Details'}
          </h1>
          <div className="w-6"></div>
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
              <div className={`text-xl font-bold mr-4 ${selectedHistoryMeal.health_score >= 8 ? 'text-green-600' :
                selectedHistoryMeal.health_score >= 6 ? 'text-yellow-600' : 'text-red-600'
                }`}>
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

  // 12. Daily Log - FIXED VERSION
  const renderDailyLog = () => {
    const getDaysOfWeek = () => {
      const days = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        days.push(date);
      }
      return days;
    };

    const daysOfWeek = getDaysOfWeek();

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCurrentView('dashboard')} className="text-gray-800 text-2xl font-bold">
            ←
          </button>
          <h1 className="text-lg font-bold text-gray-900">📋 Daily Food Log</h1>
          <button
            onClick={() => setShowMealForm(true)}
            className="bg-orange-500 text-white p-2 rounded-xl"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Week Calendar */}
        <div className="bg-white rounded-3xl shadow-lg p-4 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() - 7);
                setSelectedDate(newDate);
              }}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-gray-900">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 7);
                if (newDate <= new Date()) {
                  setSelectedDate(newDate);
                }
              }}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              disabled={(() => {
                const nextWeek = new Date(selectedDate);
                nextWeek.setDate(nextWeek.getDate() + 7);
                return nextWeek > new Date();
              })()}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {daysOfWeek.map((day, index) => {
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
                  <div className="text-xs font-medium">{getDayName(day).slice(0, 3)}</div>
                  <div className="text-lg font-bold">{formatDate(day).split(' ')[1]}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Barcode Scanner Section */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <ScanLine className="w-6 h-6 mr-2 text-orange-500" />
            📦 Barcode Scanner
          </h2>

          <div className="flex space-x-3 mb-4">
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Enter barcode number"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={scanBarcode}
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-yellow-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex justify-center">
            <button
              onClick={scanBarcodeFromImage}
              className="bg-gradient-to-r from-gray-800 to-gray-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center space-x-2"
            >
              <Camera className="w-5 h-5" />
              <span>📸 Scan from Photo</span>
            </button>
          </div>

          <input
            ref={barcodeImageRef}
            type="file"
            accept="image/*"
            onChange={handleBarcodeImageUpload}
            className="hidden"
          />

          {scannedProduct && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-2xl border border-green-200 mt-4">
              <div className="flex items-center space-x-4">
                <img
                  src={scannedProduct.image_url}
                  alt={scannedProduct.name}
                  className="w-16 h-16 object-cover rounded-xl"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-green-900">{scannedProduct.name}</h3>
                  <p className="text-sm text-green-700">{scannedProduct.brand}</p>
                  <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
                    <span>🔥 {scannedProduct.calories_per_100g} cal</span>
                    <span>💪 {scannedProduct.protein_per_100g}g protein</span>
                    <span>🌾 {scannedProduct.carbs_per_100g}g carbs</span>
                    <span>🥑 {scannedProduct.fat_per_100g}g fat</span>
                  </div>
                </div>
                <button
                  onClick={addMealFromProduct}
                  className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700"
                >
                  Add to Log
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Today's Summary */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Eye className="w-6 h-6 mr-2 text-orange-500" />
            📊 {formatDate(selectedDate)} Summary
          </h2>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
              <div className="text-2xl font-bold text-red-600">
                {dailyMeals.reduce((sum, meal) => sum + meal.calories, 0)}
              </div>
              <div className="text-sm text-red-700">Calories</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">
                {dailyMeals.reduce((sum, meal) => sum + meal.protein, 0).toFixed(1)}g
              </div>
              <div className="text-sm text-blue-700">Protein</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
              <div className="text-2xl font-bold text-yellow-600">
                {dailyMeals.reduce((sum, meal) => sum + meal.carbs, 0).toFixed(1)}g
              </div>
              <div className="text-sm text-yellow-700">Carbs</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <div className="text-2xl font-bold text-purple-600">
                {dailyMeals.reduce((sum, meal) => sum + meal.fat, 0).toFixed(1)}g
              </div>
              <div className="text-sm text-purple-700">Fat</div>
            </div>
          </div>
        </div>

        {/* Meals List */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Utensils className="w-6 h-6 mr-2 text-orange-500" />
            🍽️ {formatDate(selectedDate)} Meals
            {dailyLogLoading && <Loader className="w-4 h-4 ml-2 animate-spin text-orange-500" />}
          </h2>

          {dailyLogLoading ? (
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
                      <div className="text-sm font-bold text-red-600">{meal.calories}</div>
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
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">No meals logged for {formatDate(selectedDate)}. Start tracking your food!</p>
            </div>
          )}
        </div>

        {/* Add Meal Modal
        {showMealForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Add Meal</h3>
                <button onClick={() => setShowMealForm(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meal Name</label>
                  <input
                    type="text"
                    value={currentMeal.name}
                    onChange={(e) => setCurrentMeal({ ...currentMeal, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Greek Yogurt with Berries"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
                    <select
                      value={currentMeal.meal_type}
                      onChange={(e) => setCurrentMeal({ ...currentMeal, meal_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="breakfast">🌅 Breakfast</option>
                      <option value="lunch">🌞 Lunch</option>
                      <option value="dinner">🌙 Dinner</option>
                      <option value="snack">🥨 Snack</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      value={currentMeal.time}
                      onChange={(e) => setCurrentMeal({ ...currentMeal, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                    <input
                      type="number"
                      value={currentMeal.calories}
                      onChange={(e) => setCurrentMeal({ ...currentMeal, calories: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={currentMeal.protein}
                      onChange={(e) => setCurrentMeal({ ...currentMeal, protein: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                    />
                  </div>
                </div> */}
        {/* Enhanced Add Meal Modal with AI */}
        {showMealForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Add Meal</h3>
                <button onClick={() => resetMealForm()} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meal Name</label>
                  <input
                    type="text"
                    value={currentMeal.name}
                    onChange={(e) => setCurrentMeal({ ...currentMeal, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Greek Yogurt with Berries"
                  />
                </div>

                {/* AI-powered meal estimation */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200">
                  <h4 className="font-bold text-purple-900 mb-3 flex items-center">
                    <Wand2 className="w-5 h-5 mr-2" />
                    🤖 AI Nutrition Estimation
                  </h4>

                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => mealImageInputRef.current?.click()}
                        disabled={isEstimating}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 text-white py-2 px-3 rounded-lg text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        📸 Add Photo
                      </button>
                      <button
                        onClick={estimateMealWithAI}
                        disabled={isEstimating || (!currentMeal.name.trim() && !mealImageFile)}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-600 text-white py-2 px-3 rounded-lg text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {isEstimating ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : '✨ Estimate'}
                      </button>
                    </div>

                    {mealImagePreview && (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border border-purple-200">
                        <img src={mealImagePreview} alt="Meal preview" className="w-full h-full object-cover" />
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
                        <p className="text-sm text-purple-800 font-medium">
                          AI Estimation: {aiMealEstimation.calories} cal, {aiMealEstimation.protein}g protein
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={currentMeal.carbs}
                      onChange={(e) => setCurrentMeal({ ...currentMeal, carbs: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fat (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={currentMeal.fat}
                      onChange={(e) => setCurrentMeal({ ...currentMeal, fat: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowMealForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveMeal}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
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

  // 13. Menstrual Cycle Tracking
  const renderMenstrualCycle = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentView('dashboard')} className="text-gray-800 text-2xl font-bold">
          ←
        </button>
        <h1 className="text-lg font-bold text-gray-900">🌙 Cycle Tracking</h1>
        <div className="w-6"></div>
      </div>
      {menstrualCycleData?.cycle_data ? (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Moon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Cycle Day {menstrualCycleData.cycle_data.cycle_day}</h2>
              <p className="text-gray-600 capitalize">{menstrualCycleData.cycle_data.current_phase} Phase</p>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-2xl border border-purple-200">
                <h3 className="font-bold text-gray-900 mb-3">🥗 Phase Nutrition Recommendations</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-purple-800">Focus Foods: </span>
                    <span className="text-purple-700">
                      {menstrualCycleData.cycle_data.recommendations.focus_foods?.join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-purple-800">Limit: </span>
                    <span className="text-purple-700">
                      {menstrualCycleData.cycle_data.recommendations.limit_foods?.join(', ')}
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
                        style={{ width: `${(menstrualCycleData.cycle_data.energy_level / 10) * 100}%` }}
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
                    <span className="text-orange-700 text-sm">No specific cravings logged</span>
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

  // 14. Settings
  const renderSettings = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentView('dashboard')} className="text-gray-800 text-2xl font-bold">
          ←
        </button>
        <h1 className="text-lg font-bold text-gray-900">⚙️ Settings</h1>
        <div className="w-6"></div>
      </div>
      <div className="space-y-6">
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">User Profile</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <h3 className="font-medium text-gray-900">{user?.username}</h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{user?.level}</div>
                <div className="text-xs text-gray-600">{user?.total_xp} XP</div>
              </div>
            </div>
          </div>
        </div>

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
              onClick={() => setCurrentView('daily-log')}
              className="w-full flex items-center space-x-3 p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors"
            >
              <Calendar className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-900">Daily Food Log</span>
            </button>

            <button
              onClick={() => setCurrentView('nutrition-plan')}
              className="w-full flex items-center space-x-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
            >
              <Utensils className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Nutrition Plan</span>
            </button>

            <button
              onClick={() => setCurrentView('predictions')}
              className="w-full flex items-center space-x-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Predictive Insights</span>
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

  // 15. Nutrition Plan
  const renderNutritionPlan = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentView('dashboard')} className="text-gray-800 text-2xl font-bold">
          ←
        </button>
        <h1 className="text-lg font-bold text-gray-900">🥗 Nutrition Plan</h1>
        <div className="w-6"></div>
      </div>

      {nutritionPlan ? (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{nutritionPlan.plan_name}</h2>
              <p className="text-gray-600 capitalize">{nutritionPlan.plan_type.replace('_', ' ')} Plan</p>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-100 to-blue-100 p-5 rounded-2xl border border-green-200">
                <h3 className="font-bold text-gray-900 mb-4">📊 Daily Targets</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white bg-opacity-70 rounded-xl">
                    <div className="text-2xl font-bold text-red-600">
                      {nutritionPlan.daily_targets?.calories || 0}
                    </div>
                    <div className="text-sm text-gray-600">Calories</div>
                  </div>
                  <div className="text-center p-3 bg-white bg-opacity-70 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600">
                      {nutritionPlan.daily_targets?.protein || 0}g
                    </div>
                    <div className="text-sm text-gray-600">Protein</div>
                  </div>
                  <div className="text-center p-3 bg-white bg-opacity-70 rounded-xl">
                    <div className="text-2xl font-bold text-yellow-600">
                      {nutritionPlan.daily_targets?.carbs || 0}g
                    </div>
                    <div className="text-sm text-gray-600">Carbs</div>
                  </div>
                  <div className="text-center p-3 bg-white bg-opacity-70 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">
                      {nutritionPlan.daily_targets?.fat || 0}g
                    </div>
                    <div className="text-sm text-gray-600">Fat</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-100 to-green-100 p-5 rounded-2xl border border-blue-200">
                <h3 className="font-bold text-gray-900 mb-4">📈 Today's Progress</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">
                      {nutritionPlan.today_progress?.calories_consumed || 0}
                    </div>
                    <div className="text-sm text-gray-600">Calories Consumed</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            ((nutritionPlan.today_progress?.calories_consumed || 0) /
                              (nutritionPlan.daily_targets?.calories || 1)) *
                            100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">
                      {nutritionPlan.today_progress?.protein_consumed || 0}g
                    </div>
                    <div className="text-sm text-gray-600">Protein Consumed</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            ((nutritionPlan.today_progress?.protein_consumed || 0) /
                              (nutritionPlan.daily_targets?.protein || 1)) *
                            100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-blue-600 p-5 rounded-2xl text-white">
                <h3 className="font-bold text-lg mb-3">🎯 Meal Distribution</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <div className="text-sm text-green-100">Breakfast</div>
                    <div className="text-lg font-bold">
                      {Math.round((nutritionPlan.meal_distribution?.breakfast || 0.25) * 100)}%
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <div className="text-sm text-green-100">Lunch</div>
                    <div className="text-lg font-bold">
                      {Math.round((nutritionPlan.meal_distribution?.lunch || 0.35) * 100)}%
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <div className="text-sm text-green-100">Dinner</div>
                    <div className="text-lg font-bold">
                      {Math.round((nutritionPlan.meal_distribution?.dinner || 0.3) * 100)}%
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <div className="text-sm text-green-100">Snacks</div>
                    <div className="text-lg font-bold">
                      {Math.round((nutritionPlan.meal_distribution?.snacks || 0.1) * 100)}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-4 rounded-2xl border border-yellow-200">
                <h3 className="font-bold text-yellow-900 mb-3">💡 Smart Recommendations</h3>
                <ul className="space-y-2 text-yellow-800">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-yellow-600" />
                    <span className="text-sm">Focus on whole foods and lean proteins</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-yellow-600" />
                    <span className="text-sm">Stay hydrated with 8-10 glasses of water daily</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-yellow-600" />
                    <span className="text-sm">Time your meals every 3-4 hours</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-yellow-600" />
                    <span className="text-sm">Include colorful vegetables in every meal</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">No Nutrition Plan</h2>
          <p className="text-gray-600 mb-6">
            Let us create a personalized nutrition plan based on your goals and preferences
          </p>
          <button
            onClick={() => {
              showSuccess('Creating your personalized nutrition plan...');
              loadNutritionPlan();
            }}
            className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold"
          >
            Create My Plan
          </button>
        </div>
      )}
    </div>
  );

  // SUBSTITUIR COMPLETAMENTE renderNavigation() - REMOVER DNA:
  const renderNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2">
      <div className="flex justify-around">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center py-2 px-2 rounded-xl ${currentView === 'dashboard' ? 'bg-orange-100 text-orange-600' : 'text-gray-600'}`}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Home</span>
        </button>

        {/* DNA SECTION REMOVIDA COMPLETAMENTE */}

        <button
          onClick={() => setCurrentView('daily-log')}
          className={`flex flex-col items-center py-2 px-2 rounded-xl ${currentView === 'daily-log' ? 'bg-yellow-100 text-yellow-600' : 'text-gray-600'}`}
        >
          <Calendar className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Log</span>
        </button>

        <button
          onClick={() => setCurrentView('recipe-book')}
          className={`flex flex-col items-center py-2 px-2 rounded-xl ${currentView === 'recipe-book' ? 'bg-yellow-100 text-yellow-600' : 'text-gray-600'}`}
        >
          <BookOpen className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Recipes</span>
        </button>

        <button
          onClick={() => setCurrentView('nutrition-plan')}
          className={`flex flex-col items-center py-2 px-2 rounded-xl ${currentView === 'nutrition-plan' ? 'bg-green-100 text-green-600' : 'text-gray-600'}`}
        >
          <Utensils className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Plan</span>
        </button>

        <button
          onClick={() => setCurrentView('settings')}
          className={`flex flex-col items-center py-2 px-2 rounded-xl ${currentView === 'settings' ? 'bg-gray-100 text-gray-600' : 'text-gray-600'}`}
        >
          <Settings className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Settings</span>
        </button>
      </div>
    </div>
  );

  // On-mount: check if already authenticated
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
          setError('Server not responding. Please check if the backend is running.');
        }
      }
    };
    const timeoutId = setTimeout(checkAuth, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // Whenever `currentView` changes (and user exists), load the appropriate data
  useEffect(() => {
    if (user && !['login', 'register'].includes(currentView)) {
      const loadTimeout = setTimeout(() => {
        switch (currentView) {

          case 'menstrual-cycle':
            if (user.gender === 'female' && user.track_menstrual_cycle) {
              loadMenstrualCycleData();
            }
            break;
          case 'recipe-book':
            loadUserRecipes();
            break;
          case 'nutrition-plan':
            loadNutritionPlan();
            break;
          case 'meal-history':
            loadMealHistory();
            break;
          case 'daily-log':
            loadDailyMeals();
            break;
          case 'dashboard':
            loadMealSuggestions();
            loadDashboardStats();
            break;
          default:
            break;
        }
      }, 200);
      return () => clearTimeout(loadTimeout);
    }
  }, [currentView, user]);

  // Load daily meals when selectedDate changes
  useEffect(() => {
    if (user && currentView === 'daily-log') {
      loadDailyMeals();
    }
  }, [selectedDate, user, currentView]);

  // Clear error messages automatically
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const renderLogo = () => (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Eye className="w-7 h-7 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse"></div>
      </div>
      <div>
        <h1 className="text-2xl font-black text-gray-900">
          Nutri<span className="text-orange-500">Vision</span>
          <span className="text-yellow-500 text-sm"> PRO</span>
        </h1>
        <p className="text-xs text-gray-600 font-medium">Smart Food Coach</p>
      </div>
    </div>
  );

  // 5. Food Analysis
  const renderFoodAnalysis = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentView('dashboard')} className="text-gray-800 text-2xl font-bold">
          ←
        </button>
        <h1 className="text-lg font-bold text-gray-900">🚀 Smart Food Analysis</h1>
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${isAnalyzing ? 'bg-orange-500 animate-pulse' : 'bg-green-500'
              }`}
          ></div>
          <span
            className={`text-sm font-medium ${isAnalyzing ? 'text-orange-600' : 'text-green-600'
              }`}
          >
            {isAnalyzing ? 'Analyzing...' : 'Complete'}
          </span>
        </div>
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

              {isAnalyzing && (
                <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="relative mb-6">
                      <Brain className="w-16 h-16 text-orange-500 mx-auto animate-pulse" />
                      <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">🧬 Smart Analysis in Progress...</h3>
                    <p className="text-orange-300 mb-4">Processing with Advanced Technology + Psychology</p>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center justify-center space-x-2">
                        <Sparkles className="w-4 h-4 text-orange-400" />
                        <span>Analyzing Food DNA impact...</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <Activity className="w-4 h-4 text-yellow-400" />
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
                  <div className="absolute top-4 right-4 bg-green-600 bg-opacity-95 backdrop-blur-sm px-3 py-2 rounded-xl text-white font-bold text-sm shadow-lg">
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
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-orange-500" />
                    Technology Detected Foods
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.foods_detected?.map((food, index) => (
                      <span
                        key={index}
                        className="bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium border border-orange-200"
                      >
                        {food}
                      </span>
                    ))}
                  </div>
                </div>

                {analysisResult.revolutionary_insights && (
                  <div className="bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 p-6 rounded-2xl text-white mb-6 shadow-lg">
                    <h3 className="font-bold text-xl mb-4 flex items-center">
                      <Sparkles className="w-6 h-6 mr-2" />
                      🚀 Smart Insights
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                        <div className="text-sm text-orange-100">Satisfaction</div>
                        <div className="text-2xl font-bold">
                          {analysisResult.revolutionary_insights?.satisfaction_prediction || 7.5}/10
                        </div>
                      </div>
                      <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                        <div className="text-sm text-orange-100">Sleep Impact</div>
                        <div className="text-2xl font-bold">
                          {analysisResult.revolutionary_insights?.sleep_impact > 0 ? '+' : ''}
                          {analysisResult.revolutionary_insights?.sleep_impact || 0}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain className="w-5 h-5" />
                        <span className="font-semibold">Food Personality:</span>
                      </div>
                      <div className="text-lg font-bold text-yellow-200">
                        {analysisResult.revolutionary_insights?.personality_type || 'Balanced Consumer'}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="bg-gradient-to-br from-red-500 to-red-700 p-3 rounded-xl text-white text-center shadow-md">
                    <div className="text-lg font-bold">{analysisResult.nutrition?.calories || 0}</div>
                    <div className="text-red-200 text-xs">Calories</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-3 rounded-xl text-white text-center shadow-md">
                    <div className="text-lg font-bold">{analysisResult.nutrition?.protein || 0}g</div>
                    <div className="text-blue-200 text-xs">Protein</div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-3 rounded-xl text-white text-center shadow-md">
                    <div className="text-lg font-bold">{analysisResult.nutrition?.carbs || 0}g</div>
                    <div className="text-yellow-200 text-xs">Carbs</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl text-white text-center shadow-md">
                    <div className="text-lg font-bold">{analysisResult.nutrition?.fat || 0}g</div>
                    <div className="text-purple-200 text-xs">Fat</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-yellow-600 p-5 rounded-2xl text-white mb-6 shadow-lg">
                  <h3 className="font-bold text-lg mb-3 flex items-center">
                    <Brain className="w-6 h-6 mr-2" />
                    🧠 Smart Analysis
                  </h3>
                  <p className="text-orange-100 leading-relaxed">{analysisResult.ai_feedback}</p>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 p-5 rounded-2xl text-white shadow-lg">
                  <h3 className="font-bold text-lg mb-3 flex items-center">
                    <Lightbulb className="w-6 h-6 mr-2" />🎯 Suggestions
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
        </div>
      )}
    </div>
  );



  // 8. Recipe Book (with image-upload support)
  const renderRecipeBook = () => (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentView('dashboard')} className="text-gray-800 text-2xl font-bold">
          ←
        </button>
        <h1 className="text-lg font-bold text-gray-900">📚 Recipe Book</h1>
        <div className="w-6"></div>
      </div>
      {/* Create New Recipe */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Utensils className="w-6 h-6 mr-2 text-orange-500" />
          🎨 Create Personalized Recipe
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Ingredients</label>
            <textarea
              value={recipeIngredients}
              onChange={(e) => setRecipeIngredients(e.target.value)}
              placeholder="Enter ingredients separated by commas (e.g., chicken, broccoli, quinoa, garlic)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              rows="3"
            />
            <p className="text-xs text-gray-500 mt-1">🌍 Supports ingredients in English, Portuguese and Spanish</p>
          </div>

          {/* Image upload / camera */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Or Upload a Photo of Your Fridge/Shelf</label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  // try to open camera if available, otherwise fallback to file picker
                  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    navigator.mediaDevices
                      .getUserMedia({ video: { facingMode: 'environment' } })
                      .then((stream) => {
                        // capture a single frame
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
                            const file = new File([blob], 'fridge-capture.jpg', { type: 'image/jpeg' });
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
                className="bg-gradient-to-r from-gray-800 to-gray-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:shadow-lg transition-all"
              >
                📸 Capture Photo
              </button>

              <button
                onClick={() => recipeFileInputRef.current?.click()}
                className="bg-gradient-to-r from-orange-500 to-yellow-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:shadow-lg transition-all"
              >
                🖼️ Choose Photo
              </button>
            </div>
            {recipeImagePreview && (
              <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-gray-200">
                <img src={recipeImagePreview} alt="Fridge preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => {
                    setRecipeImageFile(null);
                    setRecipeImagePreview(null);
                  }}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 text-red-600 hover:text-red-800"
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
                reader.onload = () => {
                  setRecipeImagePreview(reader.result);
                };
                reader.readAsDataURL(file);
              }}
              className="hidden"
            />
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-xl border border-orange-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-orange-600" />
              🎯 Personalization Options
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Meal Type</label>
                <select
                  value={recipePersonalization.meal_type}
                  onChange={(e) => setRecipePersonalization({ ...recipePersonalization, meal_type: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="any">🍽️ Any Time</option>
                  <option value="breakfast">🌅 Breakfast</option>
                  <option value="lunch">🌞 Lunch</option>
                  <option value="dinner">🌙 Dinner</option>
                  <option value="snack">🥨 Snack</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Temperature</label>
                <select
                  value={recipePersonalization.temperature}
                  onChange={(e) => setRecipePersonalization({ ...recipePersonalization, temperature: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="any">🌡️ Any</option>
                  <option value="hot">🔥 Hot & Cozy</option>
                  <option value="cold">🧊 Cold & Fresh</option>
                  <option value="fresh">🥗 Fresh & Raw</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cooking Time</label>
                <select
                  value={recipePersonalization.cooking_time}
                  onChange={(e) => setRecipePersonalization({ ...recipePersonalization, cooking_time: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="quick">⚡ Quick (up to 20 min)</option>
                  <option value="medium">⏱️ Medium (20–45 min)</option>
                  <option value="elaborate">🎨 Elaborate (45+ min)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cuisine Style</label>
                <select
                  value={recipePersonalization.cuisine_style}
                  onChange={(e) => setRecipePersonalization({ ...recipePersonalization, cuisine_style: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="any">🌍 Any Style</option>
                  <option value="mediterranean">🫒 Mediterranean</option>
                  <option value="asian">🥢 Asian</option>
                  <option value="fusion">🌟 Fusion</option>
                  <option value="traditional">🏠 Traditional</option>
                  <option value="modern">✨ Modern</option>
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Dietary Preference</label>
              <select
                value={recipePersonalization.dietary_pref}
                onChange={(e) => setRecipePersonalization({ ...recipePersonalization, dietary_pref: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="none">🍽️ No Restriction</option>
                <option value="vegetarian">🥬 Vegetarian</option>
                <option value="vegan">🌱 Vegan</option>
                <option value="keto">🥑 Keto</option>
                <option value="low-carb">🥩 Low Carb</option>
                <option value="high-protein">💪 High Protein</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateRecipe}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : '🧑‍🍳 Generate Smart Personalized Recipe'}
          </button>
        </div>
      </div>

      {/* Display Recipe Options */}
      {recipeOptions.length > 0 && (
        <div className="bg-white rounded-3xl shadow-lg mb-6 border border-gray-100">
          <div className="p-4 border-b border-gray-200 flex space-x-2">
            {recipeOptions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedOptionIndex(idx)}
                className={`px-4 py-2 rounded-t-2xl text-sm font-medium ${selectedOptionIndex === idx
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white'
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
                <p className="text-yellow-700">{recipeOptions[selectedOptionIndex].description}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-yellow-600">
                  <span>
                    ⏱️{' '}
                    {recipeOptions[selectedOptionIndex].prep_time +
                      recipeOptions[selectedOptionIndex].cook_time}{' '}
                    min
                  </span>
                  <span>🍽️ {recipeOptions[selectedOptionIndex].servings} servings</span>
                  <span>🔥 {recipeOptions[selectedOptionIndex].nutrition.calories} kcal</span>
                  <span>💪 {recipeOptions[selectedOptionIndex].nutrition.protein}g protein</span>
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
                  <div className="mt-4">
                    <img
                      src={recipeOptions[selectedOptionIndex].image_url}
                      alt={recipeOptions[selectedOptionIndex].title}
                      className="w-full h-48 object-cover rounded-2xl border border-gray-200 shadow-md"
                    />
                  </div>
                )}

                {recipeOptions[selectedOptionIndex].chef_tips &&
                  recipeOptions[selectedOptionIndex].chef_tips.length > 0 && (
                    <div className="mt-4 p-3 bg-white bg-opacity-60 rounded-xl">
                      <h4 className="font-bold text-yellow-900 text-sm mb-2">👨‍🍳 Chef's Tips:</h4>
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

      {/* User Recipe Collection */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-yellow-500" />
          📖 Your Recipe Collection
        </h2>

        {userRecipes.length > 0 ? (
          <div className="space-y-4">
            {userRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-2xl border border-yellow-200 flex space-x-4"
              >
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="w-24 h-24 object-cover rounded-xl shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center">
                    <Utensils className="w-8 h-8 text-gray-400" />
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="font-bold text-yellow-900">{recipe.title}</h3>
                  <p className="text-yellow-700 text-sm">{recipe.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-yellow-600">
                    <span>⏱️ {recipe.prep_time + recipe.cook_time} min</span>
                    <span>🍽️ {recipe.servings} servings</span>
                    <span>🔥 {recipe.calories_per_serving} kcal</span>
                    {recipe.matches_dna && (
                      <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                        🧬 DNA Match
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => getRecipeDetails(recipe.id)}
                    className="bg-yellow-600 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-yellow-700"
                  >
                    View
                  </button>
                  <button
                    onClick={() => deleteRecipe(recipe.id)}
                    className="bg-red-600 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-red-700"
                  >
                    🗑️
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

  // 9. Recipe Details
  const renderRecipeDetails = () => {
    if (!selectedRecipe) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              setSelectedRecipe(null);
              setCurrentView('recipe-book');
            }}
            className="text-gray-800 text-2xl font-bold"
          >
            ←
          </button>
          <h1 className="text-lg font-bold text-gray-900">Recipe Details</h1>
          <div className="w-6"></div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          {selectedRecipe.image_url && (
            <div className="mb-4">
              <img
                src={selectedRecipe.image_url}
                alt={selectedRecipe.title}
                className="w-full h-64 object-cover rounded-2xl shadow-md"
              />
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedRecipe.title}</h2>
          <p className="text-gray-600 mb-4">{selectedRecipe.description}</p>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-orange-50 rounded-xl">
              <div className="text-lg font-bold text-orange-600">{selectedRecipe.prep_time}</div>
              <div className="text-xs text-gray-600">Prep (min)</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-xl">
              <div className="text-lg font-bold text-yellow-600">{selectedRecipe.cook_time}</div>
              <div className="text-xs text-gray-600">Cook (min)</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <div className="text-lg font-bold text-green-600">{selectedRecipe.servings}</div>
              <div className="text-xs text-gray-600">Servings</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-xl">
              <div className="text-lg font-bold text-red-600">{selectedRecipe.nutrition?.calories}</div>
              <div className="text-xs text-gray-600">Calories</div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-3">🥘 Ingredients</h3>
              <div className="space-y-2">
                {selectedRecipe.ingredients?.map((ingredient, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                    <span className="font-medium">{ingredient.amount}</span>
                    <span>{ingredient.item}</span>
                    {ingredient.notes && <span className="text-gray-500 text-sm">({ingredient.notes})</span>}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-3">👨‍🍳 Instructions</h3>
              <div className="space-y-3">
                {selectedRecipe.instructions?.map((instruction, index) => (
                  <div key={index} className="flex space-x-3 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg">
                    <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 flex-1">{instruction}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 mb-3">🏷️ Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRecipe.tags.map((tag, index) => (
                    <span
                      key={index}
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

  // ─────────────────────────────────────────────────────────────────────────────
  //  Auth / Register / Logout Logic
  // ─────────────────────────────────────────────────────────────────────────────

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await apiCall('/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      });
      setUser(result.user);
      setCurrentView('dashboard');

      setTimeout(async () => {
        try {
          await loadAdvancedUserStats();
          await loadDashboardStats();
          await loadMealSuggestions();
        } catch (err) {
          console.error('Error loading initial data:', err);
        }
      }, 300);

      showSuccess(`Welcome back, ${result.user.username}! 🚀`);
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
      const result = await apiCall('/register', {
        method: 'POST',
        body: JSON.stringify({
          ...registerData,
          age: parseInt(registerData.age, 10),
          current_weight: parseFloat(registerData.current_weight),
          target_weight: parseFloat(registerData.target_weight),
          height: parseFloat(registerData.height),
        }),
      });
      setUser(result.user);
      setCurrentView('dashboard');

      setTimeout(async () => {
        try {
          await loadAdvancedUserStats();
          await loadDashboardStats();
          await loadMealSuggestions();
        } catch (err) {
          console.error('Error loading initial data:', err);
        }
      }, 300);

      showSuccess(`🎉 Welcome, ${result.user.username}! Your journey starts now!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiCall('/logout', { method: 'POST' });
      setUser(null);
      setUserStats(null);
      setCurrentView('login');
      setFoodDNA(null);
      setPredictiveInsights(null);
      setMenstrualCycleData(null);
      setUserRecipes([]);
      setNutritionPlan(null);
      setMealHistory([]);
      setDashboardStats(null);
      setRecipeOptions([]);
      setSelectedOptionIndex(0);
      setGeneratedRecipe(null);
      setDailyMeals([]);
      setSelectedHistoryMeal(null);
      showSuccess('Logout successful! 👋');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const loadAdvancedUserStats = async () => {
    try {
      const stats = await apiCall('/user/stats-advanced');
      setUserStats(stats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const stats = await apiCall('/dashboard-stats');
      setDashboardStats(stats);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    }
  };


  const loadMenstrualCycleData = async () => {
    try {
      const cycleData = await apiCall('/menstrual-cycle');
      setMenstrualCycleData(cycleData);
    } catch (err) {
      console.error('Error loading cycle data:', err);
    }
  };

  const loadUserRecipes = async () => {
    try {
      const recipes = await apiCall('/recipes');
      setUserRecipes(recipes.recipes || []);
    } catch (err) {
      console.error('Error loading recipes:', err);
    }
  };

  const loadNutritionPlan = async () => {
    try {
      const plan = await apiCall('/nutrition-plan');
      setNutritionPlan(plan.nutrition_plan);
    } catch (err) {
      console.error('Error loading nutrition plan:', err);
    }
  };

  const loadMealSuggestions = async () => {
    try {
      const suggestions = await apiCall('/meal-suggestions');
      setMealSuggestions(suggestions.suggestions || []);
    } catch (err) {
      console.error('Error loading meal suggestions:', err);
    }
  };

  const loadMealHistory = async () => {
    try {
      const history = await apiCall('/meal-history');
      setMealHistory(history.history || []);
    } catch (err) {
      console.error('Error loading meal history:', err);
      // Fallback mock data
      setMealHistory([
        {
          id: 101,
          meal_type: 'lunch',
          created_at: new Date().toISOString(),
          total_calories: 450,
          protein: 35,
          carbs: 40,
          fat: 10,
          eating_personality_type: 'Health Optimizer',
          foods_detected: ['grilled chicken', 'boiled eggs', 'lettuce', 'tomatoes', 'corn', 'edamame', 'purple cabbage', 'cucumbers'],
          image_url: 'https://picsum.photos/600/400?random=101',
          health_score: 7,
        },
      ]);
    }
  };

  const loadDailyMeals = async () => {
    try {
      setDailyLogLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const meals = await apiCall(`/daily-meals?date=${dateStr}`);
      setDailyMeals(meals.meals || []);
    } catch (err) {
      console.error('Error loading daily meals:', err);
      // Fallback to mock data based on date
      const mockMeals = selectedDate.toDateString() === new Date().toDateString() ? [
        {
          id: 1,
          name: 'Oatmeal with Berries',
          calories: 320,
          protein: 12,
          carbs: 45,
          fat: 8,
          meal_type: 'breakfast',
          time: '08:30',
        },
        {
          id: 2,
          name: 'Grilled Chicken Salad',
          calories: 450,
          protein: 35,
          carbs: 20,
          fat: 18,
          meal_type: 'lunch',
          time: '13:00',
        },
      ] : [];
      setDailyMeals(mockMeals);
    } finally {
      setDailyLogLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  RECIPE GENERATION (JSON OR FORM-DATA with IMAGE)
  // ─────────────────────────────────────────────────────────────────────────────

  const generateRecipe = async () => {
    // Simple validation
    if (!recipeIngredients.trim() && !recipeImageFile) {
      setError('Please enter some ingredients or upload a photo');
      return;
    }
    setLoading(true);
    setError('');

    try {
      let result;
      if (recipeImageFile) {
        // If there's an image, build FormData
        const formData = new FormData();
        formData.append('image', recipeImageFile);

        // We still need to pass text ingredients + personalization as a single JSON blob
        const payload = {
          ingredients: recipeIngredients, // may be empty string
          ...recipePersonalization,
        };
        formData.append('payload', JSON.stringify(payload));

        // Make a multipart/form-data request
        const response = await fetch(`${API_BASE}/recipe-generation`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        const contentType = response.headers.get('content-type');
        if (!response.ok) {
          let errMsg = '';
          try {
            const errData = await response.json();
            errMsg = errData.error || `HTTP ${response.status}: ${response.statusText}`;
          } catch {
            errMsg = `HTTP ${response.status}: ${response.statusText}`;
          }
          throw new Error(errMsg);
        }
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response');
        }
        result = await response.json();
      } else {
        // No image: just send JSON normally
        result = await apiCall('/recipe-generation', {
          method: 'POST',
          body: JSON.stringify({
            ingredients: recipeIngredients,
            ...recipePersonalization,
          }),
        });
      }

      // Handle invalid items
      if (result.validation_result) {
        if (result.validation_result.invalid_items.length > 0) {
          setError(
            `Invalid items: ${result.validation_result.invalid_items.join(
              ', '
            )}. Suggestions: ${result.validation_result.suggestions.join(', ')}`
          );
        }
      }

      // If recipe_options is an array, attach a dummy image for each (or keep any returned URL)
      if (Array.isArray(result.recipe_options)) {
        setRecipeOptions(result.recipe_options.map((r) => ({ ...r })));
        setSelectedOptionIndex(0);
      } else {
        setRecipeOptions([]);
      }

      setGeneratedRecipe(result.recipe || null);
      setRecipeIngredients('');
      setRecipeImageFile(null);
      setRecipeImagePreview(null);
      await loadUserRecipes();
      showSuccess('🔥 New personalized recipe generated successfully!');
    } catch (err) {
      console.error('Recipe generation error:', err);
      if (err.message.includes('Nenhum ingrediente válido encontrado')) {
        setError('Please enter only valid ingredients (vegetables, fruits, proteins, grains, etc.)');
      } else {
        setError(`Recipe generation error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  BARCODE → "Fake" lookup + Add to daily log
  // ─────────────────────────────────────────────────────────────────────────────

  const scanBarcode = async () => {
    if (!barcodeInput.trim()) {
      setError('Please enter a barcode');
      return;
    }

    setLoading(true);
    try {
      // In a real app you'd call your product-lookup API; here we hardcode:
      const mockProduct = {
        name: 'Organic Whole Grain Bread',
        brand: "Nature's Best",
        calories_per_100g: 245,
        protein_per_100g: 9.5,
        carbs_per_100g: 43.2,
        fat_per_100g: 3.8,
        fiber_per_100g: 7.2,
        image_url: 'https://picsum.photos/200/200?random=bread',
      };

      setScannedProduct(mockProduct);
      setBarcodeInput('');
      showSuccess('Product found! 📦');
    } catch (err) {
      setError('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const scanBarcodeFromImage = async () => {
    barcodeImageRef.current?.click();
  };

  const handleBarcodeImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      // Simulate barcode scanning from image
      const mockProduct = {
        name: 'Scanned Product',
        brand: "Image Brand",
        calories_per_100g: 280,
        protein_per_100g: 12.0,
        carbs_per_100g: 35.0,
        fat_per_100g: 8.0,
        fiber_per_100g: 5.0,
        image_url: 'https://picsum.photos/200/200?random=scanned',
      };

      setScannedProduct(mockProduct);
      showSuccess('Product scanned from image! 📸');
    } catch (err) {
      setError('Failed to scan barcode from image');
    } finally {
      setLoading(false);
    }
  };

  const addMealFromProduct = () => {
    if (scannedProduct) {
      setCurrentMeal({
        name: scannedProduct.name,
        calories: scannedProduct.calories_per_100g.toString(),
        protein: scannedProduct.protein_per_100g.toString(),
        carbs: scannedProduct.carbs_per_100g.toString(),
        fat: scannedProduct.fat_per_100g.toString(),
        meal_type: 'snack',
        time: new Date().toTimeString().slice(0, 5),
      });
      setScannedProduct(null);
      setShowMealForm(true);
    }
  };

  const saveMeal = async () => {
    if (!currentMeal.name.trim()) {
      setError('Please enter a meal name');
      return;
    }

    const newMeal = {
      id: Date.now(),
      ...currentMeal,
      calories: parseInt(currentMeal.calories, 10) || 0,
      protein: parseFloat(currentMeal.protein) || 0,
      carbs: parseFloat(currentMeal.carbs) || 0,
      fat: parseFloat(currentMeal.fat) || 0,
      date: selectedDate.toISOString().split('T')[0], // Add the selected date
    };

    // Try to save to backend
    try {
      await apiCall('/daily-meals', {
        method: 'POST',
        body: JSON.stringify({
          ...newMeal,
          date: selectedDate.toISOString().split('T')[0],
        }),
      });

      // If successful, add to local state
      setDailyMeals((prev) => [...prev, newMeal]);
      showSuccess('Meal saved successfully! 🍽️');
    } catch (err) {
      console.error('Error saving meal:', err);
      // Even if backend fails, add to local state
      setDailyMeals((prev) => [...prev, newMeal]);
      showSuccess('Meal added locally! 🍽️');
    }

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

  const deleteMeal = (mealId) => {
    setDailyMeals((prev) => prev.filter((meal) => meal.id !== mealId));
    showSuccess('Meal removed! 🗑️');
  };

  const logCycleData = async (data) => {
    try {
      await apiCall('/menstrual-cycle/log', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await loadMenstrualCycleData();
      showSuccess('Cycle data logged successfully! 🌙');
    } catch (err) {
      console.error('Error logging cycle data:', err);
      setError('Failed to log cycle data');
    }
  };

  const getRecipeDetails = async (recipeId) => {
    try {
      const result = await apiCall(`/recipes/${recipeId}`);
      setSelectedRecipe(result.recipe);
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
      showSuccess('Recipe deleted successfully! 🗑️');
    } catch (err) {
      console.error('Error deleting recipe:', err);
      setError('Failed to delete recipe');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  SMART FOOD ANALYSIS (meal tracking)
  // ─────────────────────────────────────────────────────────────────────────────

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      setUploadedImage(reader.result);
      setIsAnalyzing(true);
      setCurrentView('food-analysis');

      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('meal_type', 'lunch');
        formData.append('mood_before', moodBefore);
        formData.append('social_context', socialContext);

        const response = await fetch(`/api/analyze-revolutionary`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) {
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

        if (result.dna_unlocked) {
          showSuccess('🧬 Food DNA Profile unlocked!');
          loadFoodDNA();
        }
      } catch (err) {
        setError(err.message);
        setAnalysisResult({
          foods_detected: ['Analysis error'],
          nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
          health_assessment: { score: 0, obesity_risk: 'Unknown' },
          ai_feedback: 'Error processing analysis. Please try again.',
          suggestions: ['Check connection and try again'],
        });
      } finally {
        setIsAnalyzing(false);
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
          setIsAnalyzing(true);
          setCurrentView('food-analysis');

          if (cameraStream) {
            cameraStream.getTracks().forEach((track) => track.stop());
            setCameraStream(null);
          }
          // Image processing same as handleImageUpload (chama API etc.).
          // For brevity, we won't repeat the code here.
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

  // Helper function to get day name
  const getDayName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // Helper function to format date
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  //  UI RENDER FUNCTIONS (by view)
  // ─────────────────────────────────────────────────────────────────────────────

  // 1. Login
  const renderLogin = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-yellow-500 to-orange-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          {renderLogo()}
          <p className="text-gray-600 mt-4 font-medium">Smart Nutrition Analysis & Insights</p>
          <div className="flex justify-center space-x-2 mt-3">
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">🧬 Food DNA</span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">🔮 Predictions</span>
          </div>
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
            onClick={login}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : '🚀 Login with Smart Tech'}
          </button>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => setCurrentView('register')}
            className="text-orange-600 font-medium hover:text-orange-700"
          >
            Don't have an account? Join the Movement
          </button>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
          <p className="text-xs text-center font-bold text-gray-700 mb-2">🎯 DEMO ACCESS</p>
          <p className="text-xs text-gray-600 text-center">
            <strong>Email:</strong> demo@nutrivision.com<br />
            <strong>Password:</strong> password123
          </p>
        </div>
      </div>
    </div>
  );

  // 2. Register
  const renderRegister = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-yellow-500 to-orange-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md max-h-screen overflow-y-auto">
        <div className="text-center mb-6">
          {renderLogo()}
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
              <label className="block text-gray-700 font-medium mb-1">Target Weight (kg)</label>
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

          {registerData.gender === 'female' && (
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={registerData.track_menstrual_cycle}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, track_menstrual_cycle: e.target.checked })
                  }
                  className="w-4 h-4 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Track Menstrual Cycle 🌙</span>
                  <p className="text-xs text-gray-600">
                    Get personalized nutrition recommendations based on your cycle
                  </p>
                </div>
              </label>
            </div>
          )}

          <button
            onClick={register}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : '🚀 Join the Movement'}
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

  // 3. Dashboard
  const renderDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-4 pb-20">
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          {renderLogo()}
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">Hi, {user?.username}! 🚀</div>
            <div className="text-sm text-gray-600">
              {user?.level} • {user?.total_xp || 0} XP
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 p-4 rounded-2xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">🧬 Smart Coach Active</p>
              <p className="text-orange-100 text-sm">Personal Coach • Smart Predictions</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {userStats?.advanced_stats?.personality_unlocked ? '🧬' : '⏳'}
              </div>
              <div className="text-xs text-orange-200">
                {userStats?.advanced_stats?.personality_unlocked ? 'DNA unlocked' : 'DNA pending'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Lightbulb className="w-6 h-6 mr-2 text-yellow-500" />
          🍽️ Today's Smart Suggestions
        </h2>

        <div className="grid grid-cols-1 gap-3">
          {mealSuggestions.length > 0 ? (
            mealSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`${suggestion.meal_type === 'breakfast'
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'
                  : 'bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200'
                  } p-4 rounded-2xl`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3
                      className={`font-bold ${suggestion.meal_type === 'breakfast' ? 'text-yellow-900' : 'text-orange-900'
                        }`}
                    >
                      {suggestion.meal_type === 'breakfast' ? '🌅' : '🌞'} {suggestion.title}
                    </h3>
                    <p
                      className={`text-sm ${suggestion.meal_type === 'breakfast' ? 'text-yellow-700' : 'text-orange-700'
                        }`}
                    >
                      {suggestion.description}
                    </p>
                    <p
                      className={`text-xs ${suggestion.meal_type === 'breakfast' ? 'text-yellow-600' : 'text-orange-600'
                        }`}
                    >
                      {suggestion.reason}
                    </p>
                    {suggestion.phase_note && (
                      <p className="text-xs text-purple-600 mt-1">🌙 {suggestion.phase_note}</p>
                    )}
                  </div>
                  <button
                    className={`${suggestion.meal_type === 'breakfast'
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                      } text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors`}
                    onClick={() => setCurrentView('recipe-book')}
                  >
                    View Recipe
                  </button>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-2xl border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-yellow-900">🌅 Breakfast Suggestion</h3>
                    <p className="text-sm text-yellow-700">Greek yogurt with fruits and granola</p>
                    <p className="text-xs text-yellow-600">Perfect for explorers</p>
                  </div>
                  <button
                    className="bg-yellow-600 text-white px-4 py-2 rounded-2xl text-sm font-bold hover:bg-yellow-700"
                    onClick={() => setCurrentView('recipe-book')}
                  >
                    View Recipe
                  </button>
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-2xl border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-orange-900">🌞 Lunch Suggestion</h3>
                    <p className="text-sm text-orange-700">Quinoa bowl with grilled chicken</p>
                    <p className="text-xs text-orange-600">High protein for your goals</p>
                  </div>
                  <button
                    className="bg-orange-600 text-white px-4 py-2 rounded-2xl text-sm font-bold hover:bg-orange-700"
                    onClick={() => setCurrentView('recipe-book')}
                  >
                    View Recipe
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {dashboardStats && (
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-orange-50 rounded-2xl border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-3">📊 This Week's Progress</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {dashboardStats.weekly_summary?.meals_logged || 0}
                </div>
                <div className="text-sm text-gray-600">Meals Logged</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {dashboardStats.weekly_summary?.avg_health_score || 0}
                </div>
                <div className="text-sm text-gray-600">Average Health Score</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 px-4">
        <div className="bg-gradient-to-br from-orange-500 to-yellow-600 p-4 rounded-2xl text-white shadow-lg">
          <Dna className="w-8 h-8 mb-2" />
          <div className="text-2xl font-bold">{user?.total_xp || 0}</div>
          <div className="text-orange-100 text-sm">Total XP</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-4 rounded-2xl text-white shadow-lg">
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

      {/* Smart Food Scanner Section */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100 mx-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Camera className="w-6 h-6 mr-2 text-orange-500" />
          Smart Food Analysis
        </h2>
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
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 via-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Analysis</h3>
          <p className="text-gray-600 mb-6">Get instant insights about your meals with advanced AI technology!</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCameraCapture}
              className="bg-gradient-to-r from-gray-800 to-gray-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg hover:shadow-gray-500/30 transform hover:scale-105 transition-all"
            >
              📸 Open Camera
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg hover:shadow-orange-500/30 transform hover:scale-105 transition-all"
            >
              🖼️ Choose Photo
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

  // 4. Camera Capture
  const renderCameraCapture = () => (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black/50 text-white">
        <button onClick={stopCamera} className="text-white text-2xl font-bold">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">📸 Capture your Meal</h1>
        <div className="w-6"></div>
      </div>
      <div className="flex-1 relative">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-80 h-80 border-4 border-white border-dashed rounded-2xl opacity-70"></div>
        </div>
        <div className="absolute top-4 left-4 right-4 bg-black/70 rounded-2xl p-4 text-white text-center">
          <p className="font-bold">Position your meal in the frame</p>
          <p className="text-sm opacity-80">Make sure the food is well lit</p>
        </div>
      </div>

      <div className="p-8 bg-black/50">
        <div className="flex items-center justify-center space-x-6">
          {/* Cancel Button */}
          <button
            onClick={stopCamera}
            className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <X className="w-8 h-8 text-white" />
          </button>

          {/* Capture Button */}
          <button
            onClick={capturePhoto}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </button>

          {/* Switch Camera Button (placeholder) */}
          <button
            onClick={() => {
              // Toggle between front/back camera if available
              showSuccess('Camera switch feature coming soon! 📸');
            }}
            className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <div className="w-6 h-6 border-2 border-white rounded-full relative">
              <div className="absolute inset-1 bg-white rounded-full"></div>
            </div>
          </button>
        </div>

        {/* Instructions */}
        <div className="text-center mt-6">
          <p className="text-white text-sm font-medium">Tap the center button to capture</p>
          <p className="text-gray-300 text-xs mt-1">Make sure your meal is well-lit and centered</p>
        </div>
      </div>
    </div>
  );

  // Main Render
  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentView()}
      {user && !['login', 'register', 'camera-capture'].includes(currentView) && renderNavigation()}

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
              ✕
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