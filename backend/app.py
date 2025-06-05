#!/usr/bin/env python3
"""
🚀 NUTRIVISION PRO - REVOLUTIONARY BACKEND
Complete backend com:
- Geração de receitas com validação de ingredientes
- Monitoramento de ciclo menstrual
- Personalização avançada
- Sugestões inteligentes de refeições
- Planos de nutrição
- Integração fixa com Azure OpenAI
- Armazenamento e recuperação de log diário de refeições
"""

import os
import json
import base64
from datetime import datetime, timedelta, date
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, request, jsonify, session, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text, inspect
from flask_cors import CORS
from PIL import Image, ImageEnhance, ImageFilter
import io
import uuid
import random
try:
    from openai import AzureOpenAI
    _openai_available = True
except Exception:  # pragma: no cover - optional dependency
    AzureOpenAI = None
    _openai_available = False
import numpy as np
from collections import Counter
import logging
import re
import requests


app = Flask(__name__)
app.config['SECRET_KEY'] = 'nutrivision-revolutionary-2024'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///nutrivision_pro.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'

# Configurações de sessão (Flask padrão)
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = False
app.config['SESSION_REFRESH_EACH_REQUEST'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

# CORS
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

# Garante que a pasta de uploads exista
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)

# ================================
# 🤖 AZURE OPENAI CONFIGURATION - GPT-4o & DALL·E
# ================================
if _openai_available:
    client = AzureOpenAI(
        api_key="DeienCd2CFxMsU08bncNRd3bTlfZ3HgDPyy2R5M9F0OO8vJa9l1EJQQJ99BCACYeBjFXJ3w3AAAAACOG3kpB",
        api_version="2024-12-01-preview",
        azure_endpoint="https://azure-openai096185143674.openai.azure.com/"
    )
else:  # pragma: no cover - fallback for offline environments
    client = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ================================
# 🥘 INGREDIENT VALIDATION
# ================================

VALID_FOOD_CATEGORIES = {
    'proteins': [
        # English
        'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'eggs', 'tofu',
        'beans', 'lentils', 'chickpeas', 'turkey', 'lamb', 'duck', 'cod', 'tilapia',
        'cheese', 'cottage cheese', 'greek yogurt', 'protein powder', 'quinoa',
        # Portuguese/Spanish
        'frango', 'pollo', 'carne', 'porco', 'cerdo', 'peixe', 'pescado', 'salmão',
        'atum', 'camarão', 'gambas', 'ovos', 'huevos', 'feijão', 'frijoles',
        'lentilhas', 'lentejas', 'grão', 'garbanzos', 'peru', 'pavo', 'cordeiro',
        'bacalhau', 'queijo', 'queso', 'iogurte', 'yogur'
    ],
    'vegetables': [
        # English
        'broccoli', 'spinach', 'carrots', 'tomatoes', 'onions', 'garlic', 'peppers',
        'cucumber', 'lettuce', 'kale', 'cauliflower', 'zucchini', 'mushrooms',
        'bell peppers', 'celery', 'asparagus', 'brussels sprouts', 'cabbage',
        'eggplant', 'corn', 'peas', 'green beans', 'potato', 'sweet potato',
        # Portuguese/Spanish
        'brócolos', 'brócoli', 'espinafres', 'espinacas', 'cenouras', 'zanahorias',
        'tomates', 'cebolas', 'cebollas', 'alho', 'ajo', 'pimentos', 'pimientos',
        'pepino', 'alface', 'lechuga', 'couve-flor', 'coliflor', 'abobrinha',
        'calabacín', 'cogumelos', 'champiñones', 'aipo', 'abrigo', 'beringela',
        'berenjena', 'milho', 'maíz', 'ervilhas', 'guisantes', 'batata', 'papa',
        'batata-doce', 'boniato'
    ],
    'fruits': [
        # English
        'apple', 'banana', 'orange', 'berries', 'strawberries', 'blueberries',
        'grapes', 'lemon', 'lime', 'avocado', 'mango', 'pineapple', 'watermelon',
        'cantaloupe', 'peach', 'pear', 'cherries', 'kiwi', 'coconut',
        # Portuguese/Spanish
        'maçã', 'manzana', 'banana', 'plátano', 'laranja', 'naranja', 'morangos',
        'fresas', 'mirtilos', 'arándanos', 'uvas', 'limão', 'limón', 'lima',
        'abacate', 'palta', 'manga', 'ananás', 'piña', 'melancia', 'sandía',
        'pêssego', 'melocotón', 'pêra', 'pera', 'cerejas', 'cerezas', 'coco',
        'ameixas', 'ciruelas', 'figos', 'higos'
    ],
    'grains': [
        # English
        'rice', 'brown rice', 'quinoa', 'oats', 'bread', 'pasta', 'barley',
        'couscous', 'bulgur', 'millet', 'farro', 'buckwheat', 'wild rice',
        # Portuguese/Spanish
        'arroz', 'arroz integral', 'arroz moreno', 'quinoa', 'aveia', 'avena',
        'pão', 'pan', 'massa', 'pasta', 'cevada', 'cebada', 'cuscuz', 'cuscús',
        'trigo', 'bulgur', 'milhete', 'mijo'
    ],
    'dairy': [
        # English
        'milk', 'yogurt', 'cheese', 'butter', 'cream', 'sour cream', 'mozzarella',
        'cheddar', 'parmesan', 'feta', 'ricotta', 'cottage cheese',
        # Portuguese/Spanish
        'leite', 'leche', 'iogurte', 'yogur', 'queijo', 'queso', 'manteiga',
        'mantequilla', 'nata', 'crema', 'mozzarella', 'parmesão', 'parmesano',
        'requeijão', 'requeson'
    ],
    'nuts_seeds': [
        # English
        'almonds', 'walnuts', 'cashews', 'pecans', 'peanuts', 'pistachios',
        'chia seeds', 'flax seeds', 'sunflower seeds', 'pumpkin seeds',
        'sesame seeds', 'pine nuts',
        # Portuguese/Spanish
        'amêndoas', 'almendras', 'nozes', 'nueces', 'castanhas', 'castañas',
        'amendoins', 'maníes', 'pistácios', 'pistachos', 'sementes de chia',
        'semillas de chía', 'linhaça', 'linaza', 'sementes de girassol',
        'semillas de girasol', 'sementes de abóbora', 'semillas de calabaza'
    ],
    'herbs_spices': [
        # English
        'basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'cilantro',
        'ginger', 'turmeric', 'cumin', 'paprika', 'black pepper', 'salt',
        'cinnamon', 'vanilla', 'bay leaves', 'dill', 'sage', 'mint',
        # Portuguese/Spanish
        'manjericão', 'albahaca', 'orégano', 'tomilho', 'tomillo', 'alecrim',
        'romero', 'salsa', 'perejil', 'coentros', 'cilantro', 'gengibre',
        'jengibre', 'açafrão', 'cúrcuma', 'cominho', 'comino', 'pimentão doce',
        'pimentón', 'pimenta preta', 'pimienta negra', 'sal', 'canela',
        'baunilha', 'vainilla', 'louro', 'laurel', 'hortelã', 'menta'
    ],
    'oils_fats': [
        # English
        'olive oil', 'coconut oil', 'vegetable oil', 'butter', 'ghee',
        'avocado oil', 'sesame oil', 'canola oil', 'sunflower oil',
        # Portuguese/Spanish
        'azeite', 'aceite de oliva', 'óleo de coco', 'aceite de coco',
        'óleo vegetal', 'aceite vegetal', 'manteiga', 'mantequilla',
        'óleo de abacate', 'aceite de aguacate', 'óleo de sésamo',
        'aceite de sésamo', 'óleo de girassol', 'aceite de girasol'
    ]
}

# Mapa para traduzir ingredientes PT/ES → EN
INGREDIENT_TRANSLATIONS = {
    # Português → Inglês
    'frango': 'chicken',
    'carne': 'beef',
    'porco': 'pork',
    'peixe': 'fish',
    'salmão': 'salmon',
    'atum': 'tuna',
    'camarão': 'shrimp',
    'ovos': 'eggs',
    'feijão': 'beans',
    'lentilhas': 'lentils',
    'grão': 'chickpeas',
    'queijo': 'cheese',
    'iogurte': 'yogurt',
    'brócolos': 'broccoli',
    'espinafres': 'spinach',
    'cenouras': 'carrots',
    'tomates': 'tomatoes',
    'cebolas': 'onions',
    'alho': 'garlic',
    'pimentos': 'peppers',
    'cogumelos': 'mushrooms',
    'batata': 'potato',
    'batata-doce': 'sweet potato',
    'maçã': 'apple',
    'banana': 'banana',
    'laranja': 'orange',
    'morangos': 'strawberries',
    'uvas': 'grapes',
    'limão': 'lemon',
    'abacate': 'avocado',
    'manga': 'mango',
    'ananás': 'pineapple',
    'ameixas': 'plums',
    'cerejas': 'cherries',
    'arroz': 'rice',
    'aveia': 'oats',
    'pão': 'bread',
    'massa': 'pasta',
    'leite': 'milk',
    'manteiga': 'butter',
    'azeite': 'olive oil',

    # Espanhol → Inglês
    'pollo': 'chicken',
    'cerdo': 'pork',
    'pescado': 'fish',
    'gambas': 'shrimp',
    'huevos': 'eggs',
    'frijoles': 'beans',
    'lentejas': 'lentils',
    'garbanzos': 'chickpeas',
    'queso': 'cheese',
    'yogur': 'yogurt',
    'brócoli': 'broccoli',
    'espinacas': 'spinach',
    'zanahorias': 'carrots',
    'cebollas': 'onions',
    'ajo': 'garlic',
    'pimientos': 'peppers',
    'champiñones': 'mushrooms',
    'papa': 'potato',
    'manzana': 'apple',
    'plátano': 'banana',
    'naranja': 'orange',
    'fresas': 'strawberries',
    'limón': 'lemon',
    'palta': 'avocado',
    'piña': 'pineapple',
    'ciruelas': 'plums',
    'cerezas': 'cherries',
    'arroz moreno': 'brown rice',
    'avena': 'oats',
    'pan': 'bread',
    'pasta': 'pasta',
    'leche': 'milk',
    'mantequilla': 'butter',
    'aceite de oliva': 'olive oil'
}


def translate_ingredients_to_english(ingredients_list):
    """
    Traduz ingredientes (PT/ES → EN) para o AI processar melhor
    """
    translated = []
    for ingredient in ingredients_list:
        ingredient_lower = ingredient.lower().strip()
        if ingredient_lower in INGREDIENT_TRANSLATIONS:
            translated.append(INGREDIENT_TRANSLATIONS[ingredient_lower])
        else:
            translated.append(ingredient)
    return translated

# Achata todas as opções válidas de ingredientes
ALL_VALID_INGREDIENTS = []
for category in VALID_FOOD_CATEGORIES.values():
    ALL_VALID_INGREDIENTS.extend(category)

def find_similar_ingredients(ingredient):
    """
    Retorna até 3 ingredientes similares, usando interseção de palavras
    """
    similar = []
    ingredient_words = set(ingredient.split())

    for valid_ingredient in ALL_VALID_INGREDIENTS:
        valid_words = set(valid_ingredient.split())
        if ingredient_words & valid_words:
            similar.append(valid_ingredient)
        elif any(valid_ingredient.startswith(word) for word in ingredient_words):
            similar.append(valid_ingredient)

    return similar[:3]

def validate_ingredients(ingredients_list, strict=True):
    """
    Valida os ingredientes utilizando o dicionário interno.

    Se ``strict`` for ``False`` todos os itens são considerados válidos e
    apenas sugestões de possíveis correções são retornadas.
    """
    valid_items = []
    invalid_items = []
    suggestions = []

    for ingredient in ingredients_list:
        ingredient_clean = ingredient.lower().strip()
        is_valid = False
        for valid_ingredient in ALL_VALID_INGREDIENTS:
            if (
                ingredient_clean in valid_ingredient
                or valid_ingredient in ingredient_clean
                or len(set(ingredient_clean.split()) & set(valid_ingredient.split())) > 0
            ):
                is_valid = True
                break

        if is_valid or not strict:
            valid_items.append(ingredient)
        else:
            invalid_items.append(ingredient)

        similar = find_similar_ingredients(ingredient_clean)
        if similar:
            suggestions.extend(similar[:2])

    return {
        'valid_items': valid_items,
        'invalid_items': invalid_items if strict else [],
        'suggestions': list(set(suggestions))
    }

