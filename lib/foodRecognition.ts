/**
 * Local food recognition service using image analysis
 * Analyzes images to detect colors, patterns, and characteristics
 * to suggest possible foods from the database
 */

import { DetectedFood, FoodItem } from '@/types';
import { foodDatabase, searchFoodDatabase } from '@/lib/foodDatabase';

// Color analysis interface
interface ColorAnalysis {
  dominant: string[];
  brightness: number;
  saturation: number;
}

// Analyze image colors and patterns
export async function analyzeImage(imageData: string): Promise<ColorAnalysis> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ dominant: ['neutral'], brightness: 0.5, saturation: 0.5 });
        return;
      }

      canvas.width = 100;
      canvas.height = 100;
      ctx.drawImage(img, 0, 0, 100, 100);

      const imageData = ctx.getImageData(0, 0, 100, 100);
      const data = imageData.data;

      const colorCounts: { [key: string]: number } = {};
      let totalBrightness = 0;
      let totalSaturation = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const colorName = classifyColor(r, g, b);
        colorCounts[colorName] = (colorCounts[colorName] || 0) + 1;

        const brightness = (r + g + b) / (3 * 255);
        totalBrightness += brightness;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        totalSaturation += saturation;
      }

      const pixelCount = data.length / 4;
      const sortedColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([color]) => color);

      resolve({
        dominant: sortedColors,
        brightness: totalBrightness / pixelCount,
        saturation: totalSaturation / pixelCount,
      });
    };

    img.onerror = () => {
      resolve({ dominant: ['neutral'], brightness: 0.5, saturation: 0.5 });
    };

    img.src = imageData;
  });
}

// Classify RGB values into color names
function classifyColor(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  if (diff < 30) {
    if (max < 50) return 'black';
    if (max > 200) return 'white';
    return 'gray';
  }

  if (r > g && r > b) {
    if (g > 150 && b < 100) return 'yellow';
    if (g > 100) return 'orange';
    return 'red';
  }

  if (g > r && g > b) {
    if (r > 100 && b < 100) return 'yellow-green';
    return 'green';
  }

  if (b > r && b > g) {
    if (r > 100) return 'purple';
    return 'blue';
  }

  return 'neutral';
}

// Food detection based on color analysis
export function detectFoodsFromColors(colorAnalysis: ColorAnalysis): DetectedFood[] {
  const detected: DetectedFood[] = [];
  const { dominant, brightness, saturation } = colorAnalysis;

  // Detect based on dominant colors
  dominant.forEach((color) => {
    switch (color) {
      case 'green':
        detected.push(
          { name: 'Lettuce', confidence: 0.7, suggestedPortion: '2 cups (100g)', nutritionEstimate: { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 } },
          { name: 'Spinach', confidence: 0.65, suggestedPortion: '2 cups (60g)', nutritionEstimate: { calories: 14, protein: 1.7, carbs: 2.2, fat: 0.2 } },
          { name: 'Broccoli', confidence: 0.6, suggestedPortion: '1 cup (91g)', nutritionEstimate: { calories: 31, protein: 2.5, carbs: 6.4, fat: 0.4 } },
          { name: 'Bell Pepper', confidence: 0.55, suggestedPortion: '1 medium (120g)', nutritionEstimate: { calories: 37, protein: 1.2, carbs: 7.2, fat: 0.4 } },
          { name: 'Avocado', confidence: 0.5, suggestedPortion: '1/2 avocado (80g)', nutritionEstimate: { calories: 128, protein: 1.6, carbs: 6.8, fat: 12 } }
        );
        break;

      case 'red':
        detected.push(
          { name: 'Tomato', confidence: 0.75, suggestedPortion: '1 medium (150g)', nutritionEstimate: { calories: 27, protein: 1.4, carbs: 5.9, fat: 0.3 } },
          { name: 'Bell Pepper', confidence: 0.7, suggestedPortion: '1 medium (120g)', nutritionEstimate: { calories: 37, protein: 1.2, carbs: 7.2, fat: 0.4 } },
          { name: 'Apple', confidence: 0.6, suggestedPortion: '1 medium (180g)', nutritionEstimate: { calories: 94, protein: 0.5, carbs: 25, fat: 0.3 } },
          { name: 'Strawberries', confidence: 0.55, suggestedPortion: '1 cup (150g)', nutritionEstimate: { calories: 48, protein: 1, carbs: 11.6, fat: 0.5 } }
        );
        break;

      case 'yellow':
      case 'yellow-green':
        detected.push(
          { name: 'Banana', confidence: 0.8, suggestedPortion: '1 medium (120g)', nutritionEstimate: { calories: 107, protein: 1.3, carbs: 27.6, fat: 0.4 } },
          { name: 'Bell Pepper', confidence: 0.65, suggestedPortion: '1 medium (120g)', nutritionEstimate: { calories: 37, protein: 1.2, carbs: 7.2, fat: 0.4 } },
          { name: 'Corn', confidence: 0.6, suggestedPortion: '1 cup (150g)', nutritionEstimate: { calories: 132, protein: 5, carbs: 29, fat: 2 } },
          { name: 'Eggs', confidence: 0.55, suggestedPortion: '2 eggs (100g)', nutritionEstimate: { calories: 155, protein: 13, carbs: 1.1, fat: 11 } }
        );
        break;

      case 'orange':
        detected.push(
          { name: 'Carrots', confidence: 0.75, suggestedPortion: '1 cup (120g)', nutritionEstimate: { calories: 49, protein: 1.1, carbs: 11.5, fat: 0.2 } },
          { name: 'Sweet Potato', confidence: 0.7, suggestedPortion: '1 medium (150g)', nutritionEstimate: { calories: 129, protein: 2.4, carbs: 30, fat: 0.2 } },
          { name: 'Orange', confidence: 0.65, suggestedPortion: '1 medium (150g)', nutritionEstimate: { calories: 71, protein: 1.4, carbs: 18, fat: 0.2 } },
          { name: 'Salmon', confidence: 0.55, suggestedPortion: '1 fillet (150g)', nutritionEstimate: { calories: 312, protein: 30, carbs: 0, fat: 19.5 } }
        );
        break;

      case 'white':
        detected.push(
          { name: 'Rice', confidence: 0.75, suggestedPortion: '1 cup (160g)', nutritionEstimate: { calories: 208, protein: 4.3, carbs: 44.8, fat: 0.5 } },
          { name: 'Pasta', confidence: 0.7, suggestedPortion: '1 cup (140g)', nutritionEstimate: { calories: 183, protein: 7, carbs: 35, fat: 1.5 } },
          { name: 'Cauliflower', confidence: 0.65, suggestedPortion: '1 cup (100g)', nutritionEstimate: { calories: 25, protein: 1.9, carbs: 5, fat: 0.3 } },
          { name: 'Yogurt', confidence: 0.6, suggestedPortion: '1 cup (240g)', nutritionEstimate: { calories: 142, protein: 24, carbs: 8.6, fat: 1 } }
        );
        break;

      case 'brown':
        detected.push(
          { name: 'Chicken Breast', confidence: 0.7, suggestedPortion: '150g', nutritionEstimate: { calories: 248, protein: 46.5, carbs: 0, fat: 5.4 } },
          { name: 'Beef Steak', confidence: 0.65, suggestedPortion: '200g', nutritionEstimate: { calories: 542, protein: 52, carbs: 0, fat: 38 } },
          { name: 'Whole Wheat Bread', confidence: 0.6, suggestedPortion: '2 slices (70g)', nutritionEstimate: { calories: 173, protein: 9.1, carbs: 28.7, fat: 2.4 } },
          { name: 'Almonds', confidence: 0.55, suggestedPortion: 'Small handful (23g)', nutritionEstimate: { calories: 133, protein: 4.8, carbs: 5, fat: 11.5 } }
        );
        break;
    }
  });

  // Adjust confidence based on brightness and saturation
  const adjustedDetected = detected.map(food => ({
    ...food,
    confidence: Math.min(0.95, food.confidence * (0.8 + brightness * 0.2) * (0.8 + saturation * 0.2))
  }));

  // Remove duplicates and sort by confidence
  const uniqueDetected = adjustedDetected.filter((food, index, self) =>
    index === self.findIndex((f) => f.name === food.name)
  );

  return uniqueDetected.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
}

