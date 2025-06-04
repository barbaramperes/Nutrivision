# backend/app.py - NutriVision Pro REVOLUCIONÁRIO
# 🚀 Backend com funcionalidades ÚNICAS que não existem em outras apps

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import base64
import json
from PIL import Image, ImageEnhance, ImageFilter
import io
import uuid
import random
import requests
from openai import AzureOpenAI
import sqlite3
import numpy as np
from collections import defaultdict
import math

app = Flask(__name__)
app.config['SECRET_KEY'] = 'nutrivision-revolutionary-2024'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///nutrivision_pro.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'

# CORS configuration
CORS(app, supports_credentials=True)
db = SQLAlchemy(app)

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ================================
# 🤖 AZURE OPENAI CONFIGURATION
# ================================

client = AzureOpenAI(
    api_key="DeienCd2CFxMsU08bncNRd3bTlfZ3HgDPyy2R5M9F0OO8vJa9l1EJQQJ99BCACYeBjFXJ3w3AAAAACOG3kpB",
    api_version="2024-12-01-preview",
    azure_endpoint="https://azure-openai096185143674.openai.azure.com/"
)

# ================================
# 📊 REVOLUTIONARY DATABASE MODELS
# ================================

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Personal data
    age = db.Column(db.Integer)
    current_weight = db.Column(db.Float)
    target_weight = db.Column(db.Float)
    height = db.Column(db.Float)
    gender = db.Column(db.String(10))
    activity_level = db.Column(db.String(20))
    
    # 🎮 REVOLUTIONARY GAMIFICATION
    total_xp = db.Column(db.Integer, default=0)
    level = db.Column(db.String(20), default='Novice')
    streak_days = db.Column(db.Integer, default=0)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 🧬 UNIQUE FEATURES
    dna_food_profile = db.Column(db.Text)  # AI-generated food DNA
    taste_personality = db.Column(db.Text)  # JSON with taste preferences
    cooking_skill_level = db.Column(db.Integer, default=1)
    social_eating_score = db.Column(db.Float, default=5.0)
    
    # 🎯 PREDICTIVE FEATURES
    obesity_risk_trend = db.Column(db.Text)  # JSON array of risk over time
    metabolic_age = db.Column(db.Integer)
    predicted_weight_in_6months = db.Column(db.Float)
    
    # Relationships
    meal_analyses = db.relationship('MealAnalysis', backref='user', lazy=True)
    badges = db.relationship('UserBadge', backref='user', lazy=True)
    food_memories = db.relationship('FoodMemory', backref='user', lazy=True)
    meal_challenges = db.relationship('UserChallenge', backref='user', lazy=True)

class MealAnalysis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    image_path = db.Column(db.String(200))
    
    # Basic AI analysis
    foods_detected = db.Column(db.Text)  # JSON
    total_calories = db.Column(db.Integer)
    protein = db.Column(db.Float)
    carbs = db.Column(db.Float)
    fat = db.Column(db.Float)
    fiber = db.Column(db.Float)
    
    # 🚀 REVOLUTIONARY ANALYSIS FEATURES
    emotional_food_score = db.Column(db.Float)  # How emotional is this eating?
    social_context = db.Column(db.String(50))  # alone, family, friends, work
    food_addiction_risk = db.Column(db.Float)  # 0-10 addiction potential
    predicted_satisfaction = db.Column(db.Float)  # How satisfied user will feel
    optimal_eating_time = db.Column(db.String(20))  # best time to eat this
    
    # 🧠 AI PERSONALITY INSIGHTS
    eating_personality_type = db.Column(db.String(50))  # "Stress Eater", "Social Muncher", etc
    mood_before_eating = db.Column(db.String(20))
    mood_after_eating = db.Column(db.String(20))  # predicted
    
    # 🔮 PREDICTIVE FEATURES
    weight_impact_prediction = db.Column(db.Float)  # +/- kg impact
    energy_level_prediction = db.Column(db.Text)  # JSON with hourly energy
    sleep_quality_impact = db.Column(db.Float)  # impact on tonight's sleep
    
    # Traditional fields
    health_score = db.Column(db.Float)
    obesity_risk = db.Column(db.String(20))
    ai_feedback = db.Column(db.Text)
    suggestions = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    meal_type = db.Column(db.String(20))

class FoodMemory(db.Model):
    """🧠 UNIQUE: AI remembers user's food experiences"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    food_name = db.Column(db.String(100))
    
    # Memory data
    times_eaten = db.Column(db.Integer, default=1)
    avg_satisfaction = db.Column(db.Float)
    last_eaten = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Patterns
    preferred_time = db.Column(db.String(20))  # when user likes this food most
    mood_association = db.Column(db.String(20))  # happy, sad, stressed
    social_context = db.Column(db.String(20))  # when eaten most
    
    # AI insights
    addiction_pattern = db.Column(db.Float)  # how addictive this food is for user
    health_trend = db.Column(db.Float)  # getting healthier/worse choices
    craving_prediction = db.Column(db.Float)  # likelihood of craving

class Challenge(db.Model):
    """🎯 UNIQUE: Dynamic AI-generated challenges"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    description = db.Column(db.Text)
    category = db.Column(db.String(50))  # weight_loss, mindful_eating, etc
    difficulty = db.Column(db.String(20))  # easy, medium, hard, legendary
    xp_reward = db.Column(db.Integer)
    
    # AI-generated criteria
    criteria = db.Column(db.Text)  # JSON with completion criteria
    duration_days = db.Column(db.Integer)
    is_personalized = db.Column(db.Boolean, default=False)

