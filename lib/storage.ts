/**
 * Storage utilities for persistent data management
 */

import { SavedMeal, NutritionGoals, MealTemplate, WeightEntry, WaterEntry, AppSettings } from '@/types';

const STORAGE_KEYS = {
  MEALS: 'promeals_meals',
  GOALS: 'promeals_goals',
  TEMPLATES: 'promeals_templates',
  WEIGHTS: 'promeals_weights',
  WATER: 'promeals_water',
  SETTINGS: 'promeals_settings',
};

// Meals
export function getSavedMeals(): SavedMeal[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.MEALS);
  if (!data) return [];
  try {
    const meals = JSON.parse(data);
    // Migration: ensure all meals have the new fields
    return meals.map((meal: any) => ({
      ...meal,
      image: meal.image || null,
      notes: meal.notes || '',
    }));
  } catch {
    return [];
  }
}

export function saveMeal(meal: SavedMeal): void {
  if (typeof window === 'undefined') return;
  const meals = getSavedMeals();
  meals.unshift(meal);
  localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(meals));
}

export function updateMeal(updatedMeal: SavedMeal): void {
  if (typeof window === 'undefined') return;
  const meals = getSavedMeals();
  const index = meals.findIndex((m) => m.id === updatedMeal.id);
  if (index !== -1) {
    meals[index] = updatedMeal;
    localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(meals));
  }
}

export function deleteMeal(mealId: string): void {
  if (typeof window === 'undefined') return;
  const meals = getSavedMeals();
  const filtered = meals.filter((m) => m.id !== mealId);
  localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(filtered));
}

// Nutrition Goals
export function getNutritionGoals(): NutritionGoals {
  if (typeof window === 'undefined') {
    return {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 65,
      fiber: 30,
      sugar: 50,
      sodium: 2300,
    };
  }
  const data = localStorage.getItem(STORAGE_KEYS.GOALS);
  if (!data) {
    return {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 65,
      fiber: 30,
      sugar: 50,
      sodium: 2300,
    };
  }
  try {
    const goals = JSON.parse(data);
    // Migration: ensure all fields exist
    return {
      calories: goals.calories ?? 2000,
      protein: goals.protein ?? 150,
      carbs: goals.carbs ?? 250,
      fat: goals.fat ?? 65,
      fiber: goals.fiber ?? 30,
      sugar: goals.sugar ?? 50,
      sodium: goals.sodium ?? 2300,
    };
  } catch {
    return {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 65,
      fiber: 30,
      sugar: 50,
      sodium: 2300,
    };
  }
}

export function setNutritionGoals(goals: NutritionGoals): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
}

// Meal Templates
export function getMealTemplates(): MealTemplate[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveMealTemplate(template: MealTemplate): void {
  if (typeof window === 'undefined') return;
  const templates = getMealTemplates();
  templates.unshift(template);
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
}

export function updateMealTemplate(updatedTemplate: MealTemplate): void {
  if (typeof window === 'undefined') return;
  const templates = getMealTemplates();
  const index = templates.findIndex((t) => t.id === updatedTemplate.id);
  if (index !== -1) {
    templates[index] = updatedTemplate;
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  }
}

export function deleteMealTemplate(templateId: string): void {
  if (typeof window === 'undefined') return;
  const templates = getMealTemplates();
  const filtered = templates.filter((t) => t.id !== templateId);
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(filtered));
}

// Weight Tracking
export function getWeightEntries(): WeightEntry[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.WEIGHTS);
  if (!data) return [];
  try {
    return JSON.parse(data).sort((a: WeightEntry, b: WeightEntry) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch {
    return [];
  }
}

export function addWeightEntry(entry: WeightEntry): void {
  if (typeof window === 'undefined') return;
  const entries = getWeightEntries();
  entries.unshift(entry);
  localStorage.setItem(STORAGE_KEYS.WEIGHTS, JSON.stringify(entries));
}

export function deleteWeightEntry(entryId: string): void {
  if (typeof window === 'undefined') return;
  const entries = getWeightEntries();
  const filtered = entries.filter((e) => e.id !== entryId);
  localStorage.setItem(STORAGE_KEYS.WEIGHTS, JSON.stringify(filtered));
}

// Water Tracking
export function getWaterEntries(date?: string): WaterEntry[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.WATER);
  if (!data) return [];
  try {
    const entries: WaterEntry[] = JSON.parse(data);
    if (date) {
      const targetDate = new Date(date).toDateString();
      return entries.filter(
        (e) => new Date(e.timestamp).toDateString() === targetDate
      );
    }
    return entries.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch {
    return [];
  }
}

export function addWaterEntry(entry: WaterEntry): void {
  if (typeof window === 'undefined') return;
  const entries = getWaterEntries();
  entries.unshift(entry);
  localStorage.setItem(STORAGE_KEYS.WATER, JSON.stringify(entries));
}

export function getDailyWaterTotal(date: string): number {
  const entries = getWaterEntries(date);
  return entries.reduce((total, entry) => total + entry.amount, 0);
}

export function deleteWaterEntry(entryId: string): void {
  if (typeof window === 'undefined') return;
  const entries = getWaterEntries();
  const filtered = entries.filter((e) => e.id !== entryId);
  localStorage.setItem(STORAGE_KEYS.WATER, JSON.stringify(filtered));
}

// Settings
export function getSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return {
      theme: 'dark',
      unitSystem: 'metric',
      notificationsEnabled: false,
      reminderTimes: {},
      dailyWaterGoal: 2500,
      language: 'en',
    };
  }
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!data) {
    return {
      theme: 'dark',
      unitSystem: 'metric',
      notificationsEnabled: false,
      reminderTimes: {},
      dailyWaterGoal: 2500,
      language: 'en',
    };
  }
  try {
    return { ...JSON.parse(data) };
  } catch {
    return {
      theme: 'dark',
      unitSystem: 'metric',
      notificationsEnabled: false,
      reminderTimes: {},
      dailyWaterGoal: 2500,
      language: 'en',
    };
  }
}

export function setSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// Export data
export function exportAllData(): string {
  const data = {
    meals: getSavedMeals(),
    goals: getNutritionGoals(),
    templates: getMealTemplates(),
    weights: getWeightEntries(),
    water: getWaterEntries(),
    settings: getSettings(),
    exportDate: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

// Import data
export function importAllData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    if (data.meals) localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(data.meals));
    if (data.goals) localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(data.goals));
    if (data.templates) localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(data.templates));
    if (data.weights) localStorage.setItem(STORAGE_KEYS.WEIGHTS, JSON.stringify(data.weights));
    if (data.water) localStorage.setItem(STORAGE_KEYS.WATER, JSON.stringify(data.water));
    if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    return true;
  } catch {
    return false;
  }
}

// Clear all data
export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}
