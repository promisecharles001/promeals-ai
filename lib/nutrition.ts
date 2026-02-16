/**
 * Nutrition calculation and analytics utilities
 */

import { SavedMeal, NutritionGoals, NutritionInsight, DailyLog } from '@/types';

// Calculate totals for a specific date or date range
export function calculateNutritionTotals(
  meals: SavedMeal[],
  startDate?: string,
  endDate?: string
): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
} {
  const filteredMeals = meals.filter((meal) => {
    if (!startDate && !endDate) return true;
    const mealDate = new Date(meal.date);
    const start = startDate ? new Date(startDate) : new Date('1900-01-01');
    const end = endDate ? new Date(endDate) : new Date('2100-12-31');
    return mealDate >= start && mealDate <= end;
  });

  return filteredMeals.reduce(
    (totals, meal) => ({
      calories: totals.calories + meal.nutrition.total.calories,
      protein: totals.protein + meal.nutrition.total.protein,
      carbs: totals.carbs + meal.nutrition.total.carbs,
      fat: totals.fat + meal.nutrition.total.fat,
      fiber: totals.fiber + (meal.nutrition.total.fiber || 0),
      sugar: totals.sugar + (meal.nutrition.total.sugar || 0),
      sodium: totals.sodium + (meal.nutrition.total.sodium || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
  );
}

// Calculate today's totals
export function getTodaysTotals(meals: SavedMeal[]): ReturnType<typeof calculateNutritionTotals> {
  const today = new Date().toDateString();
  const todaysMeals = meals.filter((meal) => new Date(meal.date).toDateString() === today);
  return calculateNutritionTotals(todaysMeals);
}

// Calculate percentage of goal achieved
export function calculateGoalProgress(
  current: number,
  goal: number
): { percentage: number; remaining: number; status: 'under' | 'on-track' | 'over' } {
  const percentage = (current / goal) * 100;
  const remaining = goal - current;

  let status: 'under' | 'on-track' | 'over';
  if (percentage < 80) status = 'under';
  else if (percentage <= 110) status = 'on-track';
  else status = 'over';

  return { percentage, remaining, status };
}

// Generate nutrition insights
export function generateInsights(
  meals: SavedMeal[],
  goals: NutritionGoals,
  waterIntake: number,
  waterGoal: number
): NutritionInsight[] {
  const insights: NutritionInsight[] = [];
  const today = getTodaysTotals(meals);

  // Calorie insights
  const calorieProgress = calculateGoalProgress(today.calories, goals.calories);
  if (calorieProgress.status === 'over') {
    insights.push({
      type: 'warning',
      title: 'Calorie Intake High',
      message: `You've exceeded your daily calorie goal by ${Math.abs(calorieProgress.remaining)} calories.`,
      metric: 'calories',
      value: today.calories,
      goal: goals.calories,
    });
  } else if (calorieProgress.status === 'under' && today.calories > 0) {
    insights.push({
      type: 'suggestion',
      title: 'Calorie Deficit',
      message: `You have ${Math.round(calorieProgress.remaining)} calories remaining for today.`,
      metric: 'calories',
      value: today.calories,
      goal: goals.calories,
    });
  } else if (calorieProgress.status === 'on-track') {
    insights.push({
      type: 'achievement',
      title: 'Great Progress!',
      message: `You're right on track with your calorie goal!`,
      metric: 'calories',
      value: today.calories,
      goal: goals.calories,
    });
  }

  // Protein insights
  const proteinProgress = calculateGoalProgress(today.protein, goals.protein);
  if (proteinProgress.percentage < 60 && today.calories > goals.calories * 0.5) {
    insights.push({
      type: 'suggestion',
      title: 'Increase Protein',
      message: 'Consider adding protein-rich foods like chicken, fish, or legumes to your next meal.',
      metric: 'protein',
      value: today.protein,
      goal: goals.protein,
    });
  } else if (proteinProgress.percentage >= 100) {
    insights.push({
      type: 'achievement',
      title: 'Protein Goal Met!',
      message: `You've reached your daily protein goal of ${goals.protein}g.`,
      metric: 'protein',
      value: today.protein,
      goal: goals.protein,
    });
  }

  // Fiber insights
  const fiberProgress = calculateGoalProgress(today.fiber, goals.fiber);
  if (fiberProgress.percentage < 50 && today.calories > 0) {
    insights.push({
      type: 'tip',
      title: 'Add More Fiber',
      message: 'Try adding vegetables, fruits, or whole grains to increase your fiber intake.',
      metric: 'fiber',
      value: today.fiber,
      goal: goals.fiber,
    });
  }

  // Sodium insights
  const sodiumProgress = calculateGoalProgress(today.sodium, goals.sodium);
  if (sodiumProgress.percentage > 90) {
    insights.push({
      type: 'warning',
      title: 'Sodium Alert',
      message: 'You\'re close to your daily sodium limit. Avoid adding salt to your next meal.',
      metric: 'sodium',
      value: today.sodium,
      goal: goals.sodium,
    });
  }

  // Water insights
  const waterProgress = calculateGoalProgress(waterIntake, waterGoal);
  if (waterProgress.percentage < 50) {
    insights.push({
      type: 'tip',
      title: 'Stay Hydrated',
      message: `You've had ${Math.round(waterProgress.percentage)}% of your daily water goal. Keep drinking!`,
      metric: 'water',
      value: waterIntake,
      goal: waterGoal,
    });
  } else if (waterProgress.percentage >= 100) {
    insights.push({
      type: 'achievement',
      title: 'Hydration Hero!',
      message: 'You\'ve reached your daily water goal. Great job staying hydrated!',
      metric: 'water',
      value: waterIntake,
      goal: waterGoal,
    });
  }

  // Meal distribution insight
  const recentMeals = meals.filter(
    (m) => new Date(m.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const mealTypeCount = recentMeals.reduce((acc, meal) => {
    acc[meal.mealType] = (acc[meal.mealType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (mealTypeCount.snack > mealTypeCount.lunch + mealTypeCount.dinner) {
    insights.push({
      type: 'suggestion',
      title: 'Snack Pattern',
      message: 'You\'ve been logging more snacks than meals. Try to maintain regular meal times.',
    });
  }

  return insights.slice(0, 5); // Limit to 5 insights
}

// Get weekly data for charts
export function getWeeklyData(meals: SavedMeal[]): {
  labels: string[];
  calories: number[];
  protein: number[];
  carbs: number[];
  fat: number[];
} {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const weekData: { [key: string]: ReturnType<typeof calculateNutritionTotals> } = {};

  // Initialize all days with zeros
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayLabel = days[date.getDay()];
    weekData[dayLabel] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 };
  }

  // Fill in data
  meals.forEach((meal) => {
    const mealDate = new Date(meal.date);
    const dayDiff = Math.floor((today.getTime() - mealDate.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff >= 0 && dayDiff < 7) {
      const dayLabel = days[mealDate.getDay()];
      weekData[dayLabel].calories += meal.nutrition.total.calories;
      weekData[dayLabel].protein += meal.nutrition.total.protein;
      weekData[dayLabel].carbs += meal.nutrition.total.carbs;
      weekData[dayLabel].fat += meal.nutrition.total.fat;
    }
  });

  // Sort by day of week starting from 6 days ago
  const sortedLabels: string[] = [];
  const sortedCalories: number[] = [];
  const sortedProtein: number[] = [];
  const sortedCarbs: number[] = [];
  const sortedFat: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayLabel = days[date.getDay()];
    sortedLabels.push(dayLabel);
    sortedCalories.push(Math.round(weekData[dayLabel].calories));
    sortedProtein.push(Math.round(weekData[dayLabel].protein));
    sortedCarbs.push(Math.round(weekData[dayLabel].carbs));
    sortedFat.push(Math.round(weekData[dayLabel].fat));
  }

  return {
    labels: sortedLabels,
    calories: sortedCalories,
    protein: sortedProtein,
    carbs: sortedCarbs,
    fat: sortedFat,
  };
}

// Get meal distribution by type
export function getMealTypeDistribution(meals: SavedMeal[]): {
  breakfast: number;
  lunch: number;
  dinner: number;
  snack: number;
} {
  return meals.reduce(
    (acc, meal) => {
      acc[meal.mealType] += meal.nutrition.total.calories;
      return acc;
    },
    { breakfast: 0, lunch: 0, dinner: 0, snack: 0 }
  );
}

// Get macro percentages
export function getMacroPercentages(totals: ReturnType<typeof calculateNutritionTotals>): {
  protein: number;
  carbs: number;
  fat: number;
} {
  const totalCalories = totals.calories;
  if (totalCalories === 0) return { protein: 0, carbs: 0, fat: 0 };

  return {
    protein: Math.round(((totals.protein * 4) / totalCalories) * 100),
    carbs: Math.round(((totals.carbs * 4) / totalCalories) * 100),
    fat: Math.round(((totals.fat * 9) / totalCalories) * 100),
  };
}

// Get stats for a date range
export function getStatsForDateRange(
  meals: SavedMeal[],
  days: number
): {
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  totalMeals: number;
  mostCommonMealType: string;
} {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const filteredMeals = meals.filter((meal) => new Date(meal.date) >= cutoffDate);

  if (filteredMeals.length === 0) {
    return {
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFat: 0,
      totalMeals: 0,
      mostCommonMealType: 'N/A',
    };
  }

  const totals = calculateNutritionTotals(filteredMeals);

  const mealTypeCount = filteredMeals.reduce((acc, meal) => {
    acc[meal.mealType] = (acc[meal.mealType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommonMealType = Object.entries(mealTypeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return {
    avgCalories: Math.round(totals.calories / days),
    avgProtein: Math.round(totals.protein / days),
    avgCarbs: Math.round(totals.carbs / days),
    avgFat: Math.round(totals.fat / days),
    totalMeals: filteredMeals.length,
    mostCommonMealType,
  };
}

// Calculate BMI
export function calculateBMI(weightKg: number, heightM: number): number {
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

// Get BMI category
export function getBMICategory(bmi: number): { category: string; color: string } {
  if (bmi < 18.5) return { category: 'Underweight', color: 'text-yellow-400' };
  if (bmi < 25) return { category: 'Healthy Weight', color: 'text-green-400' };
  if (bmi < 30) return { category: 'Overweight', color: 'text-orange-400' };
  return { category: 'Obese', color: 'text-red-400' };
}

// Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female'
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

// Calculate TDEE (Total Daily Energy Expenditure)
export function calculateTDEE(
  bmr: number,
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active'
): number {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    'very-active': 1.9,
  };
  return Math.round(bmr * multipliers[activityLevel]);
}

// Suggest daily goals based on user profile
export function suggestDailyGoals(
  tdee: number,
  goal: 'lose' | 'maintain' | 'gain'
): NutritionGoals {
  let calories = tdee;
  if (goal === 'lose') calories -= 500;
  if (goal === 'gain') calories += 500;

  // Standard macro split: 30% protein, 40% carbs, 30% fat
  const protein = Math.round((calories * 0.3) / 4);
  const carbs = Math.round((calories * 0.4) / 4);
  const fat = Math.round((calories * 0.3) / 9);

  return {
    calories,
    protein,
    carbs,
    fat,
    fiber: 30,
    sugar: Math.round(calories * 0.025 / 4), // ~10% of calories from sugar
    sodium: 2300,
  };
}