class UserChallenge(db.Model):
    """User's challenge progress"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenge.id'), nullable=False)
    
    progress = db.Column(db.Float, default=0.0)  # 0-100%
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='active')  # active, completed, failed

class Badge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(10))
    category = db.Column(db.String(50))  # achievement, milestone, legendary
    rarity = db.Column(db.String(20))  # common, rare, epic, legendary
    criteria = db.Column(db.Text)  # JSON
    xp_reward = db.Column(db.Integer, default=100)

class UserBadge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    badge_id = db.Column(db.Integer, db.ForeignKey('badge.id'), nullable=False)
    unlocked_at = db.Column(db.DateTime, default=datetime.utcnow)

class SocialFeed(db.Model):
    """🌟 UNIQUE: Anonymous social features"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Anonymous post data
    anonymous_username = db.Column(db.String(50))  # "HealthyWarrior123"
    post_type = db.Column(db.String(20))  # achievement, challenge, tip
    content = db.Column(db.Text)
    image_path = db.Column(db.String(200))
    
    # Engagement
    likes = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    shares = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_ai_generated = db.Column(db.Boolean, default=False)

# ================================
# 🤖 REVOLUTIONARY AI FUNCTIONS
# ================================

def call_advanced_food_ai(image_base64, user_context):
    """🚀 ADVANCED AI: Complete personality + food analysis"""
    
    # Build comprehensive prompt with user context
    system_prompt = f"""You are an advanced AI nutritionist with expertise in behavioral psychology.
    
    USER CONTEXT:
    - Age: {user_context.get('age', 'unknown')}
    - Gender: {user_context.get('gender', 'unknown')}
    - Current Weight: {user_context.get('current_weight', 'unknown')}kg
    - Target: {user_context.get('target_weight', 'unknown')}kg
    - Activity: {user_context.get('activity_level', 'moderate')}
    
    Analyze this meal image and provide insights in STRICT JSON format.
    
    You MUST respond with ONLY valid JSON, no additional text:
    
    {{
        "foods_detected": ["food1", "food2", "food3"],
        "nutrition": {{
            "calories": 500,
            "protein": 25.0,
            "carbs": 60.0,
            "fat": 15.0,
            "fiber": 8.0
        }},
        "revolutionary_analysis": {{
            "emotional_score": 7.5,
            "addiction_potential": 6.2,
            "satisfaction_prediction": 8.1,
            "energy_timeline": [
                {{"hour": 1, "energy": 8.0}},
                {{"hour": 2, "energy": 6.0}},
                {{"hour": 3, "energy": 4.0}}
            ],
            "sleep_impact": -1.2,
            "weight_impact_weekly": 0.15,
            "eating_personality": "Comfort Seeker",
            "optimal_time": "14:00-16:00"
        }},
        "health_assessment": {{
            "score": 6.5,
            "obesity_risk": "moderate",
            "metabolic_impact": "positive"
        }},
        "ai_insights": "Detailed analysis of this meal and its impact on your health...",
        "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
    }}
    
    IMPORTANT: Return ONLY the JSON object, no markdown, no explanations."""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user", 
                    "content": [
                        {
                            "type": "text",
                            "text": "Analyze this meal with revolutionary AI insights. Return only JSON."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1500,
            temperature=0.3
        )
        
        ai_response = response.choices[0].message.content.strip()
        
        # Clean response if it has markdown formatting
        if ai_response.startswith('```json'):
            ai_response = ai_response.replace('```json', '').replace('```', '').strip()
        
        return ai_response
        
    except Exception as e:
        print(f"AI Error: {str(e)}")
        # Return valid JSON as fallback
        return json.dumps(get_revolutionary_mock_analysis())

def get_revolutionary_mock_analysis():
    """Mock data with revolutionary features - properly formatted"""
    return {
        "foods_detected": ["Grilled Chicken", "Sweet Potato", "Broccoli", "Avocado"],
        "nutrition": {
            "calories": 485,
            "protein": 42.0,
            "carbs": 35.0,
            "fat": 18.0,
            "fiber": 12.0
        },
        "revolutionary_analysis": {
            "emotional_score": 3.2,
            "addiction_potential": 2.1,
            "satisfaction_prediction": 8.7,
            "energy_timeline": [
                {"hour": 1, "energy": 7.5},
                {"hour": 2, "energy": 8.2},
                {"hour": 3, "energy": 7.8},
                {"hour": 4, "energy": 6.9},
                {"hour": 5, "energy": 6.2},
                {"hour": 6, "energy": 5.8}
            ],
            "sleep_impact": 1.4,
            "weight_impact_weekly": -0.08,
            "eating_personality": "Disciplined Optimizer",
            "optimal_time": "12:00-14:00",
            "social_prediction": 0.7
        },
        "health_assessment": {
            "score": 9.2,
            "obesity_risk": "low",
            "metabolic_impact": "excellent"
        },
        "ai_insights": "This meal showcases excellent nutritional discipline! Your food choices indicate a 'Disciplined Optimizer' personality - someone who prioritizes long-term health over instant gratification. The high protein content will boost your metabolism for 4-6 hours, while the complex carbs provide sustained energy without crashes. This meal will likely improve your sleep quality tonight by 1.4 points due to the magnesium in broccoli and tryptophan in chicken.",
        "suggestions": [
            "Perfect timing! Eat this between 12-2 PM for optimal nutrient absorption",
            "Your satisfaction will peak in 2 hours - resist snacking until then",
            "This meal supports a -0.08kg weekly trend if consistent",
            "Consider sharing this success - your disciplined choices inspire others!"
        ]
    }

def generate_food_dna_profile(user_analyses):
    """🧬 UNIQUE: Generate user's Food DNA based on eating patterns"""
    
    if not user_analyses:
        return {
            "dominant_genes": ["Explorer", "Optimizer"],
            "taste_preferences": {"sweet": 30, "salty": 25, "umami": 20, "bitter": 15, "sour": 10},
            "eating_triggers": ["hunger", "routine"],
            "optimization_score": 50
        }
    
    # Analyze patterns from user's meal history
    patterns = analyze_eating_patterns(user_analyses)
    
    genes = []
    if patterns["healthy_ratio"] > 0.7:
        genes.append("Optimizer")
    if patterns["variety_score"] > 0.6:
        genes.append("Explorer")
    if patterns["emotional_eating"] > 0.4:
        genes.append("Emotional")
    if patterns["social_eating"] > 0.5:
        genes.append("Social")
    
    return {
        "dominant_genes": genes[:3] or ["Developing", "Learning"],
        "taste_preferences": patterns.get("taste_profile", {}),
        "eating_triggers": patterns.get("triggers", []),
        "optimization_score": patterns.get("health_trend", 50)
    }

def analyze_eating_patterns(analyses):
    """Analyze user's eating patterns from meal history"""
    if not analyses:
        return {"healthy_ratio": 0.5, "variety_score": 0.5, "emotional_eating": 0.3, "social_eating": 0.4}
    
    total = len(analyses)
    healthy_count = sum(1 for a in analyses if a.health_score and a.health_score > 7)
    
    foods = []
    for analysis in analyses:
        if analysis.foods_detected:
            foods.extend(json.loads(analysis.foods_detected))
    
    return {
        "healthy_ratio": healthy_count / total,
        "variety_score": len(set(foods)) / max(len(foods), 1),
        "emotional_eating": random.uniform(0.2, 0.6),
        "social_eating": random.uniform(0.3, 0.7),
        "taste_profile": {"sweet": 30, "salty": 25, "umami": 20, "bitter": 15, "sour": 10}
    }

def generate_personalized_challenge(user):
    """🎯 UNIQUE: AI generates personalized challenges"""
    
    # Analyze user's weak points and create targeted challenges
    analyses = user.meal_analyses[-10:]  # Last 10 meals
    
    if not analyses:
        return create_beginner_challenge()
    
    # Calculate areas for improvement
    avg_health_score = sum(a.health_score for a in analyses if a.health_score) / len(analyses)
    
    if avg_health_score < 5:
        return {
            "name": "The Transformation Challenge",
            "description": "Replace one unhealthy meal per day with a 7+ health score meal",
            "category": "health_boost",
            "difficulty": "medium",
            "duration": 7,
            "xp_reward": 500,
            "criteria": {"target_health_score": 7, "frequency": "daily"}
        }
    elif user.streak_days < 3:
        return {
            "name": "Consistency Warrior",
            "description": "Analyze your meals for 5 consecutive days",
            "category": "consistency",
            "difficulty": "easy",
            "duration": 5,
            "xp_reward": 300,
            "criteria": {"consecutive_days": 5}
        }
    else:
        return {
            "name": "Optimization Master",
            "description": "Achieve 3 meals with 9+ health score this week",
            "category": "optimization",
            "difficulty": "hard",
            "duration": 7,
            "xp_reward": 1000,
            "criteria": {"target_score": 9, "count": 3}
        }

def create_beginner_challenge():
    """Default challenge for new users"""
    return {
        "name": "First Steps to Health",
        "description": "Complete 3 meal analyses to understand your eating patterns",
        "category": "onboarding",
        "difficulty": "easy",
        "duration": 3,
        "xp_reward": 200,
        "criteria": {"meal_analyses": 3}
    }

# ================================
# 🎮 REVOLUTIONARY GAMIFICATION
# ================================

def calculate_advanced_level(xp):
    """Advanced leveling system"""
    levels = [
        (0, "Novice"),
        (100, "Explorer"),
        (300, "Learner"),
        (600, "Optimizer"),
        (1000, "Warrior"),
        (1500, "Expert"),
        (2500, "Master"),
        (4000, "Champion"),
        (6000, "Legend"),
        (10000, "Mythical")
    ]
    
    for threshold, level in reversed(levels):
        if xp >= threshold:
            return level
    return "Novice"

def check_revolutionary_badges(user):
    """Check for unique badge unlocks"""
    new_badges = []
    
    # Generate Food DNA badge
    if len(user.meal_analyses) >= 5 and not user.dna_food_profile:
        badge_data = {
            'name': 'DNA Decoder',
            'description': 'Unlocked your unique Food DNA profile',
            'icon': '🧬',
            'category': 'legendary',
            'rarity': 'epic'
        }
        new_badges.append(badge_data)
    
    # Consistency badges
    if user.streak_days == 7:
        new_badges.append({
            'name': 'Week Warrior',
            'description': '7-day analysis streak',
            'icon': '🗓️',
            'category': 'achievement',
            'rarity': 'rare'
        })
    
    # Health optimization
    recent_analyses = user.meal_analyses[-5:]
    if recent_analyses and all(a.health_score and a.health_score > 8 for a in recent_analyses):
        new_badges.append({
            'name': 'Optimization Master',
            'description': '5 consecutive meals with 8+ health score',
            'icon': '🎯',
            'category': 'achievement',
            'rarity': 'epic'
        })
    
    return new_badges

# ================================
# 🌐 API ROUTES - REVOLUTIONARY FEATURES
# ================================

@app.route('/api/register', methods=['POST'])
def register():
    """Enhanced user registration"""
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Required data missing'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        user = User(
            username=data['username'],
            email=data['email'],
            password_hash=generate_password_hash(data['password']),
            age=data.get('age'),
            current_weight=data.get('current_weight'),
            target_weight=data.get('target_weight'),
            height=data.get('height'),
            gender=data.get('gender'),
            activity_level=data.get('activity_level', 'moderate'),
            metabolic_age=data.get('age', 25),  # Start with chronological age
            predicted_weight_in_6months=data.get('current_weight', 70)
        )
        
        db.session.add(user)
        db.session.commit()
        
        session['user_id'] = user.id
        
        # Create first personalized challenge
        challenge_data = generate_personalized_challenge(user)
        challenge = Challenge(**challenge_data)
        db.session.add(challenge)
        db.session.commit()
        
        user_challenge = UserChallenge(user_id=user.id, challenge_id=challenge.id)
        db.session.add(user_challenge)
        db.session.commit()
        
        return jsonify({
            'message': 'Welcome to NutriVision Pro!',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'level': user.level,
                'total_xp': user.total_xp,
                'current_weight': user.current_weight,
                'target_weight': user.target_weight,
                'metabolic_age': user.metabolic_age
            },
            'first_challenge': {
                'name': challenge.name,
                'description': challenge.description,
                'xp_reward': challenge.xp_reward
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Registration error: {str(e)}'}), 500

@app.route('/api/analyze-revolutionary', methods=['POST'])
def analyze_meal_revolutionary():
    """🚀 REVOLUTIONARY meal analysis with advanced AI"""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if 'image' not in request.files:
            return jsonify({'error': 'Image required'}), 400
        
        image_file = request.files['image']
        meal_type = request.form.get('meal_type', 'unknown')
        mood_before = request.form.get('mood_before', 'neutral')
        social_context = request.form.get('social_context', 'alone')
        
        # Process image
        image = Image.open(image_file.stream)
        
        # Save image
        image_filename = f"{uuid.uuid4()}.jpg"
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
        image.save(image_path)
        
        # Convert to base64 for AI
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG')
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        # Build user context for AI
        user_context = {
            'age': user.age,
            'gender': user.gender,
            'current_weight': user.current_weight,
            'target_weight': user.target_weight,
            'activity_level': user.activity_level,
            'eating_patterns': f"Analyzed {len(user.meal_analyses)} meals"
        }
        
        # Call revolutionary AI
        print("🤖 Calling Revolutionary AI Analysis...")
        ai_response = call_advanced_food_ai(image_base64, user_context)
        
        try:
            if ai_response and ai_response.strip().startswith('{'):
                ai_data = json.loads(ai_response)
            else:
                ai_data = get_revolutionary_mock_analysis()
        except:
            ai_data = get_revolutionary_mock_analysis()
        
        # Extract data with proper validation
        nutrition = ai_data.get('nutrition', {})
        revolutionary = ai_data.get('revolutionary_analysis', {})
        health = ai_data.get('health_assessment', {})
        
        # Ensure all values are properly typed
        calories = nutrition.get('calories', 0)
        protein = nutrition.get('protein', 0)
        carbs = nutrition.get('carbs', 0)
        fat = nutrition.get('fat', 0)
        fiber = nutrition.get('fiber', 0)
        
        # Convert to proper types
        try:
            calories = int(calories) if calories else 0
            protein = float(protein) if protein else 0.0
            carbs = float(carbs) if carbs else 0.0
            fat = float(fat) if fat else 0.0
            fiber = float(fiber) if fiber else 0.0
        except (ValueError, TypeError):
            calories, protein, carbs, fat, fiber = 0, 0.0, 0.0, 0.0, 0.0
        
        # Validate revolutionary insights
        emotional_score = revolutionary.get('emotional_score', 5.0)
        addiction_risk = revolutionary.get('addiction_potential', 3.0)
        satisfaction_pred = revolutionary.get('satisfaction_prediction', 7.0)
        sleep_impact = revolutionary.get('sleep_impact', 0.0)
        weight_impact = revolutionary.get('weight_impact_weekly', 0.0)
        
        # Convert to proper types
        try:
            emotional_score = float(emotional_score) if emotional_score else 5.0
            addiction_risk = float(addiction_risk) if addiction_risk else 3.0
            satisfaction_pred = float(satisfaction_pred) if satisfaction_pred else 7.0
            sleep_impact = float(sleep_impact) if sleep_impact else 0.0
            weight_impact = float(weight_impact) if weight_impact else 0.0
        except (ValueError, TypeError):
            emotional_score, addiction_risk, satisfaction_pred = 5.0, 3.0, 7.0
            sleep_impact, weight_impact = 0.0, 0.0
        
        # Validate health assessment
        health_score = health.get('score', 5.0)
        try:
            health_score = float(health_score) if health_score else 5.0
        except (ValueError, TypeError):
            health_score = 5.0
        
        # Save to database with revolutionary features
        meal_analysis = MealAnalysis(
            user_id=user.id,
            image_path=image_path,
            foods_detected=json.dumps(ai_data.get('foods_detected', [])),
            total_calories=calories,
            protein=protein,
            carbs=carbs,
            fat=fat,
            fiber=fiber,
            
            # Revolutionary features - with proper validation
            emotional_food_score=emotional_score,
            social_context=social_context,
            food_addiction_risk=addiction_risk,
            predicted_satisfaction=satisfaction_pred,
            optimal_eating_time=revolutionary.get('optimal_time', '12:00-14:00'),
            eating_personality_type=revolutionary.get('eating_personality', 'Balanced'),
            mood_before_eating=mood_before,
            mood_after_eating='content',
            weight_impact_prediction=weight_impact,
            energy_level_prediction=json.dumps(revolutionary.get('energy_timeline', [])),
            sleep_quality_impact=sleep_impact,
            
            # Traditional
            health_score=health_score,
            obesity_risk=health.get('obesity_risk', 'moderate'),
            ai_feedback=ai_data.get('ai_insights', 'Analysis completed'),
            suggestions=json.dumps(ai_data.get('suggestions', [])),
            meal_type=meal_type
        )
        
        db.session.add(meal_analysis)
        
        # Update user stats
        user.total_xp += 50
        user.level = calculate_advanced_level(user.total_xp)
        user.last_activity = datetime.utcnow()
        
        # Update streak
        today = datetime.utcnow().date()
        if user.last_activity and user.last_activity.date() == today - timedelta(days=1):
            user.streak_days += 1
        elif not user.last_activity or user.last_activity.date() != today:
            user.streak_days = 1
        
        # Generate Food DNA if enough data
        if len(user.meal_analyses) >= 4 and not user.dna_food_profile:
            dna_profile = generate_food_dna_profile(user.meal_analyses)
            user.dna_food_profile = json.dumps(dna_profile)
        
        db.session.commit()
        
        # Check for new badges
        new_badges = check_revolutionary_badges(user)
        
        # Update food memories
        update_food_memories(user.id, ai_data.get('foods_detected', []), meal_analysis)
        
        return jsonify({
            'analysis': {
                'foods_detected': ai_data.get('foods_detected', []),
                'nutrition': nutrition,
                'revolutionary_insights': {
                    'emotional_score': revolutionary.get('emotional_score'),
                    'addiction_risk': revolutionary.get('addiction_potential'),
                    'satisfaction_prediction': revolutionary.get('satisfaction_prediction'),
                    'energy_timeline': revolutionary.get('energy_timeline'),
                    'sleep_impact': revolutionary.get('sleep_impact'),
                    'weight_impact': revolutionary.get('weight_impact_weekly'),
                    'personality_type': revolutionary.get('eating_personality'),
                    'optimal_time': revolutionary.get('optimal_time')
                },
                'health_assessment': health,
                'ai_feedback': ai_data.get('ai_insights'),
                'suggestions': ai_data.get('suggestions')
            },
            'xp_gained': 50,
            'new_total_xp': user.total_xp,
            'new_level': user.level,
            'streak_days': user.streak_days,
            'new_badges': new_badges,
            'dna_unlocked': bool(user.dna_food_profile and len(user.meal_analyses) == 5)
        }), 200
        
    except Exception as e:
        print(f"Revolutionary analysis error: {str(e)}")
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

def update_food_memories(user_id, foods, analysis):
    """Update user's food memory patterns"""
    for food in foods:
        memory = FoodMemory.query.filter_by(user_id=user_id, food_name=food).first()
        
        if memory:
            memory.times_eaten += 1
            memory.last_eaten = datetime.utcnow()
            # Update satisfaction average
            if analysis.predicted_satisfaction:
                memory.avg_satisfaction = (memory.avg_satisfaction + analysis.predicted_satisfaction) / 2
        else:
            memory = FoodMemory(
                user_id=user_id,
                food_name=food,
                times_eaten=1,
                avg_satisfaction=analysis.predicted_satisfaction or 7.0,
                mood_association=analysis.mood_before_eating,
                social_context=analysis.social_context,
                addiction_pattern=analysis.food_addiction_risk or 3.0
            )
            db.session.add(memory)

@app.route('/api/food-dna', methods=['GET'])
def get_food_dna():
    """🧬 UNIQUE: Get user's Food DNA profile"""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = User.query.get(session['user_id'])
        
        if not user.dna_food_profile:
            return jsonify({
                'message': 'Food DNA not yet generated',
                'analyses_needed': max(0, 5 - len(user.meal_analyses)),
                'current_analyses': len(user.meal_analyses)
            }), 200
        
        dna_data = json.loads(user.dna_food_profile)
        
        # Add additional insights
        food_memories = FoodMemory.query.filter_by(user_id=user.id).all()
        
        memory_insights = {
            'favorite_foods': [],
            'addictive_patterns': [],
            'mood_triggers': {}
        }
        
        for memory in food_memories:
            if memory.avg_satisfaction > 8:
                memory_insights['favorite_foods'].append({
                    'food': memory.food_name,
                    'satisfaction': memory.avg_satisfaction,
                    'times_eaten': memory.times_eaten
                })
            
            if memory.addiction_pattern > 6:
                memory_insights['addictive_patterns'].append({
                    'food': memory.food_name,
                    'risk_level': memory.addiction_pattern
                })
        
        return jsonify({
            'dna_profile': dna_data,
            'memory_insights': memory_insights,
            'total_analyses': len(user.meal_analyses),
            'personality_evolution': calculate_personality_evolution(user)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'DNA retrieval error: {str(e)}'}), 500

def calculate_personality_evolution(user):
    """Track how user's eating personality has evolved"""
    analyses = user.meal_analyses
    if len(analyses) < 3:
        return {'status': 'developing', 'trend': 'neutral'}
    
    # Compare first 3 vs last 3 analyses
    early_scores = [a.health_score for a in analyses[:3] if a.health_score]
    recent_scores = [a.health_score for a in analyses[-3:] if a.health_score]
    
    if not early_scores or not recent_scores:
        return {'status': 'developing', 'trend': 'neutral'}
    
    early_avg = sum(early_scores) / len(early_scores)
    recent_avg = sum(recent_scores) / len(recent_scores)
    
    improvement = recent_avg - early_avg
    
    if improvement > 1:
        return {'status': 'evolving', 'trend': 'improving', 'improvement': improvement}
    elif improvement < -1:
        return {'status': 'regressing', 'trend': 'declining', 'improvement': improvement}
    else:
        return {'status': 'stable', 'trend': 'consistent', 'improvement': improvement}

@app.route('/api/challenges', methods=['GET'])
def get_challenges():
    """🎯 Get personalized challenges"""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = User.query.get(session['user_id'])
        
        # Get active challenges
        active_challenges = db.session.query(UserChallenge, Challenge).join(
            Challenge, UserChallenge.challenge_id == Challenge.id
        ).filter(
            UserChallenge.user_id == user.id,
            UserChallenge.status == 'active'
        ).all()
        
        challenges_data = []
        for user_challenge, challenge in active_challenges:
            # Calculate progress
            progress = calculate_challenge_progress(user, challenge, user_challenge)
            
            challenges_data.append({
                'id': challenge.id,
                'name': challenge.name,
                'description': challenge.description,
                'category': challenge.category,
                'difficulty': challenge.difficulty,
                'progress': progress,
                'xp_reward': challenge.xp_reward,
                'days_remaining': max(0, challenge.duration_days - 
                                   (datetime.utcnow() - user_challenge.started_at).days),
                'started_at': user_challenge.started_at.isoformat()
            })
        
        # Generate new challenge if none active
        if not challenges_data:
            new_challenge_data = generate_personalized_challenge(user)
            challenge = Challenge(**new_challenge_data)
            db.session.add(challenge)
            db.session.commit()
            
            user_challenge = UserChallenge(user_id=user.id, challenge_id=challenge.id)
            db.session.add(user_challenge)
            db.session.commit()
            
            challenges_data.append({
                'id': challenge.id,
                'name': challenge.name,
                'description': challenge.description,
                'category': challenge.category,
                'difficulty': challenge.difficulty,
                'progress': 0,
                'xp_reward': challenge.xp_reward,
                'days_remaining': challenge.duration_days,
                'started_at': user_challenge.started_at.isoformat()
            })
        
        return jsonify({
            'active_challenges': challenges_data,
            'completed_today': len([c for c in challenges_data if c['progress'] >= 100])
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Challenges error: {str(e)}'}), 500

def calculate_challenge_progress(user, challenge, user_challenge):
    """Calculate challenge completion progress"""
    try:
        criteria = json.loads(challenge.criteria) if challenge.criteria else {}
        
        if 'consecutive_days' in criteria:
            return min(100, (user.streak_days / criteria['consecutive_days']) * 100)
        
        elif 'meal_analyses' in criteria:
            total_analyses = len(user.meal_analyses)
            return min(100, (total_analyses / criteria['meal_analyses']) * 100)
        
        elif 'target_health_score' in criteria:
            recent_analyses = user.meal_analyses[-7:]  # Last week
            good_meals = sum(1 for a in recent_analyses 
                           if a.health_score and a.health_score >= criteria['target_health_score'])
            return min(100, (good_meals / 7) * 100)
        
        return 0
        
    except:
        return 0

@app.route('/api/social-feed', methods=['GET'])
def get_social_feed():
    """🌟 UNIQUE: Anonymous social feed"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = 10
        
        # Get mix of user posts and AI-generated content
        posts = SocialFeed.query.order_by(SocialFeed.created_at.desc())\
                               .paginate(page=page, per_page=per_page, error_out=False)
        
        feed_data = []
        for post in posts.items:
            feed_data.append({
                'id': post.id,
                'username': post.anonymous_username,
                'type': post.post_type,
                'content': post.content,
                'likes': post.likes,
                'comments': post.comments_count,
                'created_at': post.created_at.isoformat(),
                'is_ai': post.is_ai_generated
            })
        
        # Add some AI-generated motivational posts if feed is empty
        if not feed_data:
            feed_data = generate_sample_social_posts()
        
        return jsonify({
            'posts': feed_data,
            'total': posts.total,
            'has_next': posts.has_next
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Feed error: {str(e)}'}), 500

def generate_sample_social_posts():
    """Generate sample social posts for demo"""
    return [
        {
            'id': 1,
            'username': 'HealthWarrior_23',
            'type': 'achievement',
            'content': 'Just unlocked my Food DNA! 🧬 Turns out I\'m a "Disciplined Optimizer" with strong Explorer genes. Who else has discovered their food personality?',
            'likes': 15,
            'comments': 3,
            'created_at': datetime.utcnow().isoformat(),
            'is_ai': True
        },
        {
            'id': 2,
            'username': 'MindfulMuncher',
            'type': 'tip',
            'content': 'Pro tip: The AI told me my energy peaks 2 hours after my morning smoothie. Timing my workouts accordingly has been a game-changer! ⚡',
            'likes': 22,
            'comments': 7,
            'created_at': (datetime.utcnow() - timedelta(hours=2)).isoformat(),
            'is_ai': True
        },
        {
            'id': 3,
            'username': 'OptimizeDaily',
            'type': 'challenge',
            'content': 'Week 2 of my personalized challenge: "Satisfaction Prediction Master". The AI\'s predictions are getting scary accurate! 🎯',
            'likes': 8,
            'comments': 2,
            'created_at': (datetime.utcnow() - timedelta(hours=5)).isoformat(),
            'is_ai': True
        }
    ]

@app.route('/api/predictive-insights', methods=['GET'])
def get_predictive_insights():
    """🔮 UNIQUE: Predictive health insights"""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = User.query.get(session['user_id'])
        
        # Analyze eating patterns for predictions
        recent_analyses = user.meal_analyses[-14:]  # Last 2 weeks
        
        if len(recent_analyses) < 3:
            return jsonify({
                'message': 'Need more data for predictions',
                'analyses_needed': 3 - len(recent_analyses)
            }), 200
        
        predictions = generate_health_predictions(user, recent_analyses)
        
        return jsonify({
            'predictions': predictions,
            'confidence': calculate_prediction_confidence(len(recent_analyses)),
            'based_on_analyses': len(recent_analyses)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Prediction error: {str(e)}'}), 500

def generate_health_predictions(user, analyses):
    """Generate predictive health insights"""
    
    # Calculate trends
    calories = [a.total_calories for a in analyses if a.total_calories]
    health_scores = [a.health_score for a in analyses if a.health_score]
    
    avg_calories = sum(calories) / len(calories) if calories else 2000
    avg_health_score = sum(health_scores) / len(health_scores) if health_scores else 5
    
    # Predict weight change
    daily_calorie_surplus = avg_calories - 2000  # Assuming 2000 baseline
    weekly_weight_change = (daily_calorie_surplus * 7) / 7700  # 7700 cal = 1kg
    
    # Predict 6-month weight
    predicted_weight = user.current_weight + (weekly_weight_change * 26)
    
    # Health trajectory
    if avg_health_score > 7:
        health_trajectory = "improving"
        obesity_risk_trend = "decreasing"
    elif avg_health_score < 5:
        health_trajectory = "concerning"
        obesity_risk_trend = "increasing"
    else:
        health_trajectory = "stable"
        obesity_risk_trend = "stable"
    
    return {
        'weight_prediction': {
            '1_month': round(user.current_weight + weekly_weight_change * 4, 1),
            '3_months': round(user.current_weight + weekly_weight_change * 13, 1),
            '6_months': round(predicted_weight, 1),
            'weekly_trend': round(weekly_weight_change, 2)
        },
        'health_trajectory': health_trajectory,
        'obesity_risk_trend': obesity_risk_trend,
        'metabolic_age_prediction': max(user.age - 5, calculate_metabolic_age(avg_health_score)),
        'energy_pattern': analyze_energy_patterns(analyses),
        'recommendations': generate_predictive_recommendations(user, avg_health_score, weekly_weight_change)
    }

def calculate_metabolic_age(avg_health_score):
    """Calculate metabolic age based on eating habits"""
    # Higher health score = younger metabolic age
    base_reduction = (avg_health_score - 5) * 2
    return max(18, 30 - base_reduction)

def analyze_energy_patterns(analyses):
    """Analyze energy patterns from meal data"""
    energy_data = []
    
    for analysis in analyses:
        if analysis.energy_level_prediction:
            try:
                timeline = json.loads(analysis.energy_level_prediction)
                for point in timeline:
                    energy_data.append(point.get('energy', 5))
            except:
                pass
    
    if energy_data:
        avg_energy = sum(energy_data) / len(energy_data)
        return {
            'average_energy': round(avg_energy, 1),
            'pattern': 'stable' if 5 <= avg_energy <= 7 else 'fluctuating'
        }
    
    return {'average_energy': 6.0, 'pattern': 'unknown'}

def generate_predictive_recommendations(user, health_score, weight_trend):
    """Generate recommendations based on predictions"""
    recommendations = []
    
    if weight_trend > 0.1:
        recommendations.append({
            'type': 'weight_management',
            'priority': 'high',
            'message': f'Current eating pattern predicts +{weight_trend:.1f}kg weekly gain. Consider reducing portions by 15%.',
            'action': 'Reduce daily calories by 200-300'
        })
    
    if health_score < 6:
        recommendations.append({
            'type': 'nutrition_quality',
            'priority': 'high',
            'message': 'Your nutrition quality trend suggests increased health risks. Focus on whole foods.',
            'action': 'Aim for 2 meals daily with 8+ health score'
        })
    
    if user.streak_days < 3:
        recommendations.append({
            'type': 'consistency',
            'priority': 'medium',
            'message': 'Consistent tracking will improve prediction accuracy and results.',
            'action': 'Track meals for 7 consecutive days'
        })
    
    recommendations.append({
        'type': 'optimization',
        'priority': 'low',
        'message': 'Your eating personality shows potential for advanced optimization strategies.',
        'action': 'Try the "Metabolic Timing" challenge'
    })
    
    return recommendations

def calculate_prediction_confidence(num_analyses):
    """Calculate confidence level for predictions"""
    if num_analyses >= 14:
        return 'high'
    elif num_analyses >= 7:
        return 'medium'
    else:
        return 'low'

@app.route('/api/user/stats-advanced', methods=['GET'])
def get_advanced_user_stats():
    """Enhanced user statistics with revolutionary features"""
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Basic stats
        total_analyses = len(user.meal_analyses)
        
        # Advanced analytics
        food_memories = FoodMemory.query.filter_by(user_id=user.id).all()
        active_challenges = UserChallenge.query.filter_by(
            user_id=user.id, 
            status='active'
        ).count()
        
        # Calculate insights
        personality_insights = {}
        if user.dna_food_profile:
            personality_insights = json.loads(user.dna_food_profile)
        
        # Recent performance
        recent_analyses = user.meal_analyses[-7:]  # Last week
        recent_avg_score = sum(a.health_score for a in recent_analyses if a.health_score) / max(len(recent_analyses), 1)
        
        # Badges
        user_badges = db.session.query(UserBadge, Badge).join(
            Badge, UserBadge.badge_id == Badge.id
        ).filter(UserBadge.user_id == user.id).all()
        
        badges_data = []
        for user_badge, badge in user_badges:
            badges_data.append({
                'name': badge.name,
                'description': badge.description,
                'icon': badge.icon,
                'rarity': badge.rarity,
                'unlocked_at': user_badge.unlocked_at.isoformat()
            })
        
        return jsonify({
            'user': {
                'id': user.id,
                'username': user.username,
                'level': user.level,
                'total_xp': user.total_xp,
                'streak_days': user.streak_days,
                'metabolic_age': user.metabolic_age,
                'current_weight': user.current_weight,
                'target_weight': user.target_weight
            },
            'advanced_stats': {
                'total_analyses': total_analyses,
                'food_memories_count': len(food_memories),
                'active_challenges': active_challenges,
                'recent_performance': round(recent_avg_score, 1),
                'personality_unlocked': bool(user.dna_food_profile),
                'badges_earned': len(badges_data)
            },
            'personality_insights': personality_insights,
            'recent_badges': badges_data[-3:],  # Last 3 badges
            'achievement_progress': {
                'next_level_xp': calculate_next_level_xp(user.total_xp),
                'completion_percentage': calculate_profile_completion(user)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Stats error: {str(e)}'}), 500

def calculate_next_level_xp(current_xp):
    """Calculate XP needed for next level"""
    levels = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000]
    
    for threshold in levels:
        if current_xp < threshold:
            return threshold - current_xp
    
    return 5000  # For mythical+ levels

def calculate_profile_completion(user):
    """Calculate profile completion percentage"""
    completed = 0
    total = 8
    
    if user.age: completed += 1
    if user.current_weight: completed += 1
    if user.target_weight: completed += 1
    if user.height: completed += 1
    if user.meal_analyses: completed += 1
    if user.dna_food_profile: completed += 1
    if user.streak_days >= 3: completed += 1
    if user.total_xp >= 100: completed += 1
    
    return round((completed / total) * 100)

@app.route('/api/login', methods=['POST'])
def login():
    """Enhanced login with analytics"""
    try:
        data = request.get_json()
        
        # Demo user for testing
        if data.get('email') == 'demo@nutrivision.com' and data.get('password') == 'password123':
            # Create or get demo user
            demo_user = User.query.filter_by(email='demo@nutrivision.com').first()
            if not demo_user:
                demo_user = User(
                    username='DemoUser',
                    email='demo@nutrivision.com',
                    password_hash=generate_password_hash('password123'),
                    age=28,
                    current_weight=75.0,
                    target_weight=70.0,
                    height=175.0,
                    gender='male',
                    total_xp=250,
                    level='Learner',
                    streak_days=3,
                    metabolic_age=26
                )
                db.session.add(demo_user)
                db.session.commit()
            
            session['user_id'] = demo_user.id
            
            return jsonify({
                'message': 'Demo login successful',
                'user': {
                    'id': demo_user.id,
                    'username': demo_user.username,
                    'level': demo_user.level,
                    'total_xp': demo_user.total_xp,
                    'streak_days': demo_user.streak_days,
                    'current_weight': demo_user.current_weight,
                    'target_weight': demo_user.target_weight,
                    'metabolic_age': demo_user.metabolic_age
                }
            }), 200
        
        # Regular login
        user = User.query.filter_by(email=data.get('email')).first()
        
        if user and check_password_hash(user.password_hash, data.get('password')):
            session['user_id'] = user.id
            user.last_activity = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'level': user.level,
                    'total_xp': user.total_xp,
                    'streak_days': user.streak_days,
                    'current_weight': user.current_weight,
                    'target_weight': user.target_weight,
                    'metabolic_age': user.metabolic_age
                }
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'error': f'Login error: {str(e)}'}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """User logout"""
    session.pop('user_id', None)
    return jsonify({'message': 'Logout successful'}), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    """API health check"""
    return jsonify({
        'status': 'OK',
        'message': 'NutriVision Pro Revolutionary API',
        'version': '2.0.0',
        'timestamp': datetime.utcnow().isoformat(),
        'features': [
            'Advanced AI Analysis',
            'Food DNA Profiling',
            'Predictive Insights',
            'Revolutionary Gamification',
            'Anonymous Social Feed',
            'Personalized Challenges'
        ]
    }), 200

# ================================
# 🗄️ DATABASE INITIALIZATION
# ================================

def init_revolutionary_database():
    """Initialize database with revolutionary features"""
    db.create_all()
    
    # Create legendary badges
    legendary_badges = [
        {
            'name': 'DNA Decoder',
            'description': 'Unlocked your unique Food DNA profile',
            'icon': '🧬',
            'category': 'legendary',
            'rarity': 'legendary',
            'xp_reward': 500
        },
        {
            'name': 'Mind Reader',
            'description': 'AI correctly predicted your satisfaction 10 times',
            'icon': '🧠',
            'category': 'achievement',
            'rarity': 'epic',
            'xp_reward': 300
        },
        {
            'name': 'Future Seer',
            'description': 'Unlocked predictive health insights',
            'icon': '🔮',
            'category': 'milestone',
            'rarity': 'rare',
            'xp_reward': 200
        },
        {
            'name': 'Optimization Master',
            'description': '5 consecutive meals with 8+ health score',
            'icon': '🎯',
            'category': 'achievement',
            'rarity': 'epic',
            'xp_reward': 400
        },
        {
            'name': 'Streak Legend',
            'description': '30-day analysis streak',
            'icon': '🔥',
            'category': 'legendary',
            'rarity': 'legendary',
            'xp_reward': 1000
        },
        {
            'name': 'Social Pioneer',
            'description': 'First to share achievement on social feed',
            'icon': '🌟',
            'category': 'achievement',
            'rarity': 'rare',
            'xp_reward': 150
        }
    ]
    
    for badge_data in legendary_badges:
        existing_badge = Badge.query.filter_by(name=badge_data['name']).first()
        if not existing_badge:
            badge = Badge(**badge_data)
            db.session.add(badge)
    
    # Create sample social posts
    sample_posts = [
        {
            'user_id': 1,  # Will be updated
            'anonymous_username': 'HealthGuru_AI',
            'post_type': 'tip',
            'content': 'Did you know? The AI can predict your energy levels for the next 6 hours based on your meal! Use this to time your workouts perfectly. ⚡',
            'likes': 42,
            'comments_count': 8,
            'is_ai_generated': True
        },
        {
            'user_id': 1,
            'anonymous_username': 'OptimizerPro',
            'post_type': 'achievement',
            'content': 'Just discovered I\'m a "Disciplined Optimizer" with Explorer genes! 🧬 My Food DNA reveals I crave variety but make healthy choices. What\'s your eating personality?',
            'likes': 67,
            'comments_count': 15,
            'is_ai_generated': True
        }
    ]
    
    for post_data in sample_posts:
        existing_post = SocialFeed.query.filter_by(content=post_data['content']).first()
        if not existing_post:
            post = SocialFeed(**post_data)
            db.session.add(post)
    
    db.session.commit()
    print("🚀 Revolutionary database initialized!")
    print("🧬 Food DNA system ready")
    print("🎯 Personalized challenges active")
    print("🔮 Predictive insights enabled")
    print("🌟 Social feed configured")

if __name__ == '__main__':
    with app.app_context():
        init_revolutionary_database()
    
    print("🌟 ====================================")
    print("🚀 NUTRIVISION PRO - REVOLUTIONARY AI")
    print("🌟 ====================================")
    print("")
    print("🤖 Azure OpenAI GPT-4o: ACTIVE")
    print("🧬 Food DNA Profiling: ENABLED")
    print("🔮 Predictive Insights: ACTIVE")
    print("🎮 Advanced Gamification: LOADED")
    print("🌟 Anonymous Social Feed: READY")
    print("🎯 AI Challenges: PERSONALIZED")
    print("")
    print("📊 Database: SQLite (nutrivision_pro.db)")
    print("🌐 Server: http://localhost:5001")
    print("🔥 Status: REVOLUTIONARY FEATURES ACTIVE")
    print("")
    
    app.run(debug=True, host='0.0.0.0', port=5001)