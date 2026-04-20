import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Apple, Activity, Moon, TrendingUp, Droplets, Flame, Heart, Target, Pencil, X, Check } from 'lucide-react';
import { nutritionAPI, sleepAPI, authAPI, activityAPI } from '../services/api';

// 20 rotating wellness tips — 4 random ones are shown each time the dashboard loads
const ALL_TIPS = [
  "Drinking water before meals can help with portion control and digestion.",
  "Aim for at least 7–9 hours of sleep each night for optimal recovery.",
  "A 10-minute walk after meals can improve blood sugar levels significantly.",
  "Eating slowly and chewing thoroughly helps your brain register fullness.",
  "Protein at breakfast keeps you fuller longer and reduces cravings.",
  "Stretching for 5 minutes in the morning improves circulation and flexibility.",
  "Avoid screens 30 minutes before bed to improve sleep quality.",
  "Eating a rainbow of vegetables ensures a wide range of nutrients.",
  "Short rest periods between sets during workouts improve muscle endurance.",
  "Staying hydrated improves focus, energy, and physical performance.",
  "Healthy fats like avocado and nuts support brain function and heart health.",
  "Fiber-rich foods like oats and legumes support a healthy gut microbiome.",
  "Taking the stairs instead of the elevator adds up over time.",
  "Meal prepping on weekends makes healthy eating easier during the week.",
  "Deep breathing exercises can reduce stress and lower blood pressure.",
  "Limiting added sugar reduces inflammation and supports stable energy levels.",
  "Standing up and moving every hour reduces the risks of a sedentary lifestyle.",
  "Consistency matters more than perfection — small daily habits add up.",
  "Cold showers in the morning can boost alertness and circulation.",
  "Spending time outdoors in sunlight supports vitamin D production and mood.",
];

