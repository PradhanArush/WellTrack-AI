import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { nutritionAPI, authAPI } from '../services/api';
import { Flame, Target, TrendingUp, Droplet, Apple, Trash2, Zap, PenLine, Droplets, X } from 'lucide-react';
import { FOODS, calculateNutrients } from '../data/foodData';

const NutritionPage = () => {
  const { state } = useLocation();
  const [meals, setMeals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showQuickAdd, setShowQuickAdd] = useState(state?.openModal === true);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [deleteMealId, setDeleteMealId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const isFutureDate = selectedDate > today;

  // User goals from profile
  const [userGoals, setUserGoals] = useState({ calories: 2000, protein: 150, carbs: 250, fiber: 30, fats: 65 });

  // Hydration state
  const [waterLogs, setWaterLogs] = useState([]);
  const [waterGoal, setWaterGoal] = useState(2000);
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [newGoalInput, setNewGoalInput] = useState('');
  const [customWaterMl, setCustomWaterMl] = useState('');

  useEffect(() => {
    fetchData();
    fetchWaterData();
    fetchUserGoal();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mealsRes, summaryRes] = await Promise.all([
        nutritionAPI.getMeals(selectedDate),
        nutritionAPI.getDailySummary(selectedDate),
      ]);
      setMeals(mealsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWaterData = async () => {
    try {
      const res = await nutritionAPI.getWaterIntake(selectedDate);
      setWaterLogs(res.data);
    } catch (error) {
      console.error('Error fetching water data:', error);
    }
  };

  const fetchUserGoal = async () => {
    try {
      const res = await authAPI.getProfile();
      const d = res.data;
      setWaterGoal(d.water_goal_ml || 2000);
      setUserGoals({
        calories: d.calorie_goal || 2000,
        protein: d.protein_goal || 150,
        carbs: d.carbs_goal || 250,
        fiber: d.fiber_goal || 30,
        fats: d.fats_goal || 65,
      });
    } catch (error) {
      console.error('Error fetching user goal:', error);
    }
  };

  const handleDeleteMeal = async () => {
    try {
      await nutritionAPI.deleteMeal(deleteMealId);
      setDeleteMealId(null);
      fetchData();
      toast.success('Meal deleted');
    } catch (error) {
      toast.error('Failed to delete meal');
    }
  };

  const handleLogWater = async (ml) => {
    try {
      await nutritionAPI.logWater({
        date: selectedDate,
        amount_ml: ml,
        time: new Date().toTimeString().slice(0, 5),
      });
      fetchWaterData();
      toast.success(`${ml}ml water logged`);
    } catch (error) {
      toast.error('Failed to log water');
    }
  };

  const handleDeleteWater = async (id) => {
    try {
      await nutritionAPI.deleteWater(id);
      fetchWaterData();
      toast.success('Water log removed');
    } catch (error) {
      toast.error('Failed to remove water log');
    }
  };

  const handleSaveWaterGoal = async () => {
    const val = parseInt(newGoalInput);
    if (!val || val < 100) return;
    try {
      await authAPI.updateProfile({ water_goal_ml: val });
      setWaterGoal(val);
      setShowGoalEdit(false);
      setNewGoalInput('');
      toast.success('Water goal updated');
    } catch (error) {
      toast.error('Failed to update water goal');
    }
  };

  const totalWaterMl = waterLogs.reduce((sum, log) => sum + log.amount_ml, 0);
  const waterPercent = Math.min((totalWaterMl / waterGoal) * 100, 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-2xl text-teal-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Nutrition Tracker</h1>
          <p className="text-gray-600 mt-1">Track your daily nutrition and reach your goals</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto flex-wrap">
          <input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
          />
          <button
            onClick={() => !isFutureDate && setShowQuickAdd(true)}
            disabled={isFutureDate}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition shadow-md whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            <span>Quick Add</span>
          </button>
          <button
            onClick={() => !isFutureDate && setShowManualAdd(true)}
            disabled={isFutureDate}
            className="flex items-center space-x-2 px-5 py-2.5 bg-white border-2 border-teal-500 text-teal-600 rounded-lg hover:bg-teal-50 transition whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PenLine className="w-4 h-4" />
            <span>Manual Add</span>
          </button>
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <NutritionCard label="Calories" value={summary?.total_calories || 0} goal={userGoals.calories} unit="kcal" color="from-red-400 to-orange-500" icon={Flame} />
        <NutritionCard label="Protein" value={summary?.total_protein || 0} goal={userGoals.protein} unit="g" color="from-blue-400 to-cyan-500" icon={Target} />
        <NutritionCard label="Carbs" value={summary?.total_carbs || 0} goal={userGoals.carbs} unit="g" color="from-yellow-400 to-amber-500" icon={TrendingUp} />
        <NutritionCard label="Fiber" value={summary?.total_fiber || 0} goal={userGoals.fiber} unit="g" color="from-green-400 to-emerald-500" icon={Target} />
        <NutritionCard label="Fats" value={summary?.total_fats || 0} goal={userGoals.fats} unit="g" color="from-purple-400 to-pink-500" icon={Droplet} />
      </div>

      {/* Macro Breakdown Chart */}
      {summary && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Macro Breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={[
                { name: 'Protein', Consumed: Math.round(summary.total_protein || 0), Goal: userGoals.protein },
                { name: 'Carbs', Consumed: Math.round(summary.total_carbs || 0), Goal: userGoals.carbs },
                { name: 'Fiber', Consumed: Math.round(summary.total_fiber || 0), Goal: userGoals.fiber },
                { name: 'Fats', Consumed: Math.round(summary.total_fats || 0), Goal: userGoals.fats },
              ]}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="g" />
              <Tooltip formatter={(value) => `${value}g`} />
              <Legend />
              <Bar dataKey="Consumed" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Goal" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Meals List */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {selectedDate === today ? "Today's Meals" : `Meals for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
        </h2>
        {meals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Apple className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No meals logged yet. Start tracking your nutrition!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((meal) => (
              <MealItem key={meal.id} meal={meal} onDelete={() => setDeleteMealId(meal.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Hydration Tracker */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-800">Hydration Tracker</h2>
          </div>
          <button
            onClick={() => { setShowGoalEdit(!showGoalEdit); setNewGoalInput(waterGoal); }}
            className="text-sm text-teal-600 hover:underline flex items-center gap-1"
          >
            <Target className="w-4 h-4" />
            Set Goal
          </button>
        </div>

        {/* Goal editor */}
        {showGoalEdit && (
          <div className="flex items-center gap-3 mb-5 p-3 bg-teal-50 rounded-lg">
            <label className="text-sm text-gray-600 whitespace-nowrap">Daily goal (ml):</label>
            <input
              type="number"
              value={newGoalInput}
              onChange={(e) => setNewGoalInput(e.target.value)}
              className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm"
              placeholder="2000"
            />
            <button
              onClick={handleSaveWaterGoal}
              className="px-4 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg text-sm hover:from-teal-600 hover:to-cyan-600 transition"
            >
              Save
            </button>
            <button onClick={() => setShowGoalEdit(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Progress */}
        <div className="mb-5">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">{totalWaterMl} ml consumed</span>
            <span>Goal: {waterGoal} ml</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-400 to-cyan-400 h-4 rounded-full transition-all duration-500"
              style={{ width: `${waterPercent}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">{Math.round(waterPercent)}% of daily goal</div>
        </div>

        {/* Quick add buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[150, 250, 350, 500].map((ml) => (
            <button
              key={ml}
              onClick={() => handleLogWater(ml)}
              className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-sm hover:bg-blue-100 transition font-medium"
            >
              + {ml} ml
            </button>
          ))}
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={customWaterMl}
              onChange={(e) => setCustomWaterMl(e.target.value)}
              placeholder="Custom ml"
              className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            />
            <button
              onClick={() => {
                const val = parseInt(customWaterMl);
                if (val > 0) { handleLogWater(val); setCustomWaterMl(''); }
              }}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg text-sm hover:from-teal-600 hover:to-cyan-600 transition"
            >
              Add
            </button>
          </div>
        </div>

        {/* Water log list */}
        {waterLogs.length > 0 && (
          <div className="space-y-2 mt-4 border-t pt-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Today's log</p>
            {waterLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Droplets className="w-4 h-4" />
                  <span>{log.amount_ml} ml</span>
                  <span className="text-blue-400">· {log.time?.slice(0, 5)}</span>
                </div>
                <button onClick={() => handleDeleteWater(log.id)} className="text-red-400 hover:text-red-600 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddModal
          onClose={() => setShowQuickAdd(false)}
          onSuccess={() => { setShowQuickAdd(false); fetchData(); }}
          selectedDate={selectedDate}
        />
      )}

      {/* Manual Add Modal */}
      {showManualAdd && (
        <ManualAddModal
          onClose={() => setShowManualAdd(false)}
          onSuccess={() => { setShowManualAdd(false); fetchData(); }}
          selectedDate={selectedDate}
        />
      )}

      {/* Delete Meal Confirmation Modal */}
      {deleteMealId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteMealId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 flex flex-col items-center animate-slideUp">
            <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Delete Meal?</h2>
            <p className="text-gray-500 text-sm text-center mb-6">
              This meal will be permanently removed from your log.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteMealId(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMeal}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 transition font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Nutrition Card ───────────────────────────────────────────────────────────

const NutritionCard = ({ label, value, goal, unit, color, icon: Icon }) => {
  const percentage = Math.min((value / goal) * 100, 100);
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div className="text-2xl font-bold text-gray-800 mb-1">
        {Math.round(value)}<span className="text-sm text-gray-500">/{goal}</span>
      </div>
      <div className="text-xs text-gray-500 mb-2">{unit}</div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`bg-gradient-to-r ${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

// ─── Meal Item ────────────────────────────────────────────────────────────────

const MealItem = ({ meal, onDelete }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
    <div className="flex-1">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getMealEmoji(meal.meal_type)}</span>
        <div>
          <div className="font-medium text-gray-800">{meal.name}</div>
          <div className="text-sm text-gray-500">
            {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)} · {meal.time}
            {meal.notes && <span className="ml-1 text-teal-600 font-medium">· {meal.notes}</span>}
          </div>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-6">
      <div className="text-right">
        <div className="font-bold text-gray-800">{meal.calories} kcal</div>
        <div className="text-xs text-gray-500 space-y-0.5">
          <div>Protein: {Math.round(meal.protein)}g · Carbs: {Math.round(meal.carbs)}g</div>
          <div>Fiber: {Math.round(meal.fiber)}g · Fats: {Math.round(meal.fats)}g</div>
        </div>
      </div>
      <button onClick={() => onDelete(meal.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  </div>
);

const getMealEmoji = (type) => ({ breakfast: '🍳', lunch: '🍱', dinner: '🍽️', snack: '🍎' }[type] || '🍽️');

// ─── Quick Add Modal ──────────────────────────────────────────────────────────

const QuickAddModal = ({ onClose, onSuccess, selectedDate }) => {
  const [selectedFood, setSelectedFood] = useState(null);
  const [grams, setGrams] = useState('');
  const [mealType, setMealType] = useState('breakfast');
  const [loading, setLoading] = useState(false);

  const gramsValue = selectedFood?.gramsPerUnit
    ? parseFloat(grams) * selectedFood.gramsPerUnit
    : parseFloat(grams);

  const nutrients = selectedFood && grams && parseFloat(grams) > 0
    ? calculateNutrients(selectedFood, gramsValue)
    : null;

  const handleSubmit = async () => {
    if (!selectedFood || !grams || parseFloat(grams) <= 0) return;
    setLoading(true);
    const unit = selectedFood.unit || 'item';
    const unitPlural = unit === 'ml' || parseFloat(grams) === 1 ? unit : `${unit}s`;
    const servingNote = selectedFood.gramsPerUnit
      ? `${grams} ${unitPlural} (${gramsValue}g)`
      : `${grams}g serving`;
    try {
      await nutritionAPI.createMeal({
        name: selectedFood.name,
        meal_type: mealType,
        date: selectedDate,
        time: new Date().toTimeString().slice(0, 5),
        calories: nutrients.calories,
        protein: nutrients.protein,
        carbs: nutrients.carbs,
        fiber: nutrients.fiber,
        fats: nutrients.fats,
        notes: servingNote,
      });
      toast.success(`${selectedFood.name} added`);
      onSuccess();
    } catch (error) {
      toast.error('Failed to add meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold text-gray-800">Quick Add</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Food selector */}
        <p className="text-sm font-medium text-gray-600 mb-3">Select a food</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {FOODS.map((food) => (
            <button
              key={food.id}
              onClick={() => setSelectedFood(food)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${
                selectedFood?.id === food.id
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl">{food.emoji}</span>
              <div>
                <div className="font-medium text-gray-800 text-sm">{food.name}</div>
                <div className="text-xs text-gray-400">{food.per100g.calories} kcal/100g</div>
              </div>
            </button>
          ))}
        </div>

        {selectedFood && (
          <>
            {/* Grams input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {selectedFood.gramsPerUnit
                  ? selectedFood.unit === 'ml'
                    ? `How many ml of ${selectedFood.name}?`
                    : `How many ${selectedFood.unit}s?`
                  : `How many grams of ${selectedFood.name}?`}
              </label>
              <input
                type="number"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder={selectedFood.gramsPerUnit ? 'e.g. 2' : 'e.g. 150'}
                min="1"
              />
              {selectedFood.gramsPerUnit && grams && parseFloat(grams) > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {grams} {selectedFood.unit === 'ml' || parseFloat(grams) === 1 ? selectedFood.unit : `${selectedFood.unit}s`} ≈ {gramsValue}g
                </p>
              )}
            </div>

            {/* Meal type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            {/* Calculated nutrients preview */}
            {nutrients && (
              <div className="bg-teal-50 rounded-xl p-4 mb-5">
                <p className="text-sm font-semibold text-teal-700 mb-2">
                  {selectedFood.gramsPerUnit
                    ? `Calculated for ${grams} ${selectedFood.unit === 'ml' || parseFloat(grams) === 1 ? selectedFood.unit : `${selectedFood.unit}s`}`
                    : `Calculated for ${grams}g`}
                </p>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    { label: 'Calories', value: `${nutrients.calories}`, unit: 'kcal' },
                    { label: 'Protein', value: `${nutrients.protein}`, unit: 'g' },
                    { label: 'Carbs', value: `${nutrients.carbs}`, unit: 'g' },
                    { label: 'Fiber', value: `${nutrients.fiber}`, unit: 'g' },
                    { label: 'Fats', value: `${nutrients.fats}`, unit: 'g' },
                  ].map((n) => (
                    <div key={n.label} className="bg-white rounded-lg py-2 px-1">
                      <div className="font-bold text-gray-800 text-sm">{n.value}</div>
                      <div className="text-xs text-gray-400">{n.unit}</div>
                      <div className="text-xs text-gray-500">{n.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex space-x-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFood || !grams || parseFloat(grams) <= 0 || loading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Meal'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Manual Add Modal ─────────────────────────────────────────────────────────

const ManualAddModal = ({ onClose, onSuccess, selectedDate }) => {
  const [formData, setFormData] = useState({
    name: '',
    meal_type: 'breakfast',
    date: selectedDate,
    time: new Date().toTimeString().slice(0, 5),
    calories: '',
    protein: '',
    carbs: '',
    fiber: '',
    fats: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await nutritionAPI.createMeal(formData);
      toast.success(`${formData.name} added`);
      onSuccess();
    } catch (error) {
      toast.error('Failed to add meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Manual Add</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meal Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              placeholder="e.g., Grilled Chicken Salad"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
              <select
                value={formData.meal_type}
                onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
              <input type="number" required value={formData.calories} onChange={(e) => setFormData({ ...formData, calories: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
              <input type="number" step="0.1" required value={formData.protein} onChange={(e) => setFormData({ ...formData, protein: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="30" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
              <input type="number" step="0.1" required value={formData.carbs} onChange={(e) => setFormData({ ...formData, carbs: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="45" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fiber (g)</label>
              <input type="number" step="0.1" required value={formData.fiber} onChange={(e) => setFormData({ ...formData, fiber: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="8" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fats (g)</label>
              <input type="number" step="0.1" required value={formData.fats} onChange={(e) => setFormData({ ...formData, fats: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" placeholder="12" />
            </div>
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition disabled:opacity-50">
              {loading ? 'Adding...' : 'Add Meal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NutritionPage;