# ================================
# 🎨 IMAGE-TO-INGREDIENT DETECTION HELPER
# ================================
def detect_ingredients_from_image(image_base64):
    """
    Envia a imagem (em base64) ao GPT-4o pedindo para listar
    os ingredientes/alimentos que aparecem. Retorna uma lista de strings.
    """
    system_prompt = """
    Você é um modelo de visão+linguagem especializado em identificar
    alimentos e itens comestíveis numa imagem. Abaixo você verá
    apenas o conteúdo de uma imagem (codificado em base64). Preciso que
    você retorne SOMENTE um array JSON contendo os nomes dos alimentos
    que você reconhece (em inglês ou português), nada mais.

    Exemplo de resposta válida:
    ["tomato", "lettuce", "milk", "egg"]

    IMPORTANTE: não retorne texto fora do array JSON — somente o array.
    """

    if client is None:
        logger.warning("Azure OpenAI client unavailable - skipping image ingredient detection")
        return []

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Detecte todos os alimentos nesta imagem e retorne um JSON array com os nomes."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                    ]
                }
            ],
            max_tokens=500,
            temperature=0.0
        )
        ai_content = response.choices[0].message.content.strip()

        # Caso venha entre ```json ... ```, removemos as marcações
        if ai_content.startswith("```json"):
            ai_content = ai_content.replace("```json", "").replace("```", "").strip()

        # Tentamos fazer o parse do JSON retornado
        try:
            detected = json.loads(ai_content)
            if isinstance(detected, list):
                return detected
        except:
            pass

    except Exception as e:
        logger.error(f"Erro ao detectar ingredientes na imagem: {e}")

    # Em caso de erro, devolvemos lista vazia para não quebrar o fluxo
    return []


def is_food_image(image_base64):
    """
    Retorna True se houver pelo menos um item alimentar detectado pela AI.
    """
    detected_items = detect_ingredients_from_image(image_base64)
    return bool(detected_items)

# ================================
# 📊 MODELS
# ================================
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    age = db.Column(db.Integer)
    current_weight = db.Column(db.Float)
    target_weight = db.Column(db.Float)
    height = db.Column(db.Float)
    gender = db.Column(db.String(10))
    activity_level = db.Column(db.String(20))

    total_xp = db.Column(db.Integer, default=0)
    level = db.Column(db.String(20), default='Novice')
    streak_days = db.Column(db.Integer, default=0)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)

    dna_food_profile = db.Column(db.Text)
    taste_personality = db.Column(db.Text)
    cooking_skill_level = db.Column(db.Integer, default=1)
    social_eating_score = db.Column(db.Float, default=5.0)

    profile_photo = db.Column(db.String(200))

    obesity_risk_trend = db.Column(db.Text)
    metabolic_age = db.Column(db.Integer)
    predicted_weight_in_6months = db.Column(db.Float)

    meal_analyses = db.relationship('MealAnalysis', backref='user', lazy=True)
    badges = db.relationship('UserBadge', backref='user', lazy=True)
    food_memories = db.relationship('FoodMemory', backref='user', lazy=True)
    meal_challenges = db.relationship('UserChallenge', backref='user', lazy=True)
    recipes = db.relationship('RecipeCollection', backref='user', lazy=True)
    nutrition_plans = db.relationship('NutritionPlan', backref='user', lazy=True)
    daily_meals = db.relationship('DailyMeal', backref='user', lazy=True)

class MealAnalysis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    image_path = db.Column(db.String(200))

    foods_detected = db.Column(db.Text)
    total_calories = db.Column(db.Integer)
    protein = db.Column(db.Float)
    carbs = db.Column(db.Float)
    fat = db.Column(db.Float)
    fiber = db.Column(db.Float)

    emotional_food_score = db.Column(db.Float)
    social_context = db.Column(db.String(50))
    food_addiction_risk = db.Column(db.Float)
    predicted_satisfaction = db.Column(db.Float)
    optimal_eating_time = db.Column(db.String(20))

    eating_personality_type = db.Column(db.String(50))
    mood_before_eating = db.Column(db.String(20))
    mood_after_eating = db.Column(db.String(20))

    weight_impact_prediction = db.Column(db.Float)
    energy_level_prediction = db.Column(db.Text)
    sleep_quality_impact = db.Column(db.Float)

    health_score = db.Column(db.Float)
    obesity_risk = db.Column(db.String(20))
    ai_feedback = db.Column(db.Text)
    suggestions = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    meal_type = db.Column(db.String(20))

class DailyMeal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    calories = db.Column(db.Integer)
    protein = db.Column(db.Float)
    carbs = db.Column(db.Float)
    fat = db.Column(db.Float)
    meal_type = db.Column(db.String(20))
    time = db.Column(db.String(5))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class FoodMemory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    food_name = db.Column(db.String(100))

    times_eaten = db.Column(db.Integer, default=1)
    avg_satisfaction = db.Column(db.Float)
    last_eaten = db.Column(db.DateTime, default=datetime.utcnow)

    preferred_time = db.Column(db.String(20))
    mood_association = db.Column(db.String(20))
    social_context = db.Column(db.String(20))

    addiction_pattern = db.Column(db.Float)
    health_trend = db.Column(db.Float)
    craving_prediction = db.Column(db.Float)

class Challenge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    description = db.Column(db.Text)
    category = db.Column(db.String(50))
    difficulty = db.Column(db.String(20))
    xp_reward = db.Column(db.Integer)

    criteria = db.Column(db.Text)
    duration_days = db.Column(db.Integer)
    is_personalized = db.Column(db.Boolean, default=False)

class UserChallenge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenge.id'), nullable=False)

    progress = db.Column(db.Float, default=0.0)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='active')

class Badge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(10))
    category = db.Column(db.String(50))
    rarity = db.Column(db.String(20))
    criteria = db.Column(db.Text)
    xp_reward = db.Column(db.Integer, default=100)

class UserBadge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    badge_id = db.Column(db.Integer, db.ForeignKey('badge.id'), nullable=False)
    unlocked_at = db.Column(db.DateTime, default=datetime.utcnow)

class SocialFeed(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    anonymous_username = db.Column(db.String(50))
    post_type = db.Column(db.String(20))
    content = db.Column(db.Text)
    image_path = db.Column(db.String(200))

    likes = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    shares = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_ai_generated = db.Column(db.Boolean, default=False)

class MenstrualCycle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    cycle_start_date = db.Column(db.Date, nullable=False)
    cycle_length = db.Column(db.Integer, default=28)
    period_length = db.Column(db.Integer, default=5)
    current_phase = db.Column(db.String(20), default='follicular')

    symptoms = db.Column(db.Text, nullable=True)  # JSON
    energy_level = db.Column(db.Integer, default=5)
    mood = db.Column(db.String(20), default='neutral')
    cravings = db.Column(db.Text, nullable=True)  # JSON

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "cycle_start_date": self.cycle_start_date.isoformat(),
            "cycle_length": self.cycle_length,
            "period_length": self.period_length,
            "current_phase": self.current_phase,
            "symptoms": json.loads(self.symptoms or "[]"),
            "energy_level": self.energy_level,
            "mood": self.mood,
            "cravings": json.loads(self.cravings or "[]"),
            "created_at": self.created_at.isoformat()
        }

class NutritionPlan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    plan_name = db.Column(db.String(100), nullable=False)
    plan_type = db.Column(db.String(50), nullable=False)
    start_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    daily_calories = db.Column(db.Integer, nullable=False)
    daily_protein = db.Column(db.Float, nullable=False)
    daily_carbs = db.Column(db.Float, nullable=False)
    daily_fat = db.Column(db.Float, nullable=False)
    meal_distribution = db.Column(db.Text, nullable=True)

    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "plan_name": self.plan_name,
            "plan_type": self.plan_type,
            "start_date": self.start_date.isoformat(),
            "daily_calories": self.daily_calories,
            "daily_protein": self.daily_protein,
            "daily_carbs": self.daily_carbs,
            "daily_fat": self.daily_fat,
            "meal_distribution": json.loads(self.meal_distribution or "{}"),
            "is_active": self.is_active
        }

class RecipeCollection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)

    # Aqui armazenamos ingredientes, instruções, etc em JSON (string)
    ingredients = db.Column(db.Text, nullable=True)
    instructions = db.Column(db.Text, nullable=True)

    prep_time = db.Column(db.Integer, nullable=False, default=0)
    cook_time = db.Column(db.Integer, nullable=False, default=0)
    servings = db.Column(db.Integer, nullable=False, default=1)

    calories_per_serving = db.Column(db.Integer, nullable=False, default=0)
    protein_per_serving = db.Column(db.Float, nullable=False, default=0.0)
    carbs_per_serving = db.Column(db.Float, nullable=False, default=0.0)
    fat_per_serving = db.Column(db.Float, nullable=False, default=0.0)

    category = db.Column(db.String(50), nullable=False, default='user-generated')
    difficulty = db.Column(db.String(30), nullable=False, default='beginner')
    tags = db.Column(db.Text, nullable=True)

    matches_dna = db.Column(db.Boolean, default=False)
    personalization_score = db.Column(db.Float, default=0.0)
    image_url = db.Column(db.String(300), nullable=True)  # ← ADICIONADO para armazenar URL de foto

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "ingredients": json.loads(self.ingredients or "[]"),
            "instructions": json.loads(self.instructions or "[]"),
            "prep_time": self.prep_time,
            "cook_time": self.cook_time,
            "servings": self.servings,
            "calories_per_serving": self.calories_per_serving,
            "protein_per_serving": self.protein_per_serving,
            "carbs_per_serving": self.carbs_per_serving,
            "fat_per_serving": self.fat_per_serving,
            "category": self.category,
            "difficulty": self.difficulty,
            "tags": json.loads(self.tags or "[]"),
            "matches_dna": self.matches_dna,
            "personalization_score": self.personalization_score,
            "image_url": self.image_url,
            "created_at": self.created_at.isoformat()
        }

# ================================
# 🛠 HELPER FUNCTIONS GERAIS
# ================================
def get_current_user():
    try:
        if 'user_id' not in session:
            return None
        user = User.query.get(session['user_id'])
        if not user:
            session.pop('user_id', None)
            return None
        return user
    except:
        return None

def calculate_advanced_level(xp):
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

def calculate_user_level(total_xp):
    if total_xp < 100:
        return "Beginner"
    elif total_xp < 500:
        return "Explorer"
    elif total_xp < 1000:
        return "Enthusiast"
    elif total_xp < 2000:
        return "Expert"
    else:
        return "Master"

def calculate_metabolic_age(avg_health_score):
    base_reduction = (avg_health_score - 5) * 2
    return max(18, 30 - base_reduction)

def analyze_eating_patterns(analyses):
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

def generate_food_dna_profile(user_analyses):
    """🧬 UNIQUE: Generate user's Food DNA based on eating patterns"""

    if not user_analyses:
        return {
            "dominant_genes": ["Explorer", "Optimizer"],
            "taste_preferences": {"sweet": 30, "salty": 25, "umami": 20, "bitter": 15, "sour": 10},
            "eating_triggers": ["hunger", "routine"],
            "optimization_score": 50
        }

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

def generate_personalized_challenge(user):
    analyses = user.meal_analyses[-10:]
    if not analyses:
        return create_beginner_challenge()

    avg_health_score = sum(a.health_score for a in analyses if a.health_score) / len(analyses)
    if avg_health_score < 5:
        return {
            "name": "The Transformation Challenge",
            "description": "Replace one unhealthy meal per day with a 7+ health score meal",
            "category": "health_boost",
            "difficulty": "medium",
            "duration_days": 7,
            "xp_reward": 500,
            "criteria": json.dumps({"target_health_score": 7, "frequency": "daily"})
        }
    elif user.streak_days < 3:
        return {
            "name": "Consistency Warrior",
            "description": "Analyze your meals for 5 consecutive days",
            "category": "consistency",
            "difficulty": "easy",
            "duration_days": 5,
            "xp_reward": 300,
            "criteria": json.dumps({"consecutive_days": 5})
        }
    else:
        return {
            "name": "Optimization Master",
            "description": "Achieve 3 meals with 9+ health score this week",
            "category": "optimization",
            "difficulty": "hard",
            "duration_days": 7,
            "xp_reward": 1000,
            "criteria": json.dumps({"target_score": 9, "count": 3})
        }

def create_beginner_challenge():
    return {
        "name": "First Steps to Health",
        "description": "Complete 3 meal analyses to understand your eating patterns",
        "category": "onboarding",
        "difficulty": "easy",
        "duration_days": 3,
        "xp_reward": 200,
        "criteria": json.dumps({"meal_analyses": 3})
    }

def check_revolutionary_badges(user):
    new_badges = []
    if len(user.meal_analyses) >= 5 and not user.dna_food_profile:
        new_badges.append({
            'name': 'DNA Decoder',
            'description': 'Unlocked your unique Food DNA profile',
            'icon': '🧬',
            'category': 'legendary',
            'rarity': 'epic',
            'xp_reward': 500
        })
    if user.streak_days == 7:
        new_badges.append({
            'name': 'Week Warrior',
            'description': '7-day analysis streak',
            'icon': '🗓️',
            'category': 'achievement',
            'rarity': 'rare',
            'xp_reward': 300
        })
    recent_analyses = user.meal_analyses[-5:]
    if recent_analyses and all(a.health_score and a.health_score > 8 for a in recent_analyses):
        new_badges.append({
            'name': 'Optimization Master',
            'description': '5 consecutive meals with 8+ health score',
            'icon': '🎯',
            'category': 'achievement',
            'rarity': 'epic',
            'xp_reward': 400
        })
    return new_badges

