import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { nutritionAPI } from '../services/api';

// Falls back to localhost if the env variable isn't set
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Nutritional values per 100g for each of the 10 supported foods
// These are used to calculate nutrients for any serving size the user enters
const SCAN_FOODS = {
  avocado_toast:         { name: 'Avocado Toast',          emoji: '🥑', calories: 200, protein: 5.0,  carbs: 20.0, fiber: 5.0,  fats: 11.0 },
  boiled_eggs:           { name: 'Boiled Eggs',            emoji: '🥚', calories: 155, protein: 13.0, carbs: 1.1,  fiber: 0.0,  fats: 11.0 },
  dumplings:             { name: 'Dumplings',              emoji: '🥟', calories: 150, protein: 7.0,  carbs: 22.0, fiber: 1.0,  fats: 4.0  },
  french_fries:          { name: 'French Fries',           emoji: '🍟', calories: 312, protein: 3.4,  carbs: 41.0, fiber: 3.8,  fats: 15.0 },
  french_toast:          { name: 'French Toast',           emoji: '🍞', calories: 229, protein: 8.6,  carbs: 27.0, fiber: 1.0,  fats: 9.5  },
  garlic_bread:          { name: 'Garlic Bread',           emoji: '🧄', calories: 350, protein: 8.0,  carbs: 45.0, fiber: 2.0,  fats: 15.0 },
  grilled_chicken_breast:{ name: 'Grilled Chicken Breast', emoji: '🍗', calories: 165, protein: 31.0, carbs: 0.0,  fiber: 0.0,  fats: 3.6  },
  oatmeal:               { name: 'Oatmeal',                emoji: '🥣', calories: 71,  protein: 2.5,  carbs: 12.0, fiber: 1.7,  fats: 1.5  },
  omelette:              { name: 'Omelette',               emoji: '🍳', calories: 154, protein: 10.6, carbs: 0.4,  fiber: 0.0,  fats: 12.0 },
  pancakes:              { name: 'Pancakes',               emoji: '🥞', calories: 227, protein: 6.0,  carbs: 38.0, fiber: 1.0,  fats: 6.0  },
};

// Scales per-100g values to the user's actual serving size
const calculateNutrients = (food, grams) => {
  const r = grams / 100;
  return {
    calories: Math.round(food.calories * r),
    protein:  parseFloat((food.protein * r).toFixed(1)),
    carbs:    parseFloat((food.carbs   * r).toFixed(1)),
    fiber:    parseFloat((food.fiber   * r).toFixed(1)),
    fats:     parseFloat((food.fats    * r).toFixed(1)),
  };
};