// Randomly picks 4 tips from the full list each render
const getRandomTips = () => {
  const shuffled = [...ALL_TIPS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
};

// Returns a time-of-day greeting based on the current hour
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const today = new Date().toISOString().split('T')[0];

// Full list of available dashboard metrics — each has a unique id, icon, and colour theme
const ALL_METRICS = [
  {
    id: 'calories',
    label: 'Calories Today',
    icon: (cls) => <Flame className={`w-5 h-5 ${cls || 'text-orange-500'}`} />,
    barColor: 'bg-orange-400',
    border: 'border-orange-100',
    iconClass: 'text-orange-500',
  },
  {
    id: 'water',
    label: 'Hydration Today',
    icon: (cls) => <Droplets className={`w-5 h-5 ${cls || 'text-blue-500'}`} />,
    barColor: 'bg-blue-400',
    border: 'border-blue-100',
    iconClass: 'text-blue-500',
  },
  {
    id: 'sleep',
    label: 'Sleep Last Night',
    icon: (cls) => <Moon className={`w-5 h-5 ${cls || 'text-purple-500'}`} />,
    barColor: 'bg-purple-400',
    border: 'border-purple-100',
    iconClass: 'text-purple-500',
  },
  {
    id: 'calories_burned',
    label: 'Calories Burned',
    icon: (cls) => <Activity className={`w-5 h-5 ${cls || 'text-red-500'}`} />,
    barColor: 'bg-red-400',
    border: 'border-red-100',
    iconClass: 'text-red-500',
  },
  {
    id: 'protein',
    label: 'Protein Today',
    icon: (cls) => <Heart className={`w-5 h-5 ${cls || 'text-pink-500'}`} />,
    barColor: 'bg-pink-400',
    border: 'border-pink-100',
    iconClass: 'text-pink-500',
  },
  {
    id: 'carbs',
    label: 'Carbs Today',
    icon: (cls) => <Apple className={`w-5 h-5 ${cls || 'text-yellow-500'}`} />,
    barColor: 'bg-yellow-400',
    border: 'border-yellow-100',
    iconClass: 'text-yellow-500',
  },
  {
    id: 'fats',
    label: 'Fats Today',
    icon: (cls) => <Target className={`w-5 h-5 ${cls || 'text-amber-500'}`} />,
    barColor: 'bg-amber-400',
    border: 'border-amber-100',
    iconClass: 'text-amber-500',
  },
  {
    id: 'fiber',
    label: 'Fiber Today',
    icon: (cls) => <TrendingUp className={`w-5 h-5 ${cls || 'text-green-500'}`} />,
    barColor: 'bg-green-400',
    border: 'border-green-100',
    iconClass: 'text-green-500',
  },
];

const DEFAULT_WIDGETS = ['calories', 'water', 'sleep']; // Shown until the user customizes
const MAX_WIDGETS = 3; // Dashboard only shows 3 metrics at a time

const DashboardPage = ({ user }) => {
  // Extract first name for the greeting
  const name = user?.full_name?.split(' ')[0] || user?.username || 'there';
  const dailyTips = getRandomTips();

  // Read the calories burned goal from localStorage (set on ActivityPage)
  const calsBurnedGoal = (() => {
    const saved = parseInt(localStorage.getItem('calories_burned_daily_goal'), 10);
    return isNaN(saved) ? 500 : saved;
  })();

  // All metric values loaded from the backend
  const [data, setData] = useState({
    calories: { consumed: 0, goal: 2000 },
    water: { consumed: 0, goal: 2000 },
    sleep: { hours: null, goal: 8 },
    calories_burned: { value: 0, goal: calsBurnedGoal },
    protein: { value: 0, goal: 150 },
    carbs: { value: 0, goal: 250 },
    fats: { value: 0, goal: 65 },
    fiber: { value: 0, goal: 25 },
  });
  const [loading, setLoading] = useState(true);

  // Which 3 widgets the user has chosen — persisted to their profile on the backend
  const [selectedWidgets, setSelectedWidgets] = useState(DEFAULT_WIDGETS);

  // Edit mode state — pendingWidgets holds the in-progress selection before the user saves
  const [editMode, setEditMode] = useState(false);
  const [pendingWidgets, setPendingWidgets] = useState([]);

  // Fetch all data in parallel using Promise.all for efficiency
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [summaryRes, waterRes, sleepRes, profileRes, activitiesRes] = await Promise.all([
          nutritionAPI.getDailySummary(today),
          nutritionAPI.getWaterIntake(today),
          sleepAPI.getSleepLogs(today),
          authAPI.getProfile(),
          activityAPI.getActivities(today),
        ]);

        const profile = profileRes.data;
        const summary = summaryRes.data;
        const waterLogs = waterRes.data;
        const sleepLogs = sleepRes.data;
        const activities = activitiesRes.data;

        // Compute aggregates from the raw arrays
        const totalWater = waterLogs.reduce((sum, l) => sum + (l.amount_ml || 0), 0);
        const todaySleep = sleepLogs.find((l) => l.date === today);
        const totalBurned = activities.reduce((sum, a) => sum + (a.calories_burned || 0), 0);

        setData({
          calories: {
            consumed: Math.round(summary.total_calories || 0),
            goal: profile.calorie_goal || 2000,
          },
          water: {
            consumed: totalWater,
            goal: profile.water_goal_ml || 2000,
          },
          sleep: {
            hours: todaySleep ? parseFloat(todaySleep.duration_hours).toFixed(1) : null,
            goal: 8,
          },
          calories_burned: {
            value: totalBurned,
            goal: calsBurnedGoal,
          },
          protein: {
            value: Math.round(summary.total_protein || 0),
            goal: profile.protein_goal || 150,
          },
          carbs: {
            value: Math.round(summary.total_carbs || 0),
            goal: profile.carbs_goal || 250,
          },
          fats: {
            value: Math.round(summary.total_fats || 0),
            goal: profile.fats_goal || 65,
          },
          fiber: {
            value: Math.round(summary.total_fiber || 0),
            goal: profile.fiber_goal || 25,
          },
        });

        // Load saved widget preferences from the user's profile if they exist
        if (Array.isArray(profile.dashboard_widgets) && profile.dashboard_widgets.length > 0) {
          setSelectedWidgets(profile.dashboard_widgets.slice(0, MAX_WIDGETS));
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Converts the raw data state into display-ready strings and a percentage for progress bars
  const getMetricProps = (id) => {
    switch (id) {
      case 'calories':
        return {
          value: `${data.calories.consumed.toLocaleString()} kcal`,
          sub: `Goal: ${data.calories.goal.toLocaleString()} kcal`,
          percent: Math.min(Math.round((data.calories.consumed / data.calories.goal) * 100), 100),
        };
      case 'water':
        return {
          value: `${data.water.consumed} ml`,
          sub: `Goal: ${data.water.goal} ml`,
          percent: Math.min(Math.round((data.water.consumed / data.water.goal) * 100), 100),
        };
      case 'sleep':
        return {
          value: data.sleep.hours ? `${data.sleep.hours}h` : '—',
          sub: data.sleep.hours ? `Goal: ${data.sleep.goal}h` : 'Not logged yet',
          percent: data.sleep.hours
            ? Math.min(Math.round((parseFloat(data.sleep.hours) / data.sleep.goal) * 100), 100)
            : 0,
        };
      case 'calories_burned':
        return {
          value: `${data.calories_burned.value} kcal`,
          sub: `Goal: ${data.calories_burned.goal} kcal`,
          percent: Math.min(Math.round((data.calories_burned.value / data.calories_burned.goal) * 100), 100),
        };
      case 'protein':
        return {
          value: `${data.protein.value}g`,
          sub: `Goal: ${data.protein.goal}g`,
          percent: Math.min(Math.round((data.protein.value / data.protein.goal) * 100), 100),
        };
      case 'carbs':
        return {
          value: `${data.carbs.value}g`,
          sub: `Goal: ${data.carbs.goal}g`,
          percent: Math.min(Math.round((data.carbs.value / data.carbs.goal) * 100), 100),
        };
      case 'fats':
        return {
          value: `${data.fats.value}g`,
          sub: `Goal: ${data.fats.goal}g`,
          percent: Math.min(Math.round((data.fats.value / data.fats.goal) * 100), 100),
        };
      case 'fiber':
        return {
          value: `${data.fiber.value}g`,
          sub: `Goal: ${data.fiber.goal}g`,
          percent: Math.min(Math.round((data.fiber.value / data.fiber.goal) * 100), 100),
        };
      default:
        return { value: '—', sub: '', percent: 0 };
    }
  };

  // Opens the widget customisation modal and pre-fills with current selections
  const openEdit = () => {
    setPendingWidgets([...selectedWidgets]);
    setEditMode(true);
  };

  // Toggles a metric in/out of the pending selection, capped at MAX_WIDGETS
  const togglePending = (id) => {
    setPendingWidgets((prev) => {
      if (prev.includes(id)) return prev.filter((w) => w !== id);
      if (prev.length >= MAX_WIDGETS) return prev;
      return [...prev, id];
    });
  };

  // Applies the new widget selection and saves it to the backend profile
  const saveWidgets = async () => {
    setSelectedWidgets(pendingWidgets);
    setEditMode(false);
    try {
      await authAPI.updateProfile({ dashboard_widgets: pendingWidgets });
    } catch (err) {
      console.error('Failed to save widget preferences:', err);
    }
  };

  const cancelEdit = () => setEditMode(false);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Personalised greeting with time-of-day text */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {getGreeting()},{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500">
            {name} 👋
          </span>
        </h1>
        <p className="text-gray-500 mt-1">Here's your wellness summary for today.</p>
      </div>

      {/* Customisable stat cards — user picks up to 3 metrics to show here */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Today's Stats</h2>
          <button
            onClick={openEdit}
            className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-800 border border-teal-200 hover:border-teal-400 rounded-lg px-3 py-1.5 transition-all"
          >
            <Pencil className="w-3.5 h-3.5" />
            Customize
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {selectedWidgets.map((id) => {
            const meta = ALL_METRICS.find((m) => m.id === id);
            if (!meta) return null;
            const { value, sub, percent } = getMetricProps(id);
            return (
              <StatCard
                key={id}
                icon={meta.icon()}
                label={meta.label}
                loading={loading}
                value={value}
                sub={sub}
                percent={percent}
                barColor={meta.barColor}
                border={meta.border}
              />
            );
          })}
        </div>
      </div>

      {/* Quick Action links — pass openModal:true so each page opens its log form immediately */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction
            to="/nutrition"
            icon={<Apple className="w-6 h-6" />}
            title="Log Nutrition"
            desc="Track your meals and calories"
            gradient="from-green-400 to-teal-500"
          />
          <QuickAction
            to="/activity"
            icon={<Activity className="w-6 h-6" />}
            title="Log Activity"
            desc="Record your workouts"
            gradient="from-teal-400 to-cyan-500"
          />
          <QuickAction
            to="/sleep"
            icon={<Moon className="w-6 h-6" />}
            title="Log Sleep"
            desc="Track your sleep quality"
            gradient="from-cyan-400 to-blue-500"
          />
        </div>
      </div>

      {/* Bottom two-column layout: progress bars on the left, wellness tips on the right */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-teal-500" />
            <h2 className="text-lg font-semibold text-gray-700">Today's Progress</h2>
          </div>
          <div className="space-y-4">
            {selectedWidgets.map((id) => {
              const meta = ALL_METRICS.find((m) => m.id === id);
              if (!meta) return null;
              const { percent } = getMetricProps(id);
              return (
                <ProgressBar key={id} label={meta.label} percent={percent} color={meta.barColor} />
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Heart className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-semibold text-gray-700">Ava's Tips for You</h2>
          </div>
          <div className="space-y-3">
            {dailyTips.map((tip, i) => <Tip key={i} text={tip} />)}
          </div>
        </div>
      </div>


      {/* Widget customisation modal — lets users choose which 3 metrics to display */}
      {editMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-gray-800">Customize Dashboard</h3>
              <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Choose up to <span className="font-medium text-teal-600">{MAX_WIDGETS}</span> metrics to display.{' '}
              <span className="text-gray-400">({pendingWidgets.length}/{MAX_WIDGETS} selected)</span>
            </p>

            <div className="space-y-2 mb-6">
              {ALL_METRICS.map((metric) => {
                const isSelected = pendingWidgets.includes(metric.id);
                // Disable unselected items once 3 have been chosen
                const isDisabled = !isSelected && pendingWidgets.length >= MAX_WIDGETS;
                return (
                  <button
                    key={metric.id}
                    onClick={() => togglePending(metric.id)}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all
                      ${isSelected
                        ? 'border-teal-400 bg-teal-50'
                        : isDisabled
                          ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                          : 'border-gray-100 bg-white hover:border-teal-200 hover:bg-teal-50/50'
                      }`}
                  >
                    <span className="shrink-0">{metric.icon()}</span>
                    <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-teal-700' : 'text-gray-600'}`}>
                      {metric.label}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-teal-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelEdit}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveWidgets}
                disabled={pendingWidgets.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

// Single metric card with a skeleton loader while data is being fetched
const StatCard = ({ icon, label, loading, value, sub, percent, barColor, border }) => (
  <div className={`bg-white rounded-2xl shadow-md p-5 border ${border}`}>
    <div className="flex items-center space-x-2 mb-2">
      {icon}
      <span className="text-sm text-gray-500">{label}</span>
    </div>
    {loading ? (
      // Pulsing placeholder shown while the API call is in progress
      <div className="h-8 w-24 bg-gray-100 rounded animate-pulse mt-1 mb-3" />
    ) : (
      <div className="text-2xl font-bold text-gray-800 mb-1">{value}</div>
    )}
    <div className="text-xs text-gray-400 mb-3">{sub}</div>
    {/* Progress bar capped at 100% */}
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div
        className={`${barColor} h-1.5 rounded-full transition-all duration-500`}
        style={{ width: `${loading ? 0 : percent}%` }}
      />
    </div>
    {!loading && <div className="text-xs text-gray-400 mt-1">{percent}% of goal</div>}
  </div>
);

// Quick action card — uses React Router's Link state to tell the destination page to open its modal
const QuickAction = ({ to, icon, title, desc, gradient }) => (
  <Link
    to={to}
    state={{ openModal: true }}
    className={`bg-gradient-to-r ${gradient} text-white rounded-2xl p-5 flex items-center space-x-4 hover:shadow-lg transition-all hover:scale-[1.02]`}
  >
    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">{icon}</div>
    <div>
      <div className="font-semibold text-lg">{title}</div>
      <div className="text-sm opacity-80">{desc}</div>
    </div>
  </Link>
);

// Horizontal progress bar used in the "Today's Progress" section
const ProgressBar = ({ label, percent, color }) => (
  <div>
    <div className="flex justify-between text-sm text-gray-600 mb-1">
      <span>{label}</span>
      <span>{percent}%</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
    </div>
  </div>
);

// Individual wellness tip bullet point
const Tip = ({ text }) => (
  <div className="flex items-start space-x-2 text-sm text-gray-600">
    <span className="mt-1 w-2 h-2 rounded-full bg-teal-400 shrink-0" />
    <span>{text}</span>
  </div>
);


export default DashboardPage;