def calculate_challenge_progress(user, challenge, user_challenge):
    try:
        criteria = json.loads(challenge.criteria) if challenge.criteria else {}
        if 'consecutive_days' in criteria:
            return min(100, (user.streak_days / criteria['consecutive_days']) * 100)
        elif 'meal_analyses' in criteria:
            total_analyses = len(user.meal_analyses)
            return min(100, (total_analyses / criteria['meal_analyses']) * 100)
        elif 'target_health_score' in criteria:
            recent_analyses = user.meal_analyses[-7:]
            good_meals = sum(1 for a in recent_analyses if a.health_score and a.health_score >= criteria['target_health_score'])
            return min(100, (good_meals / 7) * 100)
        return 0
    except:
        return 0

def calculate_prediction_confidence(num_analyses):
    if num_analyses >= 14:
        return 'high'
    elif num_analyses >= 7:
        return 'medium'
    else:
        return 'low'

def calculate_next_level_xp(current_xp):
    levels = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000]
    for threshold in levels:
        if current_xp < threshold:
            return threshold - current_xp
    return 5000

def calculate_profile_completion(user):
    completed = 0
    total = 8
    if user.age:
        completed += 1
    if user.current_weight:
        completed += 1
    if user.target_weight:
        completed += 1
    if user.height:
        completed += 1
    if user.meal_analyses:
        completed += 1
    if user.dna_food_profile:
        completed += 1
    if user.streak_days >= 3:
        completed += 1
    if user.total_xp >= 100:
        completed += 1
    return round((completed / total) * 100)

# =============================================================================
# 🛠 AZURE OPENAI AI FUNCTIONS
# =============================================================================

def get_revolutionary_mock_analysis():
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
        "ai_insights": "Esta refeição demonstra disciplina nutricional! As escolhas sugerem uma personalidade 'Disciplined Optimizer' — alguém que prioriza saúde a longo prazo. A alta proteína aumentará seu metabolismo por 4-6 horas, enquanto os carboidratos complexos fornecem energia estável. Sua qualidade de sono tende a melhorar em 1.4 pontos hoje à noite.",
        "suggestions": [
            "Perfeito entre 12-14h para absorção ideal",
            "Sua satisfação deve atingir pico em 2 horas — evite lanches até lá",
            "Se mantido, este padrão pode gerar -0.08kg na semana",
            "Compartilhe esta vitória — suas escolhas disciplinadas inspiram os outros!"
        ]
    }

def call_advanced_food_ai(image_base64, user_context):
    if client is None:
        logger.warning("Azure OpenAI client unavailable - using mock analysis")
        return json.dumps(get_revolutionary_mock_analysis())

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
        logger.info("🤖 Chamando Azure OpenAI para análise...")
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Analyze this meal with revolutionary AI insights. Return only JSON."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                    ]
                }
            ],
            max_tokens=1500,
            temperature=0.3
        )
        ai_response = response.choices[0].message.content.strip()
        logger.info(f"✅ Azure OpenAI retornou ({len(ai_response)} caracteres)")

        if ai_response.startswith('```json'):
            ai_response = ai_response.replace('```json', '').replace('```', '').strip()

        return ai_response
    except Exception as e:
        logger.error(f"❌ Erro Azure OpenAI: {str(e)}")
        return json.dumps(get_revolutionary_mock_analysis())

def parse_ai_response(ai_response):
    try:
        if ai_response and ai_response.strip().startswith('{'):
            data = json.loads(ai_response)
            cleaned_data = {
                'foods_detected': data.get('foods_detected', ['Unknown Food']),
                'nutrition': {
                    'calories': int(data.get('nutrition', {}).get('calories', 450)),
                    'protein': float(data.get('nutrition', {}).get('protein', 25.0)),
                    'carbs': float(data.get('nutrition', {}).get('carbs', 35.0)),
                    'fat': float(data.get('nutrition', {}).get('fat', 20.0)),
                    'fiber': float(data.get('nutrition', {}).get('fiber', 8.0))
                },
                'revolutionary_analysis': {
                    'emotional_score': float(data.get('revolutionary_analysis', {}).get('emotional_score', 5.0)),
                    'addiction_potential': float(data.get('revolutionary_analysis', {}).get('addiction_potential', 3.0)),
                    'satisfaction_prediction': float(data.get('revolutionary_analysis', {}).get('satisfaction_prediction', 7.0)),
                    'energy_timeline': data.get('revolutionary_analysis', {}).get('energy_timeline', []),
                    'sleep_impact': float(data.get('revolutionary_analysis', {}).get('sleep_impact', 0.0)),
                    'weight_impact_weekly': float(data.get('revolutionary_analysis', {}).get('weight_impact_weekly', 0.0)),
                    'eating_personality': str(data.get('revolutionary_analysis', {}).get('eating_personality', 'Balanced')),
                    'optimal_time': str(data.get('revolutionary_analysis', {}).get('optimal_time', '12:00-14:00'))
                },
                'health_assessment': {
                    'score': float(data.get('health_assessment', {}).get('score', 6.5)),
                    'obesity_risk': str(data.get('health_assessment', {}).get('obesity_risk', 'moderate')),
                    'metabolic_impact': str(data.get('health_assessment', {}).get('metabolic_impact', 'neutral'))
                },
                'ai_insights': str(data.get('ai_insights', 'AI analysis completed successfully')),
                'suggestions': data.get('suggestions', ['Eat mindfully', 'Stay hydrated'])
            }
            return cleaned_data
    except (json.JSONDecodeError, ValueError, KeyError, TypeError) as e:
        logger.error(f"Erro ao parsear resposta do AI: {str(e)}")
    return get_revolutionary_mock_analysis()

def estimate_nutrition_from_text(description):
    """Estimate nutrition facts using Azure GPT based on meal description."""
    system_prompt = (
        "You are a nutrition expert. Given a meal description, "
        "estimate calories, protein, carbs and fat. Respond ONLY with JSON as "
        "{\"calories\": int, \"protein\": float, \"carbs\": float, \"fat\": float}."
    )
    if client is None:
        logger.warning("Azure OpenAI client unavailable - skipping nutrition estimation")
        return None
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": description},
            ],
            max_tokens=200,
            temperature=0.0,
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "").strip()
        data = json.loads(content)
        return {
            'calories': int(data.get('calories', 0)),
            'protein': float(data.get('protein', 0)),
            'carbs': float(data.get('carbs', 0)),
            'fat': float(data.get('fat', 0)),
        }
    except Exception as e:
        logger.error(f"Erro estimando nutrição: {e}")
        return None

def generate_meal_title(description):
    """Return a short and simple title for the meal description."""
    system_prompt = (
        "You create very simple meal titles. "
        "Given a meal description, respond with a concise 1 to 4 word name "
        "in plain language with no fancy adjectives. Return only the title."
    )
    if client is None:
        logger.warning("Azure OpenAI client unavailable - using description as title")
        return description[:60]
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": description},
            ],
            max_tokens=20,
            temperature=0.3,
        )
        title = response.choices[0].message.content.strip()
        return re.sub(r"[\r\n]+", " ", title)[:60]
    except Exception as e:
        logger.error(f"Erro ao gerar título: {e}")
        return description[:60]

def ai_filter_food_items(items):
    """Use GPT to return only the edible food items from the list."""
    system_prompt = (
        "You are a culinary expert. From the list provided, return ONLY the items that are edible foods as a JSON array of strings."
    )
    if client is None:
        logger.warning("Azure OpenAI client unavailable - skipping ingredient filtering")
        return items
    try:
        joined = ", ".join(items)
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": joined},
            ],
            max_tokens=150,
            temperature=0.0,
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "").strip()
        data = json.loads(content)
        if isinstance(data, list):
            return [str(i).strip() for i in data]
    except Exception as e:
        logger.error(f"Erro na validação AI de ingredientes: {e}")
    return items

def generate_highly_personalized_recipes(user, ingredients_list, preferences, count=3):
    """Gera receitas altamente personalizadas via GPT-4o"""
    if client is None:
        logger.warning("Azure OpenAI client unavailable - returning fallback recipes")
        return [create_fallback_recipe({'title_style': 'Sample', 'style_description': 'fallback', 'time_range': {'prep_min': 5, 'prep_max': 10, 'cook_min': 5, 'cook_max': 10}, 'servings': 1, 'primary_tag': 'fallback', 'secondary_tag': 'offline', 'style_tag': 'simple', 'difficulty': 'easy', 'creativity_level': 'simple', 'meal_context': 'quick meal', 'temperature': 0.5, 'creative_constraints': '', 'inspiration': '', 'mood': 'simple'}, ingredients_list, 0) for _ in range(count)]

    user_preferences = {
        'dietary_restrictions': getattr(user, 'dietary_restrictions', '[]'),
        'favorite_cuisines': getattr(user, 'favorite_cuisines', '[]'),
        'food_allergies': getattr(user, 'food_allergies', '[]'),
        'cooking_skill': getattr(user, 'cooking_skill', 'beginner'),
        'time_availability': getattr(user, 'time_availability', 'medium')
    }

    # Parse JSON
    try:
        dietary_restrictions = json.loads(user_preferences['dietary_restrictions'])
    except:
        dietary_restrictions = []
    try:
        favorite_cuisines = json.loads(user_preferences['favorite_cuisines'])
    except:
        favorite_cuisines = []
    try:
        food_allergies = json.loads(user_preferences['food_allergies'])
    except:
        food_allergies = []

    # Nutrição baseada no ciclo menstrual (se for usuária feminina)
    phase_recommendations = {}
    if user.gender == 'female':
        current_phase = get_menstrual_phase(user.id)
        phase_recommendations = get_phase_nutrition_recommendations(current_phase)

    recipe_configs = create_creative_recipe_configs(preferences, count)
    recipes = []
    for i, config in enumerate(recipe_configs):
        system_prompt = f"""You are a world-class creative chef and nutritionist with expertise in {config['cuisine_expertise']}.

        MISSION: Create a {config['creativity_level']} and {config['style_description']} recipe that is {config['meal_context']}.

        USER PROFILE:
        - Cooking skill: {user_preferences['cooking_skill']}
        - Dietary restrictions: {dietary_restrictions}
        - Food allergies: {food_allergies}
        - Favorite cuisines: {favorite_cuisines}

        RECIPE REQUIREMENTS:
        - Meal type: {preferences['meal_type']}
        - Temperature preference: {preferences['temperature']}
        - Cooking time: {preferences['cooking_time']}
        - Cuisine style: {preferences['cuisine_style']}
        - Dietary preference: {preferences['dietary_pref']}
        - Creativity level: {config['creativity_level']}

        AVAILABLE INGREDIENTS: {ingredients_list}

        MENSTRUAL PHASE RECOMMENDATIONS: {phase_recommendations}

        CREATIVE CONSTRAINTS:
        {config['creative_constraints']}

        INSPIRATION: {config['inspiration']}

        Return ONLY a JSON object with this EXACT structure (no markdown, no extra text):
        {{
            "title": "{config['title_style']} creative name",
            "description": "Compelling 1-2 sentence description that sells the dish",
            "prep_time": {config['time_range']['prep_min']}-{config['time_range']['prep_max']},
            "cook_time": {config['time_range']['cook_min']}-{config['time_range']['cook_max']},
            "servings": {config['servings']},
            "ingredients": [
                {{"item": "ingredient name", "amount": "specific amount", "notes": "preparation note"}}
            ],
            "instructions": [
                "Detailed step with specific technique",
                "Next step with cooking tip",
                "Final step with presentation"
            ],
            "nutrition": {{
                "calories": 300-600,
                "protein": 15-40,
                "carbs": 20-60,
                "fat": 8-25
            }},
            "tags": ["{config['primary_tag']}", "{config['secondary_tag']}", "{config['style_tag']}"],
            "difficulty": "{config['difficulty']}",
            "chef_tips": [
                "Professional cooking tip",
                "Flavor enhancement suggestion"
            ]
        }}"""

        try:
            logger.info(f"🎨 Gerando opção de receita ({config['style_description']}) {i+1} com GPT-4o...")
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Create an incredibly {config['creativity_level']} {preferences['meal_type']} recipe that's {config['style_description']} using: {', '.join(ingredients_list)}. Make it unique, memorable, and exactly what someone craving {config['mood']} would want!"}
                ],
                max_tokens=1500,
                temperature=config["temperature"]
            )
            ai_response = response.choices[0].message.content.strip()

            if ai_response.startswith('```json'):
                ai_response = ai_response.replace('```json', '').replace('```', '').strip()

            recipe_data = json.loads(ai_response)
            recipe_data = enhance_recipe_data(recipe_data, config, ingredients_list)
            recipes.append(recipe_data)

            logger.info(f"✅ Receita ({config['style_description']}) gerada com sucesso via GPT-4o")

        except Exception as e:
            logger.error(f"❌ Erro ao gerar receita {i+1}: {str(e)}")
            fallback_recipe = create_fallback_recipe(config, ingredients_list, i)
            recipes.append(fallback_recipe)

    return recipes

