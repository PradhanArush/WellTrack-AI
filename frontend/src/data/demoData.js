const today = new Date().toISOString().split('T')[0];

export const DEMO_USER = {
  id: 1,
  username: 'demo',
  email: 'demo@welltrack.com',
  full_name: 'Demo User',
  calorie_goal: 2000,
  protein_goal: 150,
  carbs_goal: 250,
  fiber_goal: 30,
  fats_goal: 65,
  water_goal_ml: 2500,
  dashboard_widgets: ['calories', 'water', 'sleep'],
  gender: 'other',
  height: '175.00',
  weight: '70.00',
};

const DEMO_RESPONSES = {
  '/users/profile/': { GET: DEMO_USER, PATCH: DEMO_USER },

  '/nutrition/summary/': {
    GET: {
      total_calories: 1340,
      total_protein: 82,
      total_carbs: 160,
      total_fiber: 18,
      total_fats: 42,
    },
  },

  '/nutrition/meals/': {
    GET: [
      {
        id: 1, food_name: 'Oatmeal', calories: 300, protein: 10, carbs: 54,
        fiber: 8, fats: 6, meal_type: 'breakfast', grams: 100,
        date: today, time: '08:00:00', notes: '100g',
      },
      {
        id: 2, food_name: 'Grilled Chicken', calories: 520, protein: 48, carbs: 30,
        fiber: 4, fats: 22, meal_type: 'lunch', grams: 200,
        date: today, time: '13:00:00', notes: '200g',
      },
      {
        id: 3, food_name: 'Banana', calories: 89, protein: 1, carbs: 23,
        fiber: 3, fats: 0, meal_type: 'snack', grams: 118,
        date: today, time: '16:00:00', notes: '1 banana',
      },
      {
        id: 4, food_name: 'Salmon + Rice', calories: 431, protein: 23, carbs: 53,
        fiber: 3, fats: 14, meal_type: 'dinner', grams: 300,
        date: today, time: '19:30:00', notes: '300g',
      },
    ],
    POST: {
      id: 99, food_name: 'Demo Meal', calories: 200, protein: 10,
      carbs: 20, fiber: 2, fats: 8, meal_type: 'snack',
      grams: 100, date: today, time: '12:00:00', notes: '100g',
    },
  },

  '/nutrition/water/': {
    GET: [
      { id: 1, amount_ml: 500, date: today },
      { id: 2, amount_ml: 750, date: today },
      { id: 3, amount_ml: 300, date: today },
    ],
    POST: { id: 99, amount_ml: 250, date: today },
    DELETE: {},
  },

  '/activity/activities/': {
    GET: [
      {
        id: 1, name: 'Morning Run', activity_type: 'cardio',
        duration_minutes: 35, calories_burned: 320, intensity: 'moderate',
        date: today, notes: '',
      },
      {
        id: 2, name: 'Weight Training', activity_type: 'strength',
        duration_minutes: 50, calories_burned: 280, intensity: 'high',
        date: today, notes: 'Chest and triceps',
      },
    ],
    POST: {
      id: 99, name: 'Demo Activity', activity_type: 'cardio',
      duration_minutes: 30, calories_burned: 200, intensity: 'moderate',
      date: today, notes: '',
    },
  },

  '/sleep/logs/': {
    GET: [
      {
        id: 1, date: today, bedtime: '23:00:00', wake_time: '07:00:00',
        duration_hours: '8.0', quality: 8,
        fell_asleep_minutes: 12, times_woken: 1,
        had_caffeine: false, had_alcohol: false,
        exercised: true, stressed: false, notes: 'Felt well rested',
      },
    ],
    POST: {
      id: 99, date: today, bedtime: '23:00:00', wake_time: '07:00:00',
      duration_hours: '8.0', quality: 8,
    },
  },

  '/sleep/summary/weekly/': {
    GET: {
      average_duration: '7.40',
      average_quality: '7.2',
      total_logs: 6,
      quality_trend: 'improving',
      duration_trend: 'stable',
      consistency_score: 80,
    },
  },

  '/users/chatbot/': {
    POST: { reply: "Hi! I'm Ava. This is a demo — I'm not connected to a live backend right now, but in the real app I can answer all your wellness questions!" },
  },
};

export function getDemoResponse(url, method = 'get') {
  const upperMethod = method.toUpperCase();
  // Strip base URL and query params
  const path = '/' + url.replace(/^.*\/api/, '').replace(/\?.*$/, '').replace(/^\//, '');
  const normalized = path.endsWith('/') ? path : path + '/';

  // Exact match first
  if (DEMO_RESPONSES[normalized]?.[upperMethod] !== undefined) {
    return DEMO_RESPONSES[normalized][upperMethod];
  }

  // Pattern match for detail endpoints like /nutrition/meals/1/
  for (const key of Object.keys(DEMO_RESPONSES)) {
    const pattern = new RegExp('^' + key.replace(/\//g, '\\/').replace(/\d+/g, '\\d+') + '$');
    if (pattern.test(normalized) && DEMO_RESPONSES[key][upperMethod] !== undefined) {
      return DEMO_RESPONSES[key][upperMethod];
    }
  }

  // Default empty responses
  if (upperMethod === 'GET') return [];
  if (upperMethod === 'DELETE') return {};
  return {};
}
