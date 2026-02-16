/**
 * Core types for the ProMeals AI application
 */

export interface FoodItem {
  id: string;
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface NutritionData {
  food: FoodItem[];
  total: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface SavedMeal {
  id: string;
  date: string;
  time: string;
  image: string | null;
  nutrition: NutritionData;
  mealType: MealType;
  notes?: string;
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface DailyLog {
  date: string;
  meals: SavedMeal[];
  waterIntake: number; // in ml
  weight?: number; // in kg
  notes?: string;
}

export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
  unit: 'kg' | 'lbs';
  notes?: string;
}

export interface WaterEntry {
  id: string;
  timestamp: string;
  amount: number; // in ml
}

export interface MealTemplate {
  id: string;
  name: string;
  description?: string;
  nutrition: NutritionData;
  mealType: MealType;
  isFavorite: boolean;
  createdAt: string;
}

export interface WeeklyPlan {
  [key: string]: { // day of week (monday, tuesday, etc.)
    breakfast?: MealTemplate;
    lunch?: MealTemplate;
    dinner?: MealTemplate;
    snacks?: MealTemplate[];
  };
}

export interface NutritionInsight {
  type: 'tip' | 'warning' | 'achievement' | 'suggestion';
  title: string;
  message: string;
  metric?: string;
  value?: number;
  goal?: number;
}

export interface FoodDatabaseEntry {
  id: string;
  name: string;
  category: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  tags: string[];
  commonPortions: { label: string; multiplier: number }[];
}

export type View = "analyzer" | "history" | "goals" | "analytics" | "planning" | "settings";

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  unitSystem: 'metric' | 'imperial';
  notificationsEnabled: boolean;
  reminderTimes: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
  dailyWaterGoal: number;
  language: string;
}

export interface DetectedFood {
  name: string;
  confidence: number;
  suggestedPortion: string;
  nutritionEstimate: Partial<FoodItem>;
}
