"use client";

import type React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Camera, Upload, X, History, Target, Home, Plus, Minus, BarChart3, 
  Calendar, Settings, Droplets, Weight, ChevronDown, ChevronUp, 
  Search, Star, Download, Upload as UploadIcon, Trash2, Edit3, 
  TrendingUp, AlertCircle, CheckCircle2, Lightbulb, Info,
  Utensils, Apple, Beef, Salad, Pizza, Coffee, Moon, Sun,
  RotateCcw, Save, Share2, FileDown
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import type { 
  FoodItem, NutritionData, SavedMeal, NutritionGoals, MealType, 
  View, MealTemplate, WeightEntry, WaterEntry, AppSettings, DetectedFood,
  NutritionInsight
} from "@/types";
import { analyzeFoodImage, convertToNutritionData, searchFoods, getPopularFoods } from "@/lib/foodRecognition";
import { 
  getSavedMeals, saveMeal, deleteMeal, getNutritionGoals, setNutritionGoals,
  getMealTemplates, saveMealTemplate, deleteMealTemplate, getWeightEntries, 
  addWeightEntry, getWaterEntries, addWaterEntry, getDailyWaterTotal, 
  exportAllData, importAllData, clearAllData, getSettings, setSettings
} from "@/lib/storage";
import { 
  getTodaysTotals, calculateGoalProgress, generateInsights, getWeeklyData,
  getMealTypeDistribution, getMacroPercentages, getStatsForDateRange,
  calculateBMI, getBMICategory, calculateBMR, calculateTDEE, suggestDailyGoals
} from "@/lib/nutrition";
import { foodDatabase, getAllCategories, calculateNutrition } from "@/lib/foodDatabase";

// Colors for charts
const CHART_COLORS = {
  calories: '#f97316',
  protein: '#22c55e',
  carbs: '#3b82f6',
  fat: '#eab308',
  fiber: '#8b5cf6',
  water: '#06b6d4',
};

const MEAL_TYPE_COLORS = {
  breakfast: '#f97316',
  lunch: '#22c55e',
  dinner: '#3b82f6',
  snack: '#eab308',
};