def create_creative_recipe_configs(preferences, count):
    """Cria configurações diversas de receita conforme preferências"""
    base_configs = [
        {
            "creativity_level": "innovative fusion",
            "style_description": "bold and inventive",
            "mood": "adventurous and exciting",
            "cuisine_expertise": "fusion cooking and molecular gastronomy",
            "primary_tag": "fusion",
            "secondary_tag": "innovative",
            "style_tag": "gourmet",
            "temperature": 0.9,
            "difficulty": "intermediate"
        },
        {
            "creativity_level": "comfort-elevated",
            "style_description": "familiar yet sophisticated",
            "mood": "cozy and satisfying",
            "cuisine_expertise": "comfort food elevation and home cooking",
            "primary_tag": "comfort",
            "secondary_tag": "elevated",
            "style_tag": "homestyle",
            "temperature": 0.7,
            "difficulty": "beginner"
        },
        {
            "creativity_level": "health-focused artistry",
            "style_description": "nutritious and beautiful",
            "mood": "energized and nourished",
            "cuisine_expertise": "nutritional science and plant-based cuisine",
            "primary_tag": "healthy",
            "secondary_tag": "artistic",
            "style_tag": "wellness",
            "temperature": 0.8,
            "difficulty": "intermediate"
        }
    ]

    for i, config in enumerate(base_configs[:count]):
        config.update(customize_for_preferences(config, preferences, i))

    return base_configs[:count]

def customize_for_preferences(config, preferences, index):
    """Ajusta cada configuração conforme preferências do usuário"""
    customizations = {}

    # Tipo de refeição
    if preferences['meal_type'] == 'breakfast':
        customizations.update({
            'meal_context': 'perfect for starting the day with energy',
            'title_style': 'Morning Glory',
            'servings': 1 + index,
            'time_range': {'prep_min': 5, 'prep_max': 15, 'cook_min': 10, 'cook_max': 20},
            'inspiration': 'Think energizing breakfast bowls, artisanal toast, gourmet pancakes'
        })
    elif preferences['meal_type'] == 'lunch':
        customizations.update({
            'meal_context': 'ideal for a satisfying midday meal',
            'title_style': 'Midday Masterpiece',
            'servings': 2 + index,
            'time_range': {'prep_min': 15, 'prep_max': 25, 'cook_min': 20, 'cook_max': 35},
            'inspiration': 'Think power bowls, gourmet salads, hearty soups, creative wraps'
        })
    elif preferences['meal_type'] == 'dinner':
        customizations.update({
            'meal_context': 'perfect for an impressive evening meal',
            'title_style': 'Evening Elegance',
            'servings': 2 + index,
            'time_range': {'prep_min': 20, 'prep_max': 40, 'cook_min': 30, 'cook_max': 60},
            'inspiration': 'Think restaurant-quality mains, sophisticated flavors, impressive presentation'
        })
    elif preferences['meal_type'] == 'snack':
        customizations.update({
            'meal_context': 'great for a quick and tasty bite',
            'title_style': 'Snack Attack',
            'servings': 1,
            'time_range': {'prep_min': 5, 'prep_max': 10, 'cook_min': 0, 'cook_max': 15},
            'inspiration': 'Think elevated finger foods, healthy bites, creative small plates'
        })
    else:
        customizations.update({
            'meal_context': 'versatile for any time of day',
            'title_style': 'Anytime Delight',
            'servings': 2,
            'time_range': {'prep_min': 10, 'prep_max': 20, 'cook_min': 15, 'cook_max': 30},
            'inspiration': 'Think flexible dishes that work for multiple occasions'
        })

    # Temperatura
    if preferences['temperature'] == 'cold':
        customizations['creative_constraints'] = 'Must be served cold or at room temperature. Focus on fresh, crisp textures and bright flavors.'
        if config['primary_tag'] == 'fusion':
            customizations['inspiration'] += ', cold fusion bowls, gazpacho variations'
    elif preferences['temperature'] == 'hot':
        customizations['creative_constraints'] = 'Must be served hot with warming spices and techniques. Focus on comfort and heat.'
        if config['primary_tag'] == 'comfort':
            customizations['inspiration'] += ', hot skillets, warming stews, seared proteins'
    elif preferences['temperature'] == 'fresh':
        customizations['creative_constraints'] = 'Emphasize fresh, raw, or lightly cooked ingredients. Highlight natural flavors.'
        customizations['inspiration'] += ', fresh salads, ceviche-style preparations, raw elements'
    else:
        customizations['creative_constraints'] = 'Balance of temperatures and textures allowed.'

    # Tempo de preparo
    if preferences['cooking_time'] == 'ultra-quick':
        customizations['time_range'] = {
            'prep_min': 0,
            'prep_max': 5,
            'cook_min': 0,
            'cook_max': 5
        }
        customizations['difficulty'] = 'beginner'
    elif preferences['cooking_time'] == 'quick':
        customizations['time_range'] = {
            'prep_min': max(5, customizations.get('time_range', {}).get('prep_min', 10) - 5),
            'prep_max': max(10, customizations.get('time_range', {}).get('prep_max', 15) - 5),
            'cook_min': max(0, customizations.get('time_range', {}).get('cook_min', 15) - 10),
            'cook_max': max(15, customizations.get('time_range', {}).get('cook_max', 25) - 10)
        }
        customizations['difficulty'] = 'beginner'
    elif preferences['cooking_time'] == 'elaborate':
        customizations['time_range'] = {
            'prep_min': customizations.get('time_range', {}).get('prep_min', 15) + 10,
            'prep_max': customizations.get('time_range', {}).get('prep_max', 25) + 15,
            'cook_min': customizations.get('time_range', {}).get('cook_min', 20) + 15,
            'cook_max': customizations.get('time_range', {}).get('cook_max', 35) + 25
        }
        customizations['difficulty'] = 'advanced'

    # Estilo culinário
    if preferences['cuisine_style'] != 'any':
        if preferences['cuisine_style'] == 'traditional':
            customizations['cuisine_expertise'] = 'traditional Portuguese cuisine'
            customizations['inspiration'] += ', classics like bacalhau \u00e0 br\u00e1s and caldo verde'
        else:
            customizations['cuisine_expertise'] = f"{preferences['cuisine_style']} cuisine mastery"
        customizations['style_tag'] = preferences['cuisine_style']

    return customizations

def enhance_recipe_data(recipe_data, config, ingredients_list):
    """Garante campos obrigatórios e inclui defaults, se necessário"""
    enhanced = {
        'title': recipe_data.get('title', f"Creative {config['style_description'].title()} Dish"),
        'description': recipe_data.get('description', f"A {config['style_description']} creation with your ingredients"),
        'prep_time': recipe_data.get('prep_time', config['time_range']['prep_min']),
        'cook_time': recipe_data.get('cook_time', config['time_range']['cook_min']),
        'servings': recipe_data.get('servings', config['servings']),
        'ingredients': recipe_data.get('ingredients', [
            {"item": ingredient, "amount": "as needed", "notes": ""}
            for ingredient in ingredients_list[:6]
        ]),
        'instructions': recipe_data.get('instructions', [
            "Prepare all ingredients according to notes",
            f"Create your {config['style_description']} masterpiece",
            "Plate beautifully and serve immediately"
        ]),
        'nutrition': recipe_data.get('nutrition', {
            'calories': 350, 'protein': 20, 'carbs': 30, 'fat': 15
        }),
        'tags': recipe_data.get('tags', [config['primary_tag'], config['secondary_tag']]),
        'difficulty': recipe_data.get('difficulty', config['difficulty']),
        'chef_tips': recipe_data.get('chef_tips', [
            f"This {config['style_description']} approach enhances natural flavors",
            "Taste and adjust seasoning throughout cooking"
        ]),
        'image_url': recipe_data.get('image_url', None)  # caso a IA já retorne alguma URL
    }
    return enhanced

def create_fallback_recipe(config, ingredients_list, index):
    """Gera receita fallback caso o AI falhe"""
    return {
        "title": f"{config['title_style']} {config['creativity_level'].title()} Bowl {index + 1}",
        "description": f"A {config['style_description']} creation featuring your fresh ingredients with {config['mood']} vibes",
        "prep_time": config['time_range']['prep_min'] + index * 2,
        "cook_time": config['time_range']['cook_min'] + index * 5,
        "servings": config['servings'],
        "ingredients": [
            {"item": ingredient, "amount": "1 cup" if i == 0 else "1/2 cup", "notes": f"diced" if i < 2 else "chopped"}
            for i, ingredient in enumerate(ingredients_list[:5])
        ],
        "instructions": [
            f"Prepare all ingredients with {config['creativity_level']} flair",
            f"Combine using {config['style_description']} techniques",
            f"Season to achieve that {config['mood']} taste",
            "Present beautifully and enjoy your creation!"
        ],
        "nutrition": {
            "calories": 350 + index * 30,
            "protein": 20 + index * 3,
            "carbs": 25 + index * 5,
            "fat": 12 + index * 2
        },
        "tags": [config['primary_tag'], config['secondary_tag'], config['style_tag']],
        "difficulty": config['difficulty'],
        "chef_tips": [
            f"The key to this {config['style_description']} dish is balancing flavors",
            f"Perfect for when you want something {config['mood']}"
        ],
        "image_url": None  # sem imagem de fallback
    }

def get_menstrual_phase(user_id):
    try:
        latest_cycle = MenstrualCycle.query.filter_by(user_id=user_id).order_by(MenstrualCycle.created_at.desc()).first()
        if not latest_cycle:
            return "follicular"

        today = datetime.now().date()
        cycle_start = latest_cycle.cycle_start_date
        days_since_start = (today - cycle_start).days % latest_cycle.cycle_length

        if days_since_start <= latest_cycle.period_length:
            return "menstrual"
        elif days_since_start <= 13:
            return "follicular"
        elif days_since_start <= 15:
            return "ovulation"
        else:
            return "luteal"
    except Exception as e:
        logger.error(f"Erro ao obter fase menstrual: {str(e)}")
        return "follicular"

def get_phase_nutrition_recommendations(phase):
    recommendations = {
        "menstrual": {
            "focus_foods": ["iron-rich leafy greens", "quinoa", "lentils", "citrus fruits"],
            "limit_foods": ["excess caffeine", "processed foods", "high sodium"],
            "hydration": "2.5L water daily, herbal teas recommended",
            "supplements": ["iron", "vitamin C", "magnesium"]
        },
        "follicular": {
            "focus_foods": ["complex carbohydrates", "lean proteins", "fresh vegetables"],
            "limit_foods": ["simple sugars", "refined carbs"],
            "hydration": "2L water daily",
            "supplements": ["B vitamins", "probiotics"]
        },
        "ovulation": {
            "focus_foods": ["healthy fats", "antioxidant-rich foods", "omega-3 sources"],
            "limit_foods": ["inflammatory foods", "excess sugar"],
            "hydration": "2.5L water daily",
            "supplements": ["vitamin E", "zinc"]
        },
        "luteal": {
            "focus_foods": ["magnesium-rich foods", "complex carbs", "calcium sources"],
            "limit_foods": ["caffeine", "alcohol", "salty foods"],
            "hydration": "3L water daily to reduce bloating",
            "supplements": ["magnesium", "calcium", "vitamin D"]
        }
    }
    return recommendations.get(phase, recommendations["follicular"])

# =============================================================================
# 🎨 IMAGE PROCESSING (pode usar futuramente para gerar miniaturas)
# =============================================================================
def process_image(image_stream):
    image = Image.open(image_stream)
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(1.2)
    image = image.filter(ImageFilter.SHARPEN)
    buffer = io.BytesIO()
    image.save(buffer, format='JPEG')
    return buffer.getvalue()

# =============================================================================
# 🌐 ROTAS DA API
# =============================================================================
@app.before_request
def log_request_info():
    if request.endpoint and not request.endpoint.startswith('static'):
        logger.info(f"🌐 {request.method} {request.path} - Session: {dict(session)}")