// Main function to analyze food from image
export async function analyzeFoodImage(imageData: string): Promise<{
  detectedFoods: DetectedFood[];
  suggestedMeal: DetectedFood[];
  confidence: number;
}> {
  try {
    const colorAnalysis = await analyzeImage(imageData);
    const detectedFoods = detectFoodsFromColors(colorAnalysis);

    // Create a suggested meal (top 3-4 items)
    const suggestedMeal = detectedFoods.slice(0, Math.min(4, detectedFoods.length));

    // Calculate overall confidence
    const avgConfidence = detectedFoods.length > 0
      ? detectedFoods.reduce((sum, f) => sum + f.confidence, 0) / detectedFoods.length
      : 0.5;

    return {
      detectedFoods,
      suggestedMeal,
      confidence: avgConfidence,
    };
  } catch (error) {
    console.error('Food analysis error:', error);
    return {
      detectedFoods: [],
      suggestedMeal: [],
      confidence: 0,
    };
  }
}

// Convert detected foods to nutrition data
export function convertToNutritionData(detectedFoods: DetectedFood[]): {
  food: FoodItem[];
  total: { calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number };
} {
  const food: FoodItem[] = detectedFoods.map((item, index) => ({
    id: `detected-${index}`,
    name: item.name,
    quantity: item.suggestedPortion,
    calories: item.nutritionEstimate.calories || 0,
    protein: item.nutritionEstimate.protein || 0,
    carbs: item.nutritionEstimate.carbs || 0,
    fat: item.nutritionEstimate.fat || 0,
    fiber: item.nutritionEstimate.fiber || 0,
    sugar: item.nutritionEstimate.sugar || 0,
    sodium: item.nutritionEstimate.sodium || 0,
  }));

  const total = food.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
      fiber: acc.fiber + (item.fiber || 0),
      sugar: acc.sugar + (item.sugar || 0),
      sodium: acc.sodium + (item.sodium || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
  );

  return { food, total };
}

// Search foods by text
export function searchFoods(query: string): FoodItem[] {
  const results = searchFoodDatabase(query);
  return results.map((food) => ({
    id: food.id,
    name: food.name,
    quantity: food.servingSize,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    fiber: food.fiber,
    sugar: food.sugar,
    sodium: food.sodium,
  }));
}

// Get popular/common foods for quick selection
export function getPopularFoods(): FoodItem[] {
  const popularIds = [
    'chicken-breast',
    'rice-white',
    'broccoli',
    'salmon',
    'eggs',
    'pasta-cooked',
    'spinach',
    'sweet-potato',
    'banana',
    'greek-yogurt',
  ];

  return popularIds
    .map((id) => {
      const food = foodDatabase.find((f) => f.id === id);
      if (!food) return null;
      return {
        id: food.id,
        name: food.name,
        quantity: food.servingSize,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber,
        sugar: food.sugar,
        sodium: food.sodium,
      };
    })
    .filter((item): item is FoodItem => item !== null);
}