export default function ProCaloriesAI() {
  // View state
  const [currentView, setCurrentView] = useState<View>("analyzer");
  
  // Camera and image state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [preferredFacing, setPreferredFacing] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pendingStreamRef = useRef<MediaStream | null>(null);
  
  // Analysis state
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("lunch");
  const [mealNotes, setMealNotes] = useState("");
  
  // Data state
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [nutritionGoals, setNutritionGoalsState] = useState<NutritionGoals>({
    calories: 2000, protein: 150, carbs: 250, fat: 65, fiber: 30, sugar: 50, sodium: 2300
  });
  const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>([]);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>({
    theme: 'dark', unitSystem: 'metric', notificationsEnabled: false,
    reminderTimes: {}, dailyWaterGoal: 2500, language: 'en'
  });
  
  // Water tracking
  const [waterIntake, setWaterIntake] = useState(0);
  const [customWaterAmount, setCustomWaterAmount] = useState(250);
  
  // Manual food entry
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);
  const [manualEntryMode, setManualEntryMode] = useState(false);
  
  // Analytics
  const [insights, setInsights] = useState<NutritionInsight[]>([]);
  const [weeklyData, setWeeklyData] = useState({ labels: [], calories: [], protein: [], carbs: [], fat: [] });
  
  // Template creation
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  
  // Weight entry
  const [newWeight, setNewWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>("kg");
  const [weightNotes, setWeightNotes] = useState("");
  
  // Import/Export
  const [importData, setImportData] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  // Load initial data
  useEffect(() => {
    setSavedMeals(getSavedMeals());
    setNutritionGoalsState(getNutritionGoals());
    setMealTemplates(getMealTemplates());
    setWeightEntries(getWeightEntries());
    setSettingsState(getSettings());
    updateWaterIntake();
  }, []);
  
  // Update derived data when meals change
  useEffect(() => {
    const totals = getTodaysTotals(savedMeals);
    const newInsights = generateInsights(savedMeals, nutritionGoals, waterIntake, settings.dailyWaterGoal);
    const newWeeklyData = getWeeklyData(savedMeals);
    setInsights(newInsights);
    setWeeklyData(newWeeklyData as any);
  }, [savedMeals, nutritionGoals, waterIntake, settings.dailyWaterGoal]);
  
  // Persist data changes
  useEffect(() => {
    setNutritionGoals(nutritionGoals);
  }, [nutritionGoals]);
  
  const updateWaterIntake = () => {
    const today = new Date().toDateString();
    setWaterIntake(getDailyWaterTotal(today));
  };
  
  // Camera functions
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not supported");
      }
      
      setIsLoadingCamera(true);
      
      let probeStream: MediaStream | null = null;
      try {
        probeStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === "videoinput");
        setVideoDevices(devices);
        
        const pickByFacing = (facing: "environment" | "user") =>
          devices.find((d) =>
            d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear") || d.label.toLowerCase().includes("environment")
              ? facing === "environment"
              : d.label.toLowerCase().includes("front") || d.label.toLowerCase().includes("user") || d.label.toLowerCase().includes("face")
              ? facing === "user"
              : false
          );
        
        const preferredDevice = preferredFacing === "environment" 
          ? pickByFacing("environment") || devices[0]
          : pickByFacing("user") || devices[0];
        
        if (preferredDevice) setActiveDeviceId(preferredDevice.deviceId);
      } finally {
        if (probeStream) probeStream.getTracks().forEach(t => t.stop());
      }
      
      const constraints: MediaStreamConstraints = {
        video: activeDeviceId
          ? { deviceId: { exact: activeDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: preferredFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };
      
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      pendingStreamRef.current = stream;
      setShowCamera(true);
    } catch (error) {
      setIsLoadingCamera(false);
      setCameraError(error instanceof Error ? error.message : "Failed to access camera");
    }
  };
  
  useEffect(() => {
    if (!showCamera) return;
    const stream = pendingStreamRef.current;
    if (!stream || !videoRef.current) return;
    
    const video = videoRef.current;
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play().then(() => setIsLoadingCamera(false)).catch(() => setIsLoadingCamera(false));
    };
  }, [showCamera]);
  
  const stopCamera = () => {
    const v = videoRef.current;
    const active = (v?.srcObject as MediaStream | null) || pendingStreamRef.current;
    if (active) active.getTracks().forEach(t => { try { t.stop(); } catch {} });
    if (v) v.srcObject = null;
    pendingStreamRef.current = null;
    setShowCamera(false);
    setIsLoadingCamera(false);
  };
  
  const switchCamera = async () => {
    if (videoDevices.length < 2) return;
    const currentIndex = videoDevices.findIndex(d => d.deviceId === activeDeviceId);
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    setActiveDeviceId(videoDevices[nextIndex].deviceId);
    setPreferredFacing(prev => prev === "environment" ? "user" : "environment");
    stopCamera();
    setTimeout(() => startCamera(), 50);
  };
  
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alert("Camera not ready. Please try again.");
      return;
    }
    
    const context = canvas.getContext("2d");
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const usingFront = preferredFacing === "user";
    if (usingFront) {
      context.save();
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      context.restore();
    } else {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    
    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    setSelectedImage(imageData);
    setNutritionData(null);
    stopCamera();
    analyzeImage(imageData);
  };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setSelectedImage(imageData);
        setNutritionData(null);
        analyzeImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    try {
      // Use local food recognition
      const result = await analyzeFoodImage(imageData);
      
      if (result.detectedFoods.length > 0) {
        const nutrition = convertToNutritionData(result.detectedFoods);
        setNutritionData(nutrition);
        setDetectedFoods(result.detectedFoods);
      } else {
        // Fallback to generic estimate
        setNutritionData({
          food: [{ id: 'generic-1', name: 'Mixed Meal', quantity: '1 serving', calories: 400, protein: 20, carbs: 50, fat: 15, fiber: 5, sugar: 8, sodium: 500 }],
          total: { calories: 400, protein: 20, carbs: 50, fat: 15, fiber: 5, sugar: 8, sodium: 500 }
        });
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Analysis failed. You can manually add foods below.");
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleSaveMeal = () => {
    if (!nutritionData) return;
    
    const newMeal: SavedMeal = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      image: selectedImage,
      nutrition: nutritionData,
      mealType: selectedMealType,
      notes: mealNotes,
    };
    
    saveMeal(newMeal);
    setSavedMeals(getSavedMeals());
    
    // Reset
    setSelectedImage(null);
    setNutritionData(null);
    setDetectedFoods([]);
    setMealNotes("");
    setSelectedFoods([]);
    setCurrentView("history");
  };
  
  const handleDeleteMeal = (mealId: string) => {
    if (confirm("Are you sure you want to delete this meal?")) {
      deleteMeal(mealId);
      setSavedMeals(getSavedMeals());
    }
  };
  
  // Food search
  useEffect(() => {
    if (foodSearchQuery.trim()) {
      const results = searchFoods(foodSearchQuery);
      setSearchResults(results.slice(0, 10));
    } else {
      setSearchResults([]);
    }
  }, [foodSearchQuery]);
  
  const addFoodToSelection = (food: FoodItem) => {
    const newFood = { ...food, id: `manual-${Date.now()}-${Math.random()}` };
    setSelectedFoods([...selectedFoods, newFood]);
    
    // Update nutrition data
    const allFoods = [...selectedFoods, newFood];
    const total = allFoods.reduce((acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
      fiber: acc.fiber + (item.fiber || 0),
      sugar: acc.sugar + (item.sugar || 0),
      sodium: acc.sodium + (item.sodium || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 });
    
    setNutritionData({ food: allFoods, total });
    setFoodSearchQuery("");
  };
  
  const removeFoodFromSelection = (foodId: string) => {
    const updated = selectedFoods.filter(f => f.id !== foodId);
    setSelectedFoods(updated);
    
    if (updated.length === 0) {
      setNutritionData(null);
    } else {
      const total = updated.reduce((acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
        fiber: acc.fiber + (item.fiber || 0),
        sugar: acc.sugar + (item.sugar || 0),
        sodium: acc.sodium + (item.sodium || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 });
      setNutritionData({ food: updated, total });
    }
  };
  
  // Water tracking
  const addWater = (amount: number) => {
    const entry: WaterEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      amount,
    };
    addWaterEntry(entry);
    updateWaterIntake();
  };
  
  // Weight tracking
  const handleAddWeight = () => {
    if (!newWeight) return;
    const entry: WeightEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      weight: parseFloat(newWeight),
      unit: weightUnit,
      notes: weightNotes,
    };
    addWeightEntry(entry);
    setWeightEntries(getWeightEntries());
    setNewWeight("");
    setWeightNotes("");
  };
  
  // Templates
  const saveAsTemplate = () => {
    if (!nutritionData || !newTemplateName) return;
    
    const template: MealTemplate = {
      id: Date.now().toString(),
      name: newTemplateName,
      description: newTemplateDescription,
      nutrition: nutritionData,
      mealType: selectedMealType,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };
    
    saveMealTemplate(template);
    setMealTemplates(getMealTemplates());
    setNewTemplateName("");
    setNewTemplateDescription("");
    alert("Template saved successfully!");
  };
  
  const useTemplate = (template: MealTemplate) => {
    setNutritionData(template.nutrition);
    setSelectedMealType(template.mealType);
    setSelectedFoods(template.nutrition.food);
    setCurrentView("analyzer");
  };
  
  // Export/Import
  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `promeals-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleImport = () => {
    if (!importData.trim()) return;
    const success = importAllData(importData);
    if (success) {
      setSavedMeals(getSavedMeals());
      setNutritionGoalsState(getNutritionGoals());
      setMealTemplates(getMealTemplates());
      setWeightEntries(getWeightEntries());
      setSettingsState(getSettings());
      setShowImportDialog(false);
      setImportData("");
      alert("Data imported successfully!");
    } else {
      alert("Failed to import data. Please check the file format.");
    }
  };
  
  const handleClearAllData = () => {
    if (confirm("Are you sure you want to delete ALL data? This cannot be undone!")) {
      clearAllData();
      setSavedMeals([]);
      setMealTemplates([]);
      setWeightEntries([]);
      setNutritionGoalsState({ calories: 2000, protein: 150, carbs: 250, fat: 65, fiber: 30, sugar: 50, sodium: 2300 });
      alert("All data has been cleared.");
    }
  };
  
  // Render functions
  const renderAnalyzerView = () => (
    <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-240px)] px-6 pb-20">
      <div className="text-center mb-8">
        <Badge className="mb-4 bg-orange-500/20 text-orange-300 border-orange-500/30">
          AI-Powered • Local Analysis
        </Badge>
        <h1 className="text-5xl md:text-7xl font-black mb-6 text-balance">
          Snap.
          <br />
          <span className="text-orange-400">Analyze.</span>
          <br />
          Track.
        </h1>
        <p className="text-xl text-gray-300 text-balance max-w-lg mx-auto mb-6">
          Take a photo of your meal and get instant nutrition analysis locally on your device.
        </p>
      </div>
      
      {!showCamera && !selectedImage && !manualEntryMode && (
        <div className="flex flex-col gap-4 mb-8 w-full max-w-md">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={startCamera} size="lg" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
              <Camera className="w-5 h-5 mr-2" />
              Take Photo
            </Button>
            <Button onClick={() => document.getElementById('image-upload')?.click()} variant="outline" size="lg" className="flex-1 border-white/30 text-white hover:bg-white/10 bg-transparent">
              <Upload className="w-5 h-5 mr-2" />
              Upload Photo
            </Button>
          </div>
          <input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          
          <Button onClick={() => setManualEntryMode(true)} variant="outline" size="lg" className="w-full border-white/30 text-white hover:bg-white/10 bg-transparent">
            <Search className="w-5 h-5 mr-2" />
            Search Food Database
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-gray-400">Or use a template:</p>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {mealTemplates.slice(0, 3).map(template => (
                <Badge 
                  key={template.id} 
                  className="cursor-pointer bg-white/10 hover:bg-white/20"
                  onClick={() => useTemplate(template)}
                >
                  {template.name}
                </Badge>
              ))}
              {mealTemplates.length === 0 && (
                <span className="text-xs text-gray-500">No templates yet</span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {showCamera && (
        <Card className="w-full max-w-md bg-black/50 border-white/20">
          <CardContent className="p-4">
            <div className="relative">
              <video ref={videoRef} autoPlay playsInline muted className={`w-full h-64 object-cover rounded-lg border-2 border-orange-500 ${preferredFacing === "user" ? "scale-x-[-1]" : ""}`} style={{ backgroundColor: "black" }} />
              <div className="absolute top-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">Camera Active</div>
              <Button onClick={stopCamera} variant="ghost" size="sm" className="absolute top-2 right-2 text-white hover:bg-black/50"><X className="w-4 h-4" /></Button>
            </div>
            {cameraError && (
              <div className="mt-3 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">{cameraError}</div>
            )}
            <div className="flex gap-2 mt-4">
              <Button onClick={capturePhoto} className="flex-1 bg-orange-500 hover:bg-orange-600"><Camera className="w-4 h-4 mr-2" />Capture</Button>
              <Button onClick={switchCamera} variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent" disabled={videoDevices.length < 2}>Switch</Button>
              <Button onClick={stopCamera} variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {isLoadingCamera && (
        <Card className="w-full max-w-md bg-black/50 border-white/20">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg mb-2">Accessing Camera...</p>
          </CardContent>
        </Card>
      )}
      
      {manualEntryMode && !selectedImage && (
        <Card className="w-full max-w-md bg-black/50 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex justify-between items-center">
              Search Food Database
              <Button variant="ghost" size="sm" onClick={() => setManualEntryMode(false)}><X className="w-4 h-4" /></Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Search for foods..." 
                value={foodSearchQuery}
                onChange={(e) => setFoodSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white"
              />
            </div>
            
            {searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {searchResults.map(food => (
                  <div key={food.id} className="flex justify-between items-center p-2 bg-white/5 rounded hover:bg-white/10 cursor-pointer" onClick={() => addFoodToSelection(food)}>
                    <div>
                      <p className="text-white font-medium">{food.name}</p>
                      <p className="text-xs text-gray-400">{food.calories} cal • {food.protein}g protein</p>
                    </div>
                    <Plus className="w-4 h-4 text-orange-400" />
                  </div>
                ))}
              </div>
            )}
            
            <div>
              <p className="text-sm text-gray-400 mb-2">Popular foods:</p>
              <div className="flex flex-wrap gap-2">
                {getPopularFoods().slice(0, 6).map(food => (
                  <Badge key={food.id} className="cursor-pointer bg-white/10 hover:bg-orange-500/30" onClick={() => addFoodToSelection(food)}>
                    {food.name}
                  </Badge>
                ))}
              </div>
            </div>
            
            {selectedFoods.length > 0 && (
              <>
                <Separator className="bg-white/20" />
                <div>
                  <p className="text-white font-medium mb-2">Selected Foods:</p>
                  <div className="space-y-2">
                    {selectedFoods.map(food => (
                      <div key={food.id} className="flex justify-between items-center p-2 bg-orange-500/10 rounded">
                        <span className="text-white">{food.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeFoodFromSelection(food.id)}><Trash2 className="w-3 h-3 text-red-400" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
      
      {selectedImage && (
        <Card className="w-full max-w-md bg-black/50 border-white/20">
          <CardContent className="p-4">
            <img src={selectedImage} alt="Meal to analyze" className="w-full h-64 object-cover rounded-lg" />
            {isAnalyzing && (
              <div className="mt-4 w-full bg-orange-500/20 border border-orange-500/30 rounded-lg py-3 px-4 text-center">
                <div className="flex items-center justify-center text-orange-300">
                  <div className="w-5 h-5 border-2 border-orange-300/30 border-t-orange-300 rounded-full animate-spin mr-2" />
                  Analyzing your meal...
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {nutritionData && (
        <Card className="w-full max-w-md bg-black/50 border-white/20 mt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Nutrition Facts</CardTitle>
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Analyzed</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <div className="text-2xl font-black text-orange-400">{nutritionData.total.calories}</div>
                <div className="text-xs text-gray-400 uppercase">Calories</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <div className="text-2xl font-black text-green-400">{nutritionData.total.protein.toFixed(1)}g</div>
                <div className="text-xs text-gray-400 uppercase">Protein</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <div className="text-2xl font-black text-blue-400">{nutritionData.total.carbs}g</div>
                <div className="text-xs text-gray-400 uppercase">Carbs</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <div className="text-2xl font-black text-yellow-400">{nutritionData.total.fat.toFixed(1)}g</div>
                <div className="text-xs text-gray-400 uppercase">Fat</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-purple-500/10 rounded p-2">
                <div className="text-purple-400 font-bold">{nutritionData.total.fiber || 0}g</div>
                <div className="text-gray-400">Fiber</div>
              </div>
              <div className="bg-pink-500/10 rounded p-2">
                <div className="text-pink-400 font-bold">{nutritionData.total.sugar || 0}g</div>
                <div className="text-gray-400">Sugar</div>
              </div>
              <div className="bg-cyan-500/10 rounded p-2">
                <div className="text-cyan-400 font-bold">{nutritionData.total.sodium || 0}mg</div>
                <div className="text-gray-400">Sodium</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Food Items</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {nutritionData.food.map((item, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-white text-sm">{item.name}</span>
                      <span className="text-orange-400 text-sm font-semibold">{item.calories} cal</span>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">{item.quantity}</div>
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>P: {item.protein}g</span>
                      <span>C: {item.carbs}g</span>
                      <span>F: {item.fat}g</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-white mb-2 block">Meal Type</Label>
              <div className="grid grid-cols-4 gap-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(type => (
                  <Button
                    key={type}
                    variant={selectedMealType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMealType(type)}
                    className={selectedMealType === type ? "bg-orange-500 hover:bg-orange-600" : "border-white/30 text-white hover:bg-white/10 bg-transparent"}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-white mb-2 block">Notes (optional)</Label>
              <Textarea 
                value={mealNotes}
                onChange={(e) => setMealNotes(e.target.value)}
                placeholder="Add any notes about this meal..."
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Button onClick={handleSaveMeal} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                <Save className="w-4 h-4 mr-2" /> Save to History
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 bg-transparent">
                    <Star className="w-4 h-4 mr-2" /> Save as Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-black/90 border-white/20">
                  <DialogHeader>
                    <DialogTitle className="text-white">Save as Template</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label className="text-white">Template Name</Label>
                      <Input 
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="e.g., My Breakfast Bowl"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Description (optional)</Label>
                      <Textarea 
                        value={newTemplateDescription}
                        onChange={(e) => setNewTemplateDescription(e.target.value)}
                        placeholder="Describe this meal..."
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <Button onClick={saveAsTemplate} disabled={!newTemplateName} className="w-full bg-orange-500 hover:bg-orange-600">
                      Save Template
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 bg-transparent" onClick={() => {
                setSelectedImage(null);
                setNutritionData(null);
                setDetectedFoods([]);
                setSelectedFoods([]);
                setMealNotes("");
                setManualEntryMode(false);
              }}>
                <RotateCcw className="w-4 h-4 mr-2" /> Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
  
  const renderHistoryView = () => {
    const todaysTotals = getTodaysTotals(savedMeals);
    const todaysWater = waterIntake;
    
    return (
      <main className="relative z-10 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black mb-4">Meal History</h1>
            <p className="text-gray-300">Track your nutrition journey</p>
          </div>
          
          {/* Today's Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="bg-black/50 border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Today's Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Calories', value: todaysTotals.calories, goal: nutritionGoals.calories, color: 'bg-orange-500' },
                  { label: 'Protein', value: Math.round(todaysTotals.protein), goal: nutritionGoals.protein, color: 'bg-green-500' },
                  { label: 'Carbs', value: Math.round(todaysTotals.carbs), goal: nutritionGoals.carbs, color: 'bg-blue-500' },
                  { label: 'Fat', value: Math.round(todaysTotals.fat), goal: nutritionGoals.fat, color: 'bg-yellow-500' },
                ].map(stat => (
                  <div key={stat.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{stat.label}</span>
                      <span className="text-white">{stat.value} / {stat.goal}</span>
                    </div>
                    <Progress value={(stat.value / stat.goal) * 100} className="h-2 bg-gray-700" indicatorClassName={stat.color} />
                  </div>
                ))}
              </CardContent>
            </Card>
            
            {/* Water Tracker */}
            <Card className="bg-black/50 border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-cyan-400" /> Water Intake
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400">{todaysWater}ml</div>
                  <div className="text-sm text-gray-400">/ {settings.dailyWaterGoal}ml goal</div>
                </div>
                <Progress value={(todaysWater / settings.dailyWaterGoal) * 100} className="h-3 bg-gray-700" indicatorClassName="bg-cyan-500" />
                <div className="flex gap-2">
                  {[250, 500, 750].map(amount => (
                    <Button key={amount} variant="outline" size="sm" onClick={() => addWater(amount)} className="flex-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                      +{amount}ml
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    value={customWaterAmount} 
                    onChange={(e) => setCustomWaterAmount(Number(e.target.value))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <Button onClick={() => addWater(customWaterAmount)} className="bg-cyan-500 hover:bg-cyan-600">Add</Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Insights */}
          {insights.length > 0 && (
            <Card className="bg-black/50 border-white/20 mb-6">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" /> Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.map((insight, index) => (
                  <Alert key={index} className={`${insight.type === 'warning' ? 'bg-red-500/10 border-red-500/30' : insight.type === 'achievement' ? 'bg-green-500/10 border-green-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
                    <AlertDescription className="flex items-start gap-2">
                      {insight.type === 'warning' ? <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" /> : insight.type === 'achievement' ? <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" /> : <Info className="w-4 h-4 text-blue-400 mt-0.5" />}
                      <div>
                        <p className="font-semibold text-white">{insight.title}</p>
                        <p className="text-sm text-gray-300">{insight.message}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
          
          {/* Meal List */}
          <div className="space-y-4">
            {savedMeals.length === 0 ? (
              <Card className="bg-black/50 border-white/20">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-400 mb-4">No meals saved yet</p>
                  <Button onClick={() => setCurrentView("analyzer")} className="bg-orange-500 hover:bg-orange-600">Analyze Your First Meal</Button>
                </CardContent>
              </Card>
            ) : (
              savedMeals.map(meal => (
                <Card key={meal.id} className="bg-black/50 border-white/20">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {meal.image && <img src={meal.image} alt="Meal" className="w-20 h-20 object-cover rounded-lg" />}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <Badge className="mb-1" style={{ backgroundColor: MEAL_TYPE_COLORS[meal.mealType] + '33', color: MEAL_TYPE_COLORS[meal.mealType], borderColor: MEAL_TYPE_COLORS[meal.mealType] + '4d' }}>
                              {meal.mealType}
                            </Badge>
                            <div className="text-sm text-gray-400">{new Date(meal.date).toLocaleDateString()} at {meal.time}</div>
                            {meal.notes && <p className="text-xs text-gray-500 mt-1 italic">"{meal.notes}"</p>}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-orange-400">{meal.nutrition.total.calories} cal</div>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteMeal(meal.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-300">
                          <span>P: {meal.nutrition.total.protein.toFixed(1)}g</span>
                          <span>C: {meal.nutrition.total.carbs.toFixed(1)}g</span>
                          <span>F: {meal.nutrition.total.fat.toFixed(1)}g</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    );
  };
  
  const renderGoalsView = () => (
    <main className="relative z-10 px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-4">Nutrition Goals</h1>
          <p className="text-gray-300">Set your daily targets</p>
        </div>
        
        <Card className="bg-black/50 border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Daily Targets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(nutritionGoals).map(([key, value]) => (
              <div key={key}>
                <Label className="text-white capitalize mb-2 block">
                  {key} {key === 'calories' ? '(kcal)' : key === 'sodium' ? '(mg)' : '(g)'}
                </Label>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm" onClick={() => setNutritionGoalsState(prev => ({ ...prev, [key]: Math.max(0, prev[key as keyof NutritionGoals] - (key === 'calories' ? 50 : key === 'sodium' ? 100 : 5)) }))}>
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-bold text-white">{value}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setNutritionGoalsState(prev => ({ ...prev, [key]: prev[key as keyof NutritionGoals] + (key === 'calories' ? 50 : key === 'sodium' ? 100 : 5) }))}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Water Goal */}
        <Card className="bg-black/50 border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Droplets className="w-5 h-5 text-cyan-400" /> Daily Water Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Slider 
                value={[settings.dailyWaterGoal]} 
                onValueChange={(value) => setSettingsState(prev => ({ ...prev, dailyWaterGoal: value[0] }))}
                min={1000} 
                max={5000} 
                step={100}
                className="flex-1"
              />
              <span className="text-white font-bold w-24 text-right">{settings.dailyWaterGoal}ml</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Goal Calculator */}
        <Card className="bg-black/50 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Smart Goal Calculator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-400">Enter your details to get personalized nutrition goals:</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Weight (kg)</Label>
                <Input placeholder="70" className="bg-white/10 border-white/20 text-white" />
              </div>
              <div>
                <Label className="text-white">Height (cm)</Label>
                <Input placeholder="175" className="bg-white/10 border-white/20 text-white" />
              </div>
              <div>
                <Label className="text-white">Age</Label>
                <Input placeholder="30" className="bg-white/10 border-white/20 text-white" />
              </div>
              <div>
                <Label className="text-white">Gender</Label>
                <Select>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full bg-orange-500 hover:bg-orange-600">Calculate Goals</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
  
  const renderAnalyticsView = () => {
    const macros = getMacroPercentages(getTodaysTotals(savedMeals));
    const mealDistribution = getMealTypeDistribution(savedMeals);
    const stats7Day = getStatsForDateRange(savedMeals, 7);
    
    return (
      <main className="relative z-10 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black mb-4">Analytics</h1>
            <p className="text-gray-300">Track your nutrition trends</p>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Avg Calories', value: stats7Day.avgCalories, icon: Flame },
              { label: 'Avg Protein', value: `${stats7Day.avgProtein}g`, icon: Beef },
              { label: 'Total Meals', value: stats7Day.totalMeals, icon: Utensils },
              { label: 'Most Common', value: stats7Day.mostCommonMealType, icon: Star },
            ].map((stat, i) => (
              <Card key={i} className="bg-black/50 border-white/20">
                <CardContent className="p-4 text-center">
                  <stat.icon className="w-6 h-6 mx-auto mb-2 text-orange-400" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Weekly Chart */}
          <Card className="bg-black/50 border-white/20 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Weekly Calorie Intake</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData.labels.map((label, i) => ({
                    day: label,
                    calories: weeklyData.calories[i],
                    goal: nutritionGoals.calories
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="day" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                    <Legend />
                    <Bar dataKey="calories" fill={CHART_COLORS.calories} name="Calories" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Macro Distribution */}
            <Card className="bg-black/50 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Today's Macro Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        { name: 'Protein', value: macros.protein },
                        { name: 'Carbs', value: macros.carbs },
                        { name: 'Fat', value: macros.fat },
                      ]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {[CHART_COLORS.protein, CHART_COLORS.carbs, CHART_COLORS.fat].map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-green-500/10 rounded p-2">
                    <div className="text-green-400 font-bold">{macros.protein}%</div>
                    <div className="text-xs text-gray-400">Protein</div>
                  </div>
                  <div className="bg-blue-500/10 rounded p-2">
                    <div className="text-blue-400 font-bold">{macros.carbs}%</div>
                    <div className="text-xs text-gray-400">Carbs</div>
                  </div>
                  <div className="bg-yellow-500/10 rounded p-2">
                    <div className="text-yellow-400 font-bold">{macros.fat}%</div>
                    <div className="text-xs text-gray-400">Fat</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Meal Type Distribution */}
            <Card className="bg-black/50 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Calories by Meal Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(mealDistribution).map(([type, calories]) => (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300 capitalize">{type}</span>
                        <span className="text-white">{calories} cal</span>
                      </div>
                      <Progress 
                        value={(calories / Math.max(...Object.values(mealDistribution))) * 100} 
                        className="h-2 bg-gray-700"
                        indicatorClassName={`bg-${MEAL_TYPE_COLORS[type as MealType].replace('#', '')}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Weight Tracking */}
          <Card className="bg-black/50 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Weight Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      step="0.1"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      placeholder="Enter weight"
                      className="bg-white/10 border-white/20 text-white"
                    />
                    <Select value={weightUnit} onValueChange={(v) => setWeightUnit(v as 'kg' | 'lbs')}>
                      <SelectTrigger className="w-24 bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea 
                    value={weightNotes}
                    onChange={(e) => setWeightNotes(e.target.value)}
                    placeholder="Notes (optional)"
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <Button onClick={handleAddWeight} className="w-full bg-orange-500 hover:bg-orange-600">Log Weight</Button>
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {weightEntries.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No weight entries yet</p>
                  ) : (
                    weightEntries.slice(0, 10).map(entry => (
                      <div key={entry.id} className="flex justify-between items-center p-2 bg-white/5 rounded">
                        <div>
                          <span className="text-white font-medium">{entry.weight} {entry.unit}</span>
                          <span className="text-xs text-gray-400 ml-2">{new Date(entry.date).toLocaleDateString()}</span>
                        </div>
                        {entry.notes && <span className="text-xs text-gray-500 italic">{entry.notes}</span>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  };
  
  const renderPlanningView = () => (
    <main className="relative z-10 px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-4">Meal Templates</h1>
          <p className="text-gray-300">Save and reuse your favorite meals</p>
        </div>
        
        {mealTemplates.length === 0 ? (
          <Card className="bg-black/50 border-white/20">
            <CardContent className="p-8 text-center">
              <Star className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400 mb-4">No templates saved yet</p>
              <p className="text-sm text-gray-500 mb-4">After analyzing a meal, you can save it as a template for quick logging</p>
              <Button onClick={() => setCurrentView("analyzer")} className="bg-orange-500 hover:bg-orange-600">Create Your First Template</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mealTemplates.map(template => (
              <Card key={template.id} className="bg-black/50 border-white/20">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">{template.name}</CardTitle>
                      {template.description && <p className="text-sm text-gray-400 mt-1">{template.description}</p>}
                    </div>
                    <Badge style={{ backgroundColor: MEAL_TYPE_COLORS[template.mealType] + '33', color: MEAL_TYPE_COLORS[template.mealType] }}>
                      {template.mealType}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-orange-400 font-bold">{template.nutrition.total.calories}</div>
                      <div className="text-xs text-gray-400">cal</div>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-green-400 font-bold">{template.nutrition.total.protein}g</div>
                      <div className="text-xs text-gray-400">protein</div>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-blue-400 font-bold">{template.nutrition.total.carbs}g</div>
                      <div className="text-xs text-gray-400">carbs</div>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-yellow-400 font-bold">{template.nutrition.total.fat}g</div>
                      <div className="text-xs text-gray-400">fat</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => useTemplate(template)} className="flex-1 bg-orange-500 hover:bg-orange-600">Use Template</Button>
                    <Button variant="outline" onClick={() => { deleteMealTemplate(template.id); setMealTemplates(getMealTemplates()); }} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
  
  const renderSettingsView = () => (
    <main className="relative z-10 px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-4">Settings</h1>
          <p className="text-gray-300">Manage your app preferences</p>
        </div>
        
        <Card className="bg-black/50 border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleExport} variant="outline" className="flex-1 border-white/30 text-white hover:bg-white/10">
                <Download className="w-4 h-4 mr-2" /> Export Data
              </Button>
              <Button onClick={() => setShowImportDialog(true)} variant="outline" className="flex-1 border-white/30 text-white hover:bg-white/10">
                <UploadIcon className="w-4 h-4 mr-2" /> Import Data
              </Button>
            </div>
            <Button onClick={handleClearAllData} variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10">
              <Trash2 className="w-4 h-4 mr-2" /> Clear All Data
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-black/50 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">P</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">ProMeals AI</h3>
                <p className="text-gray-400">Version 2.0 - Pro Edition</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              ProMeals AI is a comprehensive nutrition tracking application with local AI-powered food recognition, 
              detailed analytics, meal templates, water tracking, and weight logging. All data is stored locally 
              on your device for complete privacy.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/5 rounded p-3">
                <div className="text-orange-400 font-bold">{foodDatabase.length}+</div>
                <div className="text-gray-400">Foods in Database</div>
              </div>
              <div className="bg-white/5 rounded p-3">
                <div className="text-orange-400 font-bold">100%</div>
                <div className="text-gray-400">Private & Local</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="bg-black/90 border-white/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Import Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Alert className="bg-yellow-500/10 border-yellow-500/30">
              <AlertDescription className="text-yellow-200">
                Warning: Importing data will replace all existing data. Make sure to export a backup first!
              </AlertDescription>
            </Alert>
            <Textarea 
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste your exported JSON data here..."
              className="bg-white/10 border-white/20 text-white min-h-[200px] font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button onClick={() => setShowImportDialog(false)} variant="outline" className="flex-1 border-white/30 text-white">Cancel</Button>
              <Button onClick={handleImport} disabled={!importData.trim()} className="flex-1 bg-orange-500 hover:bg-orange-600">Import</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('/delicious-colorful-healthy-meal-bowl-with-salmon-v.png')` }}>
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <header className="relative z-10 p-6">
        <div className="flex items-center justify-between">
          <Link href="/" onClick={() => setCurrentView("analyzer")} className="flex items-center gap-3 cursor-pointer select-none group">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors group-hover:text-orange-300">ProMeals</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Today's Calories:</span>
              <span className="text-orange-400 font-bold">{getTodaysTotals(savedMeals).calories} / {nutritionGoals.calories}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 font-bold">{waterIntake}ml</span>
            </div>
          </div>
        </div>
      </header>

      {currentView === "analyzer" && renderAnalyzerView()}
      {currentView === "history" && renderHistoryView()}
      {currentView === "goals" && renderGoalsView()}
      {currentView === "analytics" && renderAnalyticsView()}
      {currentView === "planning" && renderPlanningView()}
      {currentView === "settings" && renderSettingsView()}

      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-white/20 z-20">
        <div className="flex justify-around py-2">
          {[
            { view: "analyzer" as View, icon: Home, label: "Analyze" },
            { view: "history" as View, icon: History, label: "History" },
            { view: "analytics" as View, icon: BarChart3, label: "Stats" },
            { view: "planning" as View, icon: Calendar, label: "Templates" },
            { view: "goals" as View, icon: Target, label: "Goals" },
            { view: "settings" as View, icon: Settings, label: "Settings" },
          ].map(({ view, icon: Icon, label }) => (
            <Button
              key={view}
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView(view)}
              className={`flex flex-col items-center gap-1 px-2 ${currentView === view ? "text-orange-400" : "text-gray-400"}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{label}</span>
            </Button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// Helper component for the stats
function Flame(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