@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin in ['http://localhost:3000', 'http://127.0.0.1:3000']:
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# ------------------------
# REGISTRO
# ------------------------
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        logger.info(f"📝 Tentativa de registro para: {data.get('email', 'unknown')}")

        required_fields = ['username', 'email', 'password', 'age', 'current_weight', 'target_weight', 'height', 'gender']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo obrigatório ausente: {field}'}), 400

        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email já cadastrado'}), 400
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username já em uso'}), 400

        user = User(
            username=data['username'],
            email=data['email'],
            password_hash=generate_password_hash(data['password']),
            age=data['age'],
            gender=data['gender'],
            height=data['height'],
            current_weight=data['current_weight'],
            target_weight=data['target_weight'],
            activity_level=data.get('activity_level', 'light'),  # ← ADICIONADO
            metabolic_age=data.get('age', 25),
            predicted_weight_in_6months=data.get('current_weight', 70),
            profile_photo=None
        )
        db.session.add(user)
        db.session.commit()

        session.permanent = False
        session['user_id'] = user.id
        logger.info(f"✅ Usuário {user.id} registrado e logado. Session: {dict(session)}")

        challenge_data = generate_personalized_challenge(user)
        challenge = Challenge(**challenge_data)
        db.session.add(challenge)
        db.session.commit()

        user_challenge = UserChallenge(user_id=user.id, challenge_id=challenge.id)
        db.session.add(user_challenge)
        db.session.commit()

        return jsonify({
            'message': 'Registro bem-sucedido',
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
        logger.error(f"❌ Erro no registro: {str(e)}")
        return jsonify({'error': f'Falha no registro: {str(e)}'}), 500

# ------------------------
# LOGIN
# ------------------------
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        logger.info(f"🔐 Tentativa de login para: {data.get('email', 'unknown')}")

        # Usuário demo
        if data.get('email') == 'demo@nutrivision.com' and data.get('password') == 'password123':
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
            session.permanent = False
            session['user_id'] = demo_user.id
            return jsonify({
                'message': 'Login demo bem-sucedido',
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

        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400

        user = User.query.filter_by(email=data['email']).first()
        if not user or not check_password_hash(user.password_hash, data['password']):
            logger.warning(f"❌ Login inválido para: {data.get('email')}")
            return jsonify({'error': 'Credenciais inválidas'}), 401

        session.permanent = False
        session['user_id'] = user.id
        user.last_activity = datetime.utcnow()
        db.session.commit()
        logger.info(f"✅ Usuário {user.id} logado com sucesso. Session: {dict(session)}")

        return jsonify({
            'message': 'Login bem-sucedido',
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

    except Exception as e:
        logger.error(f"❌ Erro no login: {str(e)}")
        return jsonify({'error': f'Falha no login: {str(e)}'}), 500

# ------------------------
# LOGOUT
# ------------------------
@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logout bem-sucedido'}), 200

# ------------------------
# HEALTH CHECK
# ------------------------
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'OK',
        'message': 'NutriVision Pro Revolutionary API',
        'version': '2.0.1',
        'timestamp': datetime.utcnow().isoformat(),
        'features': [
            'Advanced AI Analysis',
            'Food DNA Profiling',
            'Predictive Insights',
            'Revolutionary Gamification',
            'Anonymous Social Feed',
            'Personalized Challenges',
            'Ingredient Validation',
            'Multiple Recipe Generation',
            'Daily Meal Logging',
            'Image-based Ingredient Detection'
        ]
    }), 200

# ------------------------
# ESTATÍSTICAS AVANÇADAS DO USUÁRIO
# ------------------------
@app.route('/api/user/stats-advanced', methods=['GET'])
def get_advanced_user_stats():
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Autenticação necessária'}), 401

        total_analyses = len(user.meal_analyses)
        food_memories = FoodMemory.query.filter_by(user_id=user.id).all()
        active_challenges = UserChallenge.query.filter_by(user_id=user.id, status='active').count()

        personality_insights = {}
        if user.dna_food_profile:
            personality_insights = json.loads(user.dna_food_profile)

        recent_analyses = user.meal_analyses[-7:]
        recent_avg_score = sum(a.health_score for a in recent_analyses if a.health_score) / max(len(recent_analyses), 1)

        user_badges = db.session.query(UserBadge, Badge).join(Badge, UserBadge.badge_id == Badge.id).filter(UserBadge.user_id == user.id).all()
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
            'recent_badges': badges_data[-3:],
            'achievement_progress': {
                'next_level_xp': calculate_next_level_xp(user.total_xp),
                'completion_percentage': calculate_profile_completion(user)
            }
        }), 200

    except Exception as e:
        return jsonify({'error': f'Stats error: {str(e)}'}), 500

# ------------------------
# ANÁLISE AVANÇADA DE REFEIÇÃO (UPLOAD DE IMAGEM)
# ------------------------
@app.route('/api/analyze-revolutionary', methods=['POST'])
def analyze_meal_revolutionary():
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Autenticação necessária'}), 401

        if 'image' not in request.files:
            return jsonify({'error': 'Imagem obrigatória'}), 400

        image_file = request.files['image']
        meal_type = request.form.get('meal_type', 'unknown')
        mood_before = request.form.get('mood_before', 'neutral')
        social_context = request.form.get('social_context', 'alone')

        image = Image.open(image_file.stream)
        image_filename = f"{uuid.uuid4()}.jpg"
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
        image.save(image_path)

        buffer = io.BytesIO()
        image.save(buffer, format='JPEG')
        image_base64 = base64.b64encode(buffer.getvalue()).decode()

        if not is_food_image(image_base64):
            return jsonify({'error': 'The image you inserted is not food related.'}), 400

        user_context = {
            'age': user.age,
            'gender': user.gender,
            'current_weight': user.current_weight,
            'target_weight': user.target_weight,
            'activity_level': user.activity_level,
            'eating_patterns': f"Analyzed {len(user.meal_analyses)} meals"
        }

        logger.info("🤖 Chamando Revolutionary AI Analysis...")
        ai_response = call_advanced_food_ai(image_base64, user_context)

        try:
            ai_data = json.loads(ai_response) if ai_response.startswith('{') else get_revolutionary_mock_analysis()
        except:
            ai_data = get_revolutionary_mock_analysis()

        nutrition = ai_data.get('nutrition', {})
        revolutionary = ai_data.get('revolutionary_analysis', {})
        health = ai_data.get('health_assessment', {})

        calories = nutrition.get('calories', 0)
        protein = nutrition.get('protein', 0)
        carbs = nutrition.get('carbs', 0)
        fat = nutrition.get('fat', 0)
        fiber = nutrition.get('fiber', 0)
        try:
            calories = int(calories)
            protein = float(protein)
            carbs = float(carbs)
            fat = float(fat)
            fiber = float(fiber)
        except:
            calories, protein, carbs, fat, fiber = 0, 0.0, 0.0, 0.0, 0.0

        emotional_score = revolutionary.get('emotional_score', 5.0)
        addiction_risk = revolutionary.get('addiction_potential', 3.0)
        satisfaction_pred = revolutionary.get('satisfaction_prediction', 7.0)
        sleep_impact = revolutionary.get('sleep_impact', 0.0)
        weight_impact = revolutionary.get('weight_impact_weekly', 0.0)
        try:
            emotional_score = float(emotional_score)
            addiction_risk = float(addiction_risk)
            satisfaction_pred = float(satisfaction_pred)
            sleep_impact = float(sleep_impact)
            weight_impact = float(weight_impact)
        except:
            emotional_score, addiction_risk, satisfaction_pred, sleep_impact, weight_impact = 5.0, 3.0, 7.0, 0.0, 0.0

        health_score = health.get('score', 5.0)
        try:
            health_score = float(health_score)
        except:
            health_score = 5.0

        # Use the health assessment score as the satisfaction prediction
        satisfaction_pred = health_score

        meal_analysis = MealAnalysis(
            user_id=user.id,
            image_path=image_path,
            foods_detected=json.dumps(ai_data.get('foods_detected', [])),
            total_calories=calories,
            protein=protein,
            carbs=carbs,
            fat=fat,
            fiber=fiber,
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
            health_score=health_score,
            obesity_risk=health.get('obesity_risk', 'moderate'),
            ai_feedback=ai_data.get('ai_insights', 'Analysis completed'),
            suggestions=json.dumps(ai_data.get('suggestions', [])),
            meal_type=meal_type
        )
        db.session.add(meal_analysis)

        # Atualiza XP e streak
        user.total_xp += 50
        user.level = calculate_advanced_level(user.total_xp)
        now = datetime.utcnow()
        yesterday = now - timedelta(days=1)
        if user.last_activity and user.last_activity.date() == yesterday.date():
            user.streak_days += 1
        elif not user.last_activity or user.last_activity.date() != now.date():
            user.streak_days = 1
        user.last_activity = now

        if len(user.meal_analyses) >= 4 and not user.dna_food_profile:
            dna_profile = generate_food_dna_profile(user.meal_analyses)
            user.dna_food_profile = json.dumps(dna_profile)

        db.session.commit()

        new_badges = check_revolutionary_badges(user)
        update_food_memories(user.id, ai_data.get('foods_detected', []), meal_analysis)

        foods = ai_data.get('foods_detected', [])
        suggested_title = generate_meal_title(", ".join(foods)) if foods else None

        return jsonify({
            'analysis': {
                'title': suggested_title,
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
        logger.error(f"Revolutionary analysis error: {str(e)}")
        return jsonify({'error': f'Falha na análise: {str(e)}'}), 500

def update_food_memories(user_id, foods, analysis):
    for food in foods:
        memory = FoodMemory.query.filter_by(user_id=user_id, food_name=food).first()
        if memory:
            memory.times_eaten += 1
            memory.last_eaten = datetime.utcnow()
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

# ------------------------
# NOVA ROTA: DETECTAR INGREDIENTES VIA IMAGEM (POST)
# ------------------------
@app.route('/api/detect-ingredients', methods=['POST'])
def detect_ingredients():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    if 'image' not in request.files:
        return jsonify({'error': 'Nenhuma imagem enviada'}), 400

    try:
        # Ler a imagem e converter para base64
        img_file = request.files['image']
        img = Image.open(img_file.stream)
        buf = io.BytesIO()
        img.save(buf, format='JPEG')
        img_base64 = base64.b64encode(buf.getvalue()).decode()

        # Chamar o helper que fala com o GPT-4o
        ingredientes = detect_ingredients_from_image(img_base64)

        return jsonify({'detected_ingredients': ingredientes}), 200

    except Exception as e:
        logger.error(f"Erro no endpoint /api/detect-ingredients: {str(e)}")
        return jsonify({'error': f'Falha ao detectar ingredientes: {str(e)}'}), 500

# ------------------------
# GERAÇÃO DE RECEITA (POST) – ATUALIZADO PARA ACEITAR IMAGEM + TEXTO
# ------------------------
@app.route('/api/recipe-generation', methods=['POST'])
def generate_recipe_endpoint():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    try:
        # Detectamos ingredientes da imagem, se houver
        image_ingredients = []
        if 'image' in request.files:
            img_file = request.files['image']
            img = Image.open(img_file.stream)
            buf = io.BytesIO()
            img.save(buf, format='JPEG')
            img_base64 = base64.b64encode(buf.getvalue()).decode()
            image_ingredients = detect_ingredients_from_image(img_base64)

            if not is_food_image(img_base64):
                return jsonify({'error': 'The image you inserted is not food related.'}), 400

            image_ingredients = detect_ingredients_from_image(img_base64)

        # Agora lemos os parâmetros restantes
        if request.is_json:
            data = request.get_json()
        else:
            raw = request.form.get('payload')
            data = json.loads(raw) if raw else {}

        # Ingredientes texto + preferências
        ingredients_text = data.get('ingredients', '')  # ex.: "tomato, cheese, bread"
        meal_type = data.get('meal_type', 'any')
        temperature_pref = data.get('temperature', 'any')
        cooking_time = data.get('cooking_time', 'medium')
        cuisine_style = data.get('cuisine_style', 'any')
        dietary_pref = data.get('dietary_pref', 'none')

        # Validação básica: pelo menos um método de entrada
        if not ingredients_text and not image_ingredients:
            return jsonify({'error': 'Envie pelo menos 1 ingrediente (por texto ou imagem)'}), 400

        # Combinar listas e evitar duplicados
        ingredients_list = []
        if ingredients_text:
            ingredients_list = [i.strip() for i in ingredients_text.split(',') if i.strip()]
        for it in image_ingredients:
            if it not in ingredients_list:
                ingredients_list.append(it)

        # Precisamos de pelo menos 2 ingredientes
        if len(ingredients_list) < 2:
            return jsonify({'error': 'É necessário pelo menos 2 ingredientes (texto ou imagem)' }), 400

        # Validação flexível de ingredientes
        validation_result = validate_ingredients(ingredients_list, strict=False)
        if validation_result['invalid_items']:
            logger.warning(
                f"Ingredientes possivelmente inválidos: {validation_result['invalid_items']}"
            )

        # Usa o GPT para filtrar itens não alimentares
        filtered = ai_filter_food_items(validation_result['valid_items'])
        translated_ingredients = translate_ingredients_to_english(filtered)

        preferences = {
            'meal_type': meal_type,
            'temperature': temperature_pref,
            'cooking_time': cooking_time,
            'cuisine_style': cuisine_style,
            'dietary_pref': dietary_pref
        }

        recipe_options = generate_highly_personalized_recipes(
            user, translated_ingredients, preferences, count=3
        )

        # Garante imagem para cada opção gerada
        for opt in recipe_options:
            if not opt.get('image_url'):
                prompt = f"{opt['title']} plated meal, professional food photography"
                opt['image_url'] = generate_recipe_image_url(prompt)

        return jsonify({
            'detected_from_image': image_ingredients,
            'validation_result': validation_result,
            'recipe_options': recipe_options,
            'personalization_applied': preferences
        }), 201

    except Exception as e:
        logger.error(f"❌ Erro na geração de receita: {str(e)}")
        db.session.rollback()
        return jsonify({'error': f'Falha ao gerar receita: {str(e)}'}), 500

# ------------------------
# SALVAR RECEITA (POST)
# ------------------------
@app.route('/api/recipes', methods=['POST'])
def save_recipe():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    data = request.get_json() or {}
    title = data.get('title')
    if not title:
        return jsonify({'error': 'Título é obrigatório'}), 400

    try:
        image_url = data.get('image_url')
        if not image_url:
            prompt = f"{title} plated meal, professional food photography"
            image_url = generate_recipe_image_url(prompt)

        recipe_saved = RecipeCollection(
            user_id=user.id,
            title=title,
            description=data.get('description', ''),
            ingredients=json.dumps(data.get('ingredients', [])),
            instructions=json.dumps(data.get('instructions', [])),
            prep_time=data.get('prep_time', 0),
            cook_time=data.get('cook_time', 0),
            servings=data.get('servings', 1),
            calories_per_serving=data.get('nutrition', {}).get('calories', 0),
            protein_per_serving=data.get('nutrition', {}).get('protein', 0),
            carbs_per_serving=data.get('nutrition', {}).get('carbs', 0),
            fat_per_serving=data.get('nutrition', {}).get('fat', 0),
            category=data.get('category', 'ai-generated'),
            difficulty=data.get('difficulty', 'beginner'),
            tags=json.dumps(data.get('tags', [])),
            matches_dna=data.get('matches_dna', False),
            personalization_score=data.get('personalization_score', 0.0),
            image_url=image_url
        )
        db.session.add(recipe_saved)
        db.session.commit()
        logger.info(f"✅ Receita salva para o usuário {user.id}: {recipe_saved.id}")
        return jsonify({'recipe_id': recipe_saved.id}), 201
    except Exception as e:
        logger.error(f"❌ Erro ao salvar receita: {str(e)}")
        db.session.rollback()
        return jsonify({'error': f'Falha ao salvar receita: {str(e)}'}), 500

# ------------------------
# LISTAR RECEITAS DO USUÁRIO (GET)
# ------------------------
@app.route('/api/recipes', methods=['GET'])
def get_user_recipes():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    try:
        category = request.args.get('category', 'all')
        query = RecipeCollection.query.filter_by(user_id=user.id)
        if category != 'all':
            query = query.filter_by(category=category)

        recipes = query.order_by(RecipeCollection.created_at.desc()).all()
        recipes_data = []
        for recipe in recipes:
            if not recipe.image_url:
                prompt = f"{recipe.title} plated meal, professional food photography"
                recipe.image_url = generate_recipe_image_url(prompt)
                db.session.commit()
            recipes_data.append({
                'id': recipe.id,
                'title': recipe.title,
                'description': recipe.description,
                'prep_time': recipe.prep_time,
                'cook_time': recipe.cook_time,
                'servings': recipe.servings,
                'calories_per_serving': recipe.calories_per_serving,
                'protein_per_serving': recipe.protein_per_serving,
                'carbs_per_serving': recipe.carbs_per_serving,
                'fat_per_serving': recipe.fat_per_serving,
                'category': recipe.category,
                'difficulty': recipe.difficulty,
                'tags': json.loads(recipe.tags or '[]'),
                # ← Aqui adicionamos a linha “image_url”
                'image_url': recipe.image_url,
                'matches_dna': recipe.matches_dna,
                'personalization_score': recipe.personalization_score,
                'created_at': recipe.created_at.isoformat()
            })
        return jsonify({'recipes': recipes_data, 'total_count': len(recipes_data)}), 200

    except Exception as e:
        logger.error(f"❌ Erro ao obter receitas: {str(e)}")
        return jsonify({'error': f'Failed to get recipes: {str(e)}'}), 500

# ------------------------
# DETALHES DE UMA RECEITA (GET)
# ------------------------
# ------------------------
# DETALHES DE UMA RECEITA (GET)
# ------------------------
@app.route('/api/recipes/<int:recipe_id>', methods=['GET'])
def get_recipe_details(recipe_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    try:
        recipe = RecipeCollection.query.filter_by(id=recipe_id, user_id=user.id).first()
        if not recipe:
            return jsonify({'error': 'Receita não encontrada'}), 404

        if not recipe.image_url:
            prompt = f"{recipe.title} plated meal, professional food photography"
            recipe.image_url = generate_recipe_image_url(prompt)
            db.session.commit()

        recipe_data = {
            'id': recipe.id,
            'title': recipe.title,
            'description': recipe.description,
            'ingredients': json.loads(recipe.ingredients or '[]'),
            'instructions': json.loads(recipe.instructions or '[]'),
            'prep_time': recipe.prep_time,
            'cook_time': recipe.cook_time,
            'servings': recipe.servings,
            'nutrition': {
                'calories': recipe.calories_per_serving,
                'protein': recipe.protein_per_serving,
                'carbs': recipe.carbs_per_serving,
                'fat': recipe.fat_per_serving
            },
            'category': recipe.category,
            'difficulty': recipe.difficulty,
            'tags': json.loads(recipe.tags or '[]'),
            'matches_dna': recipe.matches_dna,
            'personalization_score': recipe.personalization_score,
            # ← Aqui também incluímos “image_url” nos detalhes
            'image_url': recipe.image_url,
            'created_at': recipe.created_at.isoformat()
        }
        return jsonify({'recipe': recipe_data}), 200

    except Exception as e:
        logger.error(f"❌ Erro nos detalhes da receita: {str(e)}")
        return jsonify({'error': f'Failed to get recipe details: {str(e)}'}), 500

# ------------------------
# EXCLUIR RECEITA (DELETE)
# ------------------------
@app.route('/api/recipes/<int:recipe_id>', methods=['DELETE'])
def delete_recipe(recipe_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    try:
        recipe = RecipeCollection.query.filter_by(id=recipe_id, user_id=user.id).first()
        if not recipe:
            return jsonify({'error': 'Receita não encontrada'}), 404

        db.session.delete(recipe)
        db.session.commit()
        logger.info(f"🗑️ Receita {recipe_id} deletada para usuário {user.id}")
        return jsonify({'message': 'Receita excluída com sucesso'}), 200

    except Exception as e:
        logger.error(f"❌ Erro ao excluir receita: {str(e)}")
        return jsonify({'error': f'Failed to delete recipe: {str(e)}'}), 500

# ------------------------
# CICLO MENSTRUAL – GET
# ------------------------
@app.route('/api/menstrual-cycle', methods=['GET'])
def get_menstrual_cycle():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    if user.gender != 'female':
        return jsonify({'error': 'Funcionalidade apenas para usuárias'}), 403

    try:
        latest_cycle = MenstrualCycle.query.filter_by(user_id=user.id).order_by(MenstrualCycle.created_at.desc()).first()
        if not latest_cycle:
            latest_cycle = MenstrualCycle(
                user_id=user.id,
                cycle_start_date=datetime.now().date(),
                current_phase='follicular'
            )
            db.session.add(latest_cycle)
            db.session.commit()

        current_phase = get_menstrual_phase(user.id)
        recommendations = get_phase_nutrition_recommendations(current_phase)

        today = datetime.now().date()
        cycle_day = (today - latest_cycle.cycle_start_date).days % latest_cycle.cycle_length + 1

        cycle_data = {
            'current_phase': current_phase,
            'cycle_day': cycle_day,
            'cycle_length': latest_cycle.cycle_length,
            'period_length': latest_cycle.period_length,
            'cycle_start_date': latest_cycle.cycle_start_date.isoformat(),
            'recommendations': recommendations,
            'symptoms': json.loads(latest_cycle.symptoms or '[]'),
            'energy_level': latest_cycle.energy_level,
            'mood': latest_cycle.mood,
            'cravings': json.loads(latest_cycle.cravings or '[]')
        }
        return jsonify({'cycle_data': cycle_data}), 200

    except Exception as e:
        logger.error(f"❌ Erro no ciclo menstrual: {str(e)}")
        return jsonify({'error': f'Failed to get cycle data: {str(e)}'}), 500

# ------------------------
# CICLO MENSTRUAL – LOG (POST)
# ------------------------
@app.route('/api/menstrual-cycle/log', methods=['POST'])
def log_menstrual_data():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    if user.gender != 'female':
        return jsonify({'error': 'Funcionalidade apenas para usuárias'}), 403

    try:
        data = request.get_json()
        today = datetime.now().date()
        cycle_entry = MenstrualCycle.query.filter_by(user_id=user.id).filter(MenstrualCycle.cycle_start_date <= today).order_by(MenstrualCycle.created_at.desc()).first()

        if not cycle_entry:
            cycle_entry = MenstrualCycle(
                user_id=user.id,
                cycle_start_date=today,
                current_phase=get_menstrual_phase(user.id)
            )
            db.session.add(cycle_entry)

        if 'symptoms' in data:
            current_symptoms = json.loads(cycle_entry.symptoms or '[]')
            new_symptom = data['symptoms']
            if new_symptom not in current_symptoms:
                current_symptoms.append(new_symptom)
                cycle_entry.symptoms = json.dumps(current_symptoms)

        if 'energy_level' in data:
            cycle_entry.energy_level = data['energy_level']

        if 'mood' in data:
            cycle_entry.mood = data['mood']

        if 'cravings' in data:
            current_cravings = json.loads(cycle_entry.cravings or '[]')
            new_craving = data['cravings']
            if new_craving not in current_cravings:
                current_cravings.append(new_craving)
                cycle_entry.cravings = json.dumps(current_cravings)

        cycle_entry.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Dados do ciclo registrados com sucesso',
            'current_phase': get_menstrual_phase(user.id)
        }), 200

    except Exception as e:
        logger.error(f"❌ Erro ao registrar ciclo: {str(e)}")
        return jsonify({'error': f'Failed to log cycle data: {str(e)}'}), 500

# ------------------------
# PLANO NUTRICIONAL – GET
# ------------------------
@app.route('/api/nutrition-plan', methods=['GET'])
def get_nutrition_plan():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    try:
        active_plan = NutritionPlan.query.filter_by(user_id=user.id, is_active=True).first()
        if not active_plan:
            weight_goal = (user.target_weight - user.current_weight) if (user.target_weight and user.current_weight) else 0
            if weight_goal < -2:
                plan_type = 'weight-loss'
                daily_calories = max(1200, int(user.current_weight * 20) if user.current_weight else 1500)
            elif weight_goal > 2:
                plan_type = 'muscle-gain'
                daily_calories = int(user.current_weight * 25) if user.current_weight else 2000
            else:
                plan_type = 'maintenance'
                daily_calories = int(user.current_weight * 22) if user.current_weight else 1800

            active_plan = NutritionPlan(
                user_id=user.id,
                plan_name=f"{plan_type.replace('-', ' ').title()} Plan",
                plan_type=plan_type,
                start_date=datetime.now().date(),
                daily_calories=daily_calories,
                daily_protein=daily_calories * 0.25 / 4,
                daily_carbs=daily_calories * 0.45 / 4,
                daily_fat=daily_calories * 0.30 / 9,
                meal_distribution=json.dumps({
                    'breakfast': 0.25,
                    'lunch': 0.35,
                    'dinner': 0.30,
                    'snacks': 0.10
                })
            )
            db.session.add(active_plan)
            db.session.commit()

        today = datetime.now().date()
        today_analyses = MealAnalysis.query.filter_by(user_id=user.id).filter(MealAnalysis.created_at >= datetime.combine(today, datetime.min.time())).all()

        total_calories_today = sum(a.total_calories or 0 for a in today_analyses)
        total_protein_today = sum(a.protein or 0 for a in today_analyses)

        plan_data = {
            'plan_name': active_plan.plan_name,
            'plan_type': active_plan.plan_type,
            'daily_targets': {
                'calories': active_plan.daily_calories,
                'protein': active_plan.daily_protein,
                'carbs': active_plan.daily_carbs,
                'fat': active_plan.daily_fat
            },
            'today_progress': {
                'calories_consumed': total_calories_today,
                'protein_consumed': total_protein_today,
                'meals_logged': len(today_analyses)
            },
            'meal_distribution': json.loads(active_plan.meal_distribution or '{}'),
            'start_date': active_plan.start_date.isoformat()
        }
        return jsonify({'nutrition_plan': plan_data}), 200

    except Exception as e:
        logger.error(f"❌ Erro no plano nutricional: {str(e)}")
        return jsonify({'error': f'Failed to get nutrition plan: {str(e)}'}), 500

# ------------------------
# PERFIL DO USUÁRIO (GET)
# ------------------------
@app.route('/api/user-profile', methods=['GET'])
def get_user_profile():
    """Retorna informações básicas do usuário junto com o plano nutricional ativo."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    # ← CÁLCULOS REAIS BMI, BMR, TDEE
    bmi = bmr = tdee = None
    daily_targets = {'calories': 2000, 'protein': 150, 'carbs': 200, 'fat': 70}
    
    if user.height and user.current_weight and user.age:
        try:
            # BMI
            height_m = user.height / 100
            bmi = round(user.current_weight / (height_m ** 2), 1)
            
            # BMR (Mifflin-St Jeor)
            if user.gender == 'female':
                bmr = 10 * user.current_weight + 6.25 * user.height - 5 * user.age - 161
            else:
                bmr = 10 * user.current_weight + 6.25 * user.height - 5 * user.age + 5
            bmr = round(bmr)
            
            # TDEE baseado no nível de atividade
            activity_multipliers = {
                'sedentary': 1.2,
                'light': 1.375,
                'moderate': 1.55,
                'active': 1.725,
                'very_active': 1.9
            }
            multiplier = activity_multipliers.get(user.activity_level or 'light', 1.375)
            tdee = round(bmr * multiplier)
            
            # ← TARGETS AUTOMÁTICOS baseados em objetivos
            goal_calories = tdee
            if user.target_weight and user.current_weight:
                weight_diff = user.target_weight - user.current_weight
                if weight_diff < -2:  # Perder peso
                    goal_calories = round(tdee * 0.85)  # 15% deficit
                elif weight_diff > 2:  # Ganhar peso
                    goal_calories = round(tdee * 1.15)  # 15% surplus
            
            # Macros científicos
            protein_target = round(user.current_weight * 1.8)  # 1.8g/kg
            fat_target = round(goal_calories * 0.25 / 9)       # 25% das calorias
            carbs_remaining = goal_calories - (protein_target * 4) - (fat_target * 9)
            carbs_target = max(round(carbs_remaining / 4), 100)  # Mínimo 100g
            
            daily_targets = {
                'calories': goal_calories,
                'protein': protein_target,
                'carbs': carbs_target,
                'fat': fat_target
            }
        except Exception as e:
            logger.error(f"Erro nos cálculos: {e}")
            bmi = bmr = tdee = None

    # ← PROGRESSO DE HOJE (refeições realmente consumidas)
    today = datetime.now().date()
    today_meals = DailyMeal.query.filter_by(user_id=user.id, date=today).all()
    today_progress = {
        'calories_consumed': sum(m.calories or 0 for m in today_meals),
        'protein_consumed': sum(m.protein or 0 for m in today_meals),
        'carbs_consumed': sum(m.carbs or 0 for m in today_meals),
        'fat_consumed': sum(m.fat or 0 for m in today_meals)
    }

    return jsonify({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'profile_photo': f"/api/images/{user.profile_photo}" if user.profile_photo else None,
            'level': user.level,
            'total_xp': user.total_xp,
            'current_weight': user.current_weight,
            'target_weight': user.target_weight,
            'age': user.age,
            'height': user.height,
            'gender': user.gender,
            'activity_level': user.activity_level,  # ← ADICIONADO
            'streak_days': user.streak_days,
            'badges_earned': len(user.badges)
        },
        'metrics': {
            'bmi': bmi,
            'bmr': bmr,
            'tdee': tdee
        },
        'nutrition_plan': {
            'plan_name': f"Personalized {user.gender.title()} Plan",
            'plan_type': 'weight_loss' if (user.target_weight and user.current_weight and user.target_weight < user.current_weight) else 'maintenance',
            'daily_targets': daily_targets,
            'today_progress': today_progress,
            'meal_distribution': {
                'breakfast': 0.25,
                'lunch': 0.35,
                'dinner': 0.30,
                'snacks': 0.10
            }
        }
    }), 200

@app.route('/api/user-profile', methods=['PUT'])
def update_user_profile():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    data = request.get_json() or {}
    numeric_int = ['age']
    numeric_float = ['height', 'current_weight', 'target_weight']
    
    # ← ADICIONADO: incluir activity_level nos campos aceites
    for field in ['username', 'email', 'age', 'height', 'current_weight', 'target_weight', 'gender', 'activity_level']:
        if field in data:
            value = data[field]
            if value == '' or value is None:
                setattr(user, field, None)
            else:
                try:
                    if field in numeric_int:
                        setattr(user, field, int(value))
                    elif field in numeric_float:
                        setattr(user, field, float(value))
                    else:
                        setattr(user, field, value)
                except (ValueError, TypeError):
                    setattr(user, field, None)
    db.session.commit()
    return jsonify({'message': 'Perfil atualizado'}), 200

@app.route('/api/profile-photo', methods=['POST'])
def upload_profile_photo():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    if 'photo' not in request.files:
        return jsonify({'error': 'Imagem obrigatória'}), 400

    file = request.files['photo']
    filename = f"{uuid.uuid4()}.jpg"
    path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(path)
    user.profile_photo = filename
    db.session.commit()
    return jsonify({'photo_url': f'/api/images/{filename}'}), 200

# ------------------------
# SUGESTÕES DE REFEIÇÃO (GET)
# ------------------------
@app.route('/api/meal-suggestions', methods=['GET'])
def get_meal_suggestions():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    try:
        analyses = MealAnalysis.query.filter_by(user_id=user.id).order_by(MealAnalysis.created_at.desc()).limit(10).all()
        personalities = [a.eating_personality_type for a in analyses if a.eating_personality_type]
        dominant_personality = personalities[0] if personalities else 'Balanced'

        phase_recommendations = {}
        current_phase = None
        if user.gender == 'female':
            current_phase = get_menstrual_phase(user.id)
            phase_recommendations = get_phase_nutrition_recommendations(current_phase)

        suggestions = []
        if dominant_personality == 'Explorer':
            suggestions = [
                {
                    'meal_type': 'breakfast',
                    'title': 'Greek yogurt with berries & granola',
                    'description': 'Perfect for your Explorer personality',
                    'calories': 320,
                    'protein': 20,
                    'reason': 'Variety of textures and flavors'
                },
                {
                    'meal_type': 'lunch',
                    'title': 'Quinoa power bowl with grilled chicken',
                    'description': 'High protein for your goals',
                    'calories': 480,
                    'protein': 35,
                    'reason': 'Combines multiple superfoods'
                }
            ]
        elif dominant_personality == 'Disciplined Optimizer':
            suggestions = [
                {
                    'meal_type': 'breakfast',
                    'title': 'Protein smoothie with spinach',
                    'description': 'Optimized nutrition to start your day',
                    'calories': 280,
                    'protein': 25,
                    'reason': 'Maximum nutrients, minimal calories'
                },
                {
                    'meal_type': 'lunch',
                    'title': 'Grilled salmon with steamed vegetables',
                    'description': 'Perfect macro balance',
                    'calories': 420,
                    'protein': 40,
                    'reason': 'Omega-3s and high-quality protein'
                }
            ]
        else:
            suggestions = [
                {
                    'meal_type': 'breakfast',
                    'title': 'Oatmeal with banana and nuts',
                    'description': 'Balanced nutrition to start your day',
                    'calories': 350,
                    'protein': 12,
                    'reason': 'Steady energy release'
                },
                {
                    'meal_type': 'lunch',
                    'title': 'Grilled chicken salad',
                    'description': 'Light but satisfying',
                    'calories': 420,
                    'protein': 30,
                    'reason': 'Perfect balance of nutrients'
                }
            ]

        if phase_recommendations and current_phase:
            for suggestion in suggestions:
                suggestion['phase_note'] = f"Great for {current_phase} phase"

        return jsonify({
            'suggestions': suggestions,
            'based_on_personality': dominant_personality,
            'menstrual_phase': current_phase
        }), 200

    except Exception as e:
        logger.error(f"❌ Sugestões de refeição error: {str(e)}")
        return jsonify({'error': f'Failed to get meal suggestions: {str(e)}'}), 500

# ------------------------
# HISTÓRICO DE REFEIÇÕES (GET)
# ------------------------
@app.route('/api/meal-history', methods=['GET'])
def get_meal_history():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        analyses = MealAnalysis.query.filter_by(user_id=user.id).order_by(MealAnalysis.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

        history_data = []
        for analysis in analyses.items:
            # Gerar URL da imagem se existir
            image_url = None
            if analysis.image_path and os.path.exists(analysis.image_path):
                # Assumindo que você tem um endpoint para servir imagens
                image_url = f"/api/images/{os.path.basename(analysis.image_path)}"
            
            history_data.append({
                'id': analysis.id,
                'foods_detected': json.loads(analysis.foods_detected or '[]'),
                'total_calories': analysis.total_calories,
                'protein': analysis.protein,
                'carbs': analysis.carbs,
                'fat': analysis.fat,
                'health_score': analysis.health_score,
                'eating_personality_type': analysis.eating_personality_type,
                'predicted_satisfaction': analysis.predicted_satisfaction,
                'weight_impact_prediction': analysis.weight_impact_prediction,
                'meal_type': analysis.meal_type,
                'created_at': analysis.created_at.isoformat(),
                'image_url': image_url,  # ADICIONADO
                'ai_feedback': analysis.ai_feedback,  # ADICIONADO
                'suggestions': analysis.suggestions  # ADICIONADO
            })

        return jsonify({
            'history': history_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': analyses.total,
                'pages': analyses.pages,
                'has_next': analyses.has_next,
                'has_prev': analyses.has_prev
            }
        }), 200

    except Exception as e:
        logger.error(f"❌ Erro no histórico de refeições: {str(e)}")
        return jsonify({'error': f'Failed to get meal history: {str(e)}'}), 500

# ------------------------
# REMOVER HISTÓRICO DE REFEIÇÃO (DELETE)
# ------------------------
@app.route('/api/meal-history/<int:analysis_id>', methods=['DELETE'])
def delete_meal_history(analysis_id):
    """Remove um registro de análise de refeição."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    try:
        analysis = MealAnalysis.query.get_or_404(analysis_id)
        if analysis.user_id != user.id:
            return jsonify({'error': 'Não autorizado'}), 403

        if analysis.image_path and os.path.exists(analysis.image_path):
            try:
                os.remove(analysis.image_path)
            except OSError:
                pass

        db.session.delete(analysis)
        db.session.commit()

        return jsonify({'message': 'Análise removida'}), 200
    except Exception as e:
        logger.error(f"❌ Erro ao excluir análise: {str(e)}")
        return jsonify({'error': f'Falha ao excluir análise: {str(e)}'}), 500

# ------------------------
# DASHBOARD STATS (GET)
# ------------------------
@app.route('/api/dashboard-stats', methods=['GET'])
def get_dashboard_stats():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    try:
        today = datetime.now().date()
        week_start = today - timedelta(days=7)

        # Meals logged via the DailyMeal table
        weekly_meals = (
            DailyMeal.query
            .filter_by(user_id=user.id)
            .filter(DailyMeal.date >= week_start)
            .all()
        )

        total_calories_week = sum(m.calories or 0 for m in weekly_meals)

        # Average health score is derived from meal analyses if available
        weekly_analyses = (
            MealAnalysis.query
            .filter_by(user_id=user.id)
            .filter(MealAnalysis.created_at >= datetime.combine(week_start, datetime.min.time()))
            .all()
        )
        avg_health_score = (
            sum(a.health_score or 0 for a in weekly_analyses) / len(weekly_analyses)
        ) if weekly_analyses else 0

        active_plan = NutritionPlan.query.filter_by(user_id=user.id, is_active=True).first()
        plan_progress = 0
        if active_plan and weekly_meals:
            target_weekly_calories = active_plan.daily_calories * 7
            plan_progress = min(
                (total_calories_week / target_weekly_calories) * 100, 100
            ) if target_weekly_calories > 0 else 0

        total_analyses = MealAnalysis.query.filter_by(user_id=user.id).count()
        recent_achievements = []
        if total_analyses == 1:
            recent_achievements.append("First meal analyzed! 🎉")
        elif total_analyses == 5:
            recent_achievements.append("5 meals analyzed! 🌟") 
        elif total_analyses == 10:
            recent_achievements.append("Nutrition explorer! 🌟")
        elif user.streak_days >= 7:
            recent_achievements.append(f"Semana de streak alcançada! 🔥 ({user.streak_days} dias)")

        weekly_protein = sum(m.protein or 0 for m in weekly_meals)
        weekly_carbs = sum(m.carbs or 0 for m in weekly_meals)
        weekly_fat = sum(m.fat or 0 for m in weekly_meals)

        dashboard_data = {
            'user_stats': {
                'level': user.level,
                'total_xp': user.total_xp,
                'streak_days': user.streak_days,
                'total_analyses': total_analyses
            },
            'weekly_summary': {
                'total_calories': total_calories_week,
                'avg_health_score': round(avg_health_score, 1),
                'meals_logged': len(weekly_meals),
                'plan_progress': round(plan_progress, 1)
            },
            'nutrition_breakdown': {
                'protein': round(weekly_protein, 1),
                'carbs': round(weekly_carbs, 1),
                'fat': round(weekly_fat, 1)
            },
            'recent_achievements': recent_achievements,
            'menstrual_phase': get_menstrual_phase(user.id) if user.gender == 'female' else None
        }
        return jsonify(dashboard_data), 200

    except Exception as e:
        logger.error(f"❌ Erro no dashboard stats: {str(e)}")
        return jsonify({'error': f'Failed to get dashboard stats: {str(e)}'}), 500

# ------------------------
# NOVA ROTA: LOG DIÁRIO DE REFEIÇÕES (GET)
# ------------------------
@app.route('/api/daily-meals', methods=['GET'])
def get_daily_meals():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    date_str = request.args.get('date')
    if not date_str:
        return jsonify({'error': 'Parâmetro "date" obrigatório'}), 400

    try:
        # A data deve vir no formato YYYY-MM-DD
        date_obj = datetime.fromisoformat(date_str).date()
    except ValueError:
        return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD.'}), 400

    meals = DailyMeal.query.filter_by(user_id=user.id, date=date_obj).order_by(DailyMeal.created_at.asc()).all()
    result = []
    for m in meals:
        result.append({
            'id': m.id,
            'name': m.name,
            'calories': m.calories,
            'protein': m.protein,
            'carbs': m.carbs,
            'fat': m.fat,
            'meal_type': m.meal_type,
            'time': m.time
        })
    return jsonify({'meals': result}), 200

# ------------------------
# NOVA ROTA: ADICIONAR REFEIÇÃO AO LOG DIÁRIO (POST)
# ------------------------
@app.route('/api/daily-meals', methods=['POST'])
def add_daily_meal():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    try:
        data = request.get_json()
        estimate_flag = data.get('estimate', False)
        if estimate_flag:
            required_fields = ['date', 'meal_type', 'time']
        else:
            required_fields = ['date', 'calories', 'protein', 'carbs', 'fat', 'meal_type', 'time']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo obrigatório ausente: {field}'}), 400

        try:
            date_obj = datetime.fromisoformat(data['date']).date()
        except ValueError:
            return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD.'}), 400

        description = data.get('description', '')
        meal_name = data.get('name')
        if not meal_name:
            if description:
                meal_name = generate_meal_title(description)
            else:
                meal_name = f"{data['meal_type'].title()} {data['time']}"

        if estimate_flag:
            text_for_estimate = description or meal_name
            estimates = estimate_nutrition_from_text(text_for_estimate)
            if not estimates:
                return jsonify({'error': 'Falha na estimativa nutricional'}), 500
            calories = estimates['calories']
            protein = estimates['protein']
            carbs = estimates['carbs']
            fat = estimates['fat']
        else:
            try:
                calories = int(data['calories'])
                protein = float(data['protein'])
                carbs = float(data['carbs'])
                fat = float(data['fat'])
            except (ValueError, TypeError):
                return jsonify({'error': 'Valores nutricionais inválidos'}), 400

            if calories == 0 and protein == 0 and carbs == 0 and fat == 0:
                return jsonify({'error': 'Forneça valores nutricionais ou use a estimativa AI'}), 400

        new_meal = DailyMeal(
            user_id=user.id,
            date=date_obj,
            name=meal_name,
            calories=calories,
            protein=protein,
            carbs=carbs,
            fat=fat,
            meal_type=data['meal_type'],
            time=data['time']
        )
        db.session.add(new_meal)
        db.session.commit()

        return jsonify({
            'message': 'Refeição adicionada ao log diário',
            'meal': {
                'id': new_meal.id,
                'name': new_meal.name,
                'calories': new_meal.calories,
                'protein': new_meal.protein,
                'carbs': new_meal.carbs,
                'fat': new_meal.fat,
                'meal_type': new_meal.meal_type,
                'time': new_meal.time
            }
        }), 201

    except Exception as e:
        logger.error(f"❌ Erro ao adicionar refeição diária: {str(e)}")
        return jsonify({'error': f'Falha ao adicionar refeição: {str(e)}'}), 500

# ------------------------
# NOVA ROTA: REMOVER REFEIÇÃO DO LOG DIÁRIO (DELETE)
# ------------------------
@app.route('/api/daily-meals/<int:meal_id>', methods=['DELETE'])
def delete_daily_meal(meal_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    try:
        meal = DailyMeal.query.get_or_404(meal_id)
        if meal.user_id != user.id:
            return jsonify({'error': 'Não autorizado'}), 403

        db.session.delete(meal)
        db.session.commit()

        return jsonify({'message': 'Refeição removida do log diário'}), 200
    except Exception as e:
        logger.error(f"❌ Erro ao remover refeição diária: {str(e)}")
        return jsonify({'error': f'Falha ao remover refeição: {str(e)}'}), 500

# ------------------------
# GERAÇÃO DE IMAGEM DE RECEITA
# ------------------------

def generate_recipe_image_url(prompt):
    """Gera uma URL de imagem usando o Azure DALL·E. Em caso de falha retorna
    um placeholder."""
    try:
        if client is None:
            logger.warning("Azure DALL·E client unavailable - using placeholder image")
            raise RuntimeError("offline")
        AZURE_ENDPOINT = "https://inaop-m8ohnn6q-swedencentral.openai.azure.com"
        DEPLOYMENT_NAME = "dall-e-3"
        API_VERSION = "2024-02-01"
        AZURE_API_KEY = "ClLQh4NwuGDphJEiuoMCzvjAibamC88Kpi7yNfoliMEpl061SFxqJQQJ99BCACfhMk5XJ3w3AAAAACOGluow"

        url = f"{AZURE_ENDPOINT}/openai/deployments/{DEPLOYMENT_NAME}/images/generations?api-version={API_VERSION}"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {AZURE_API_KEY}"
        }
        payload = {
            "model": DEPLOYMENT_NAME,
            "prompt": prompt,
            "size": "1024x1024",
            "style": "vivid",
            "quality": "standard",
            "n": 1,
        }

        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        if resp.status_code != 200:
            logger.error(f"Erro ao chamar Azure DALL·E: {resp.status_code} {resp.text}")
            return "https://via.placeholder.com/1024"

        result = resp.json()
        if isinstance(result, dict) and "data" in result and isinstance(result["data"], list) and result["data"]:
            return result["data"][0].get("url", "https://via.placeholder.com/1024")
    except Exception as e:
        logger.error(f"Erro na geração da imagem: {e}")
    return "https://via.placeholder.com/1024"

# ------------------------
# ENDPOINT: /api/recipe-image-generate (POST) usando REST do Azure DALL·E
# ------------------------
@app.route('/api/recipe-image-generate', methods=['POST'])
def recipe_image_generate():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    try:
        data = request.get_json() or {}
        prompt = data.get('prompt', '').strip()
        if not prompt:
            return jsonify({'error': 'Prompt é obrigatório'}), 400

        generated_url = generate_recipe_image_url(prompt)
        return jsonify({'url': generated_url}), 200

    except Exception as e:
        logger.error(f"❌ Erro em /api/recipe-image-generate: {str(e)}")
        return jsonify({'url': "https://via.placeholder.com/1024"}), 200

# ------------------------
# AI MEAL ESTIMATION (POST)
# ------------------------
@app.route('/api/ai-meal-estimation', methods=['POST'])
def ai_meal_estimation():
    """Estimate nutrition from a text description and generate a short title."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Não autenticado'}), 401

    data = request.get_json() or {}
    description = data.get('meal_description', '').strip()
    if not description:
        return jsonify({'error': 'Descrição da refeição é obrigatória'}), 400

    estimates = estimate_nutrition_from_text(description)
    if not estimates:
        return jsonify({'error': 'Falha na estimativa nutricional'}), 500

    title = generate_meal_title(description)
    conf_map = {'low': 60, 'medium': 80, 'high': 95}
    conf_str = calculate_prediction_confidence(len(user.meal_analyses))
    confidence = conf_map.get(conf_str, 60)

    return jsonify({
        'estimation': {
            'title': title,
            'calories': estimates['calories'],
            'protein': estimates['protein'],
            'carbs': estimates['carbs'],
            'fat': estimates['fat'],
            'confidence': confidence
        }
    }), 200

# ------------------------
# INSTRUÇÕES PARA INICIALIZAÇÃO DO BANCO DE DADOS
# ------------------------
def create_demo_user():
    try:
        demo_user = User.query.filter_by(email='demo@nutrivision.com').first()
        if demo_user:
            logger.info("✅ Demo user already exists")
            return

        demo_user = User(
            username='demo_user',
            email='demo@nutrivision.com',
            password_hash=generate_password_hash('password123'),
            age=28,
            gender='female',
            height=165.0,
            current_weight=65.0,
            target_weight=60.0,
            activity_level='moderate',
            total_xp=250,
            level='Explorer',
            streak_days=5,
            metabolic_age=23,
            profile_photo=None
        )
        db.session.add(demo_user)
        db.session.commit()

        demo_analyses = [
            MealAnalysis(
                user_id=demo_user.id,
                foods_detected='["Grilled Chicken", "Quinoa", "Broccoli"]',
                total_calories=420,
                protein=35.0,
                carbs=45.0,
                fat=12.0,
                fiber=8.0,
                emotional_food_score=3.5,
                social_context='alone',
                food_addiction_risk=2.0,
                predicted_satisfaction=8.2,
                optimal_eating_time='12:00-14:00',
                eating_personality_type='Disciplined Optimizer',
                mood_before_eating='neutral',
                mood_after_eating='content',
                weight_impact_prediction=-0.05,
                energy_level_prediction=json.dumps([{"hour":1,"energy":8},{"hour":2,"energy":7}]),
                sleep_quality_impact=1.0,
                health_score=8.5,
                obesity_risk='low',
                ai_feedback='Excellent balanced meal with high protein content.',
                suggestions='["Perfect timing for lunch", "Add some healthy fats"]',
                meal_type='lunch'
            ),
            MealAnalysis(
                user_id=demo_user.id,
                foods_detected='["Oatmeal", "Berries", "Almonds"]',
                total_calories=320,
                protein=12.0,
                carbs=45.0,
                fat=10.0,
                fiber=12.0,
                emotional_food_score=2.8,
                social_context='family',
                food_addiction_risk=1.5,
                predicted_satisfaction=7.8,
                optimal_eating_time='08:00-09:00',
                eating_personality_type='Explorer',
                mood_before_eating='happy',
                mood_after_eating='content',
                weight_impact_prediction=-0.03,
                energy_level_prediction=json.dumps([{"hour":1,"energy":7},{"hour":2,"energy":6}]),
                sleep_quality_impact=0.8,
                health_score=9.0,
                obesity_risk='low',
                ai_feedback='Great breakfast choice with antioxidants and fiber.',
                suggestions='["Add protein powder for more protein", "Perfect breakfast timing"]',
                meal_type='breakfast'
            )
        ]
        for analysis in demo_analyses:
            db.session.add(analysis)

        demo_cycle = MenstrualCycle(
            user_id=demo_user.id,
            cycle_start_date=datetime.now().date() - timedelta(days=10),
            current_phase='follicular',
            energy_level=7,
            mood='good'
        )
        db.session.add(demo_cycle)

        # Exemplo de refeições diárias para demo user
        today_date = datetime.now().date()
        sample_daily_meals = [
            DailyMeal(
                user_id=demo_user.id,
                date=today_date,
                name='Oatmeal with Berries',
                calories=320,
                protein=12.0,
                carbs=45.0,
                fat=8.0,
                meal_type='breakfast',
                time='08:30'
            ),
            DailyMeal(
                user_id=demo_user.id,
                date=today_date,
                name='Grilled Chicken Salad',
                calories=450,
                protein=35.0,
                carbs=20.0,
                fat=18.0,
                meal_type='lunch',
                time='13:00'
            )
        ]
        for dm in sample_daily_meals:
            db.session.add(dm)

        db.session.commit()
        logger.info("✅ Demo user criado com sucesso!")

    except Exception as e:
        logger.error(f"❌ Erro ao criar demo user: {str(e)}")

def init_revolutionary_database():
    db.create_all()
    inspector = inspect(db.engine)
    user_columns = [c['name'] for c in inspector.get_columns('user')]
    if 'profile_photo' not in user_columns:
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE user ADD COLUMN profile_photo VARCHAR(200)"))
            conn.commit()

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

    sample_posts = [
        {
            'user_id': 1,
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
    logger.info("🚀 Banco de dados inicializado!")
    logger.info("🧬 Food DNA pronto")
    logger.info("🎯 Desafios personalizados ativos")
    logger.info("🔮 Predições ativadas")
    logger.info("🌟 Social feed configurado")
    logger.info("🌍 Validação multilíngue de ingredientes ativa (EN/PT/ES)")
    logger.info("🤖 Powered by Azure OpenAI GPT-4o")

# ------------------------
# SERVIR IMAGENS (GET)
# ------------------------
@app.route('/api/images/<filename>')
def serve_image(filename):
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except:
        return jsonify({'error': 'Image not found'}), 404


if __name__ == '__main__':
    with app.app_context():
        init_revolutionary_database()
        create_demo_user()

    logger.info("🚀 NUTRIVISION PRO - REVOLUTIONARY AI")
    logger.info("🌐 Server rodando em http://localhost:5001")
    logger.info("🥘 Validação Multilíngue de Ingredientes ativada (EN/PT/ES)")
    logger.info("📚 Geração múltipla de Receitas via GPT-4o ativa")
    logger.info("🧠 Análise Avançada usando GPT-4o")
    app.run(debug=True, host='0.0.0.0', port=5001)