// Mini progress bar used in the nutrients breakdown section
const NutrientBar = ({ label, value, unit, color, max }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="text-gray-800 font-semibold">{value}{unit}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const ScanFoodPage = () => {
  const [image, setImage] = useState(null);       // Object URL for previewing the selected image
  const [imageFile, setImageFile] = useState(null); // The actual File object sent to the backend
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);     // { food_id, food, nutrients, confidence }
  const [error, setError] = useState(null);
  const [grams, setGrams] = useState(100);        // Serving size — updates nutrient values in real time
  const [showMealPicker, setShowMealPicker] = useState(false); // Meal type selection step
  const [logging, setLogging] = useState(false);
  const fileInputRef = useRef(null); // Used to programmatically open the file browser

  // Handles file selection via the file input
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please upload an image file.'); return; }
    setImageFile(file);
    setImage(URL.createObjectURL(file)); // Creates a local URL for the preview
    setResult(null);
    setError(null);
  };

  // Handles drag-and-drop file upload
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    setImageFile(file);
    setImage(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  // Sends the image to the backend AI endpoint for food recognition
  // The backend returns a food_id which we look up in SCAN_FOODS for nutrition data
  const handleScan = async () => {
    if (!imageFile) return;
    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      // Use raw axios here (not the api instance) because multipart/form-data needs a different Content-Type
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API_BASE}/foodscan/analyze/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });

      const { food_id, confidence } = response.data;
      const food = SCAN_FOODS[food_id];

      if (!food) {
        setError('Food not recognized. Try one of the supported foods or a clearer photo.');
      } else {
        setResult({ food_id, food, nutrients: calculateNutrients(food, grams), confidence });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not analyze the image. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  // Recalculates nutrients live as the user changes the serving size
  const handleGramsChange = (newGrams) => {
    setGrams(newGrams);
    if (result) {
      setResult((prev) => ({ ...prev, nutrients: calculateNutrients(prev.food, newGrams) }));
    }
  };

  // Creates a meal entry in the Nutrition page with the scanned food's data
  const handleLogFood = async (mealType) => {
    if (!result) return;
    setLogging(true);
    try {
      await nutritionAPI.createMeal({
        name: result.food.name,
        meal_type: mealType,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        calories: result.nutrients.calories,
        protein: result.nutrients.protein,
        carbs: result.nutrients.carbs,
        fiber: result.nutrients.fiber,
        fats: result.nutrients.fats,
        notes: `${grams}g serving`, // Records the portion size in the meal notes
      });
      toast.success(`${result.food.name} logged to ${mealType}`);
      setShowMealPicker(false);
    } catch {
      toast.error('Failed to log food. Please try again.');
    } finally {
      setLogging(false);
    }
  };

  // Resets all state so the user can scan a different food
  const handleReset = () => {
    setImage(null);
    setImageFile(null);
    setResult(null);
    setError(null);
    setGrams(100);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Scan Food</h1>
        <p className="text-gray-500 mt-1">Upload a photo of your food to get its nutritional values instantly.</p>
      </div>

      <div className="grid gap-6">
        {/* Upload card — shows drag-drop area before image is selected, preview after */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {!image ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-teal-200 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-700 font-semibold text-lg">Drop your food photo here</p>
              <p className="text-gray-400 text-sm mt-1">or click to browse</p>
              <p className="text-gray-300 text-xs mt-3">JPG, PNG supported</p>
              {/* Hidden input — triggered programmatically when the drop zone is clicked */}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFileChange} />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image preview with an X button to remove it */}
              <div className="relative rounded-xl overflow-hidden bg-gray-50">
                <img src={image} alt="Food to scan" className="w-full max-h-72 object-contain" />
                <button onClick={handleReset} className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Serving size input — changing this recalculates nutrients without re-scanning */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Serving size</label>
                <input
                  type="number" min="1" max="2000" value={grams}
                  onChange={(e) => handleGramsChange(Number(e.target.value))}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                <span className="text-sm text-gray-500">grams</span>
              </div>

              <button
                onClick={handleScan}
                disabled={scanning}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {scanning ? <><Loader2 className="w-5 h-5 animate-spin" />Analyzing...</> : <><Upload className="w-5 h-5" />Analyze Food</>}
              </button>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Result card — shown after a successful scan */}
        {result && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl flex items-center justify-center text-3xl">
                {result.food.emoji}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-800">{result.food.name}</h2>
                  <CheckCircle2 className="w-5 h-5 text-teal-500" />
                </div>
                {/* Confidence badge — colour changes based on how certain the model is */}
                {result.confidence != null && (
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    result.confidence >= 0.8 ? 'bg-green-100 text-green-700'
                    : result.confidence >= 0.5 ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                  }`}>
                    {Math.round(result.confidence * 100)}% confident
                  </div>
                )}
                <p className="text-sm text-gray-400">Per {grams}g serving</p>
              </div>
            </div>

            {/* Calorie highlight */}
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl p-4 mb-5 text-white flex items-center justify-between">
              <span className="font-medium">Calories</span>
              <span className="text-3xl font-bold">{result.nutrients.calories} <span className="text-lg font-normal">kcal</span></span>
            </div>

            {/* Macro breakdown with progress bars */}
            <div className="space-y-4">
              <NutrientBar label="Protein"       value={result.nutrients.protein} unit="g" color="bg-teal-400"  max={60}  />
              <NutrientBar label="Carbohydrates" value={result.nutrients.carbs}   unit="g" color="bg-cyan-400"  max={100} />
              <NutrientBar label="Fats"          value={result.nutrients.fats}    unit="g" color="bg-amber-400" max={60}  />
              <NutrientBar label="Fiber"         value={result.nutrients.fiber}   unit="g" color="bg-green-400" max={30}  />
            </div>

            {/* Log food section — first shows "Log Food" button, then meal type picker */}
            <div className="mt-6 space-y-3">
              {!showMealPicker ? (
                <button
                  onClick={() => setShowMealPicker(true)}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl text-sm font-semibold hover:from-teal-600 hover:to-cyan-600 transition"
                >
                  Log Food
                </button>
              ) : (
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3 text-center">Which meal is this?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '🍳 Breakfast', value: 'breakfast' },
                      { label: '🍱 Lunch', value: 'lunch' },
                      { label: '🍽️ Dinner', value: 'dinner' },
                      { label: '🍎 Snack', value: 'snack' },
                    ].map(({ label, value }) => (
                      <button
                        key={value}
                        onClick={() => handleLogFood(value)}
                        disabled={logging}
                        className="py-2.5 bg-white border border-teal-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-teal-100 hover:border-teal-400 transition disabled:opacity-50"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowMealPicker(false)}
                    className="mt-2 w-full text-xs text-gray-400 hover:text-gray-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <button onClick={handleReset} className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                Scan Another Food
              </button>
            </div>
          </div>
        )}

        {/* Reference list of supported foods shown at the bottom */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Supported Foods</p>
            <span className="text-xs text-teal-500 font-medium">{Object.keys(SCAN_FOODS).length} foods</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SCAN_FOODS).map(([id, food]) => (
              <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-600">
                {food.emoji} {food.name}
              </span>
            ))}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 border border-teal-200 border-dashed rounded-full text-xs text-teal-500 font-medium">
              + More coming soon
            </span>
          </div>
          <p className="text-xs text-gray-300 mt-3">More food categories will be added in future updates.</p>
        </div>
      </div>
    </div>
  );
};

export default ScanFoodPage;
