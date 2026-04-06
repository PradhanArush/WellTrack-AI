// Nutritional values per 100g (source: USDA FoodData Central)
export const FOODS = [
  {
    id: 'chicken_breast',
    name: 'Chicken Breast',
    emoji: '🍗',
    per100g: { calories: 165, protein: 31.0, carbs: 0.0, fiber: 0.0, fats: 3.6 },
  },
  {
    id: 'eggs',
    name: 'Eggs',
    emoji: '🥚',
    per100g: { calories: 155, protein: 13.0, carbs: 1.1, fiber: 0.0, fats: 11.0 },
    unit: 'eggs',
    gramsPerUnit: 50,
  },
  {
    id: 'chickpeas',
    name: 'Chickpeas',
    emoji: '🫘',
    per100g: { calories: 164, protein: 8.9, carbs: 27.4, fiber: 7.6, fats: 2.6 },
  },
  {
    id: 'salmon',
    name: 'Salmon',
    emoji: '🐟',
    per100g: { calories: 208, protein: 20.0, carbs: 0.0, fiber: 0.0, fats: 13.0 },
  },
  {
    id: 'cheddar_cheese',
    name: 'Cheddar Cheese',
    emoji: '🧀',
    per100g: { calories: 402, protein: 25.0, carbs: 1.3, fiber: 0.0, fats: 33.0 },
  },
  {
    id: 'apple',
    name: 'Apple',
    emoji: '🍎',
    per100g: { calories: 52, protein: 0.3, carbs: 13.8, fiber: 2.4, fats: 0.2 },
    unit: 'apple',
    gramsPerUnit: 182,
  },
  {
    id: 'banana',
    name: 'Banana',
    emoji: '🍌',
    per100g: { calories: 89, protein: 1.1, carbs: 22.8, fiber: 2.6, fats: 0.3 },
    unit: 'banana',
    gramsPerUnit: 118,
  },
  {
    id: 'white_rice',
    name: 'White Rice (cooked)',
    emoji: '🍚',
    per100g: { calories: 130, protein: 2.7, carbs: 28.2, fiber: 0.4, fats: 0.3 },
  },
  {
    id: 'broccoli',
    name: 'Broccoli',
    emoji: '🥦',
    per100g: { calories: 34, protein: 2.8, carbs: 6.6, fiber: 2.6, fats: 0.4 },
  },
  {
    id: 'sweet_potato',
    name: 'Sweet Potato',
    emoji: '🍠',
    per100g: { calories: 86, protein: 1.6, carbs: 20.1, fiber: 3.0, fats: 0.1 },
  },
  {
    id: 'avocado',
    name: 'Avocado',
    emoji: '🥑',
    per100g: { calories: 160, protein: 2.0, carbs: 8.5, fiber: 6.7, fats: 14.7 },
  },
  {
    id: 'oatmeal',
    name: 'Oatmeal (cooked)',
    emoji: '🥣',
    per100g: { calories: 71, protein: 2.5, carbs: 12.0, fiber: 1.7, fats: 1.5 },
  },
  {
    id: 'greek_yogurt',
    name: 'Greek Yogurt',
    emoji: '🫙',
    per100g: { calories: 59, protein: 10.0, carbs: 3.6, fiber: 0.0, fats: 0.4 },
  },
  {
    id: 'almonds',
    name: 'Almonds',
    emoji: '🌰',
    per100g: { calories: 579, protein: 21.2, carbs: 21.6, fiber: 12.5, fats: 49.9 },
  },
  {
    id: 'pasta',
    name: 'Pasta (cooked)',
    emoji: '🍝',
    per100g: { calories: 158, protein: 5.8, carbs: 30.9, fiber: 1.8, fats: 0.9 },
  },
  {
    id: 'whole_wheat_bread',
    name: 'Whole Wheat Bread',
    emoji: '🍞',
    per100g: { calories: 247, protein: 13.0, carbs: 41.3, fiber: 6.0, fats: 3.4 },
    unit: 'slice',
    gramsPerUnit: 32,
  },
  {
    id: 'orange',
    name: 'Orange',
    emoji: '🍊',
    per100g: { calories: 47, protein: 0.9, carbs: 11.8, fiber: 2.4, fats: 0.1 },
    unit: 'orange',
    gramsPerUnit: 131,
  },
  {
    id: 'spinach',
    name: 'Spinach',
    emoji: '🥬',
    per100g: { calories: 23, protein: 2.9, carbs: 3.6, fiber: 2.2, fats: 0.4 },
  },
  {
    id: 'ground_beef',
    name: 'Ground Beef (lean)',
    emoji: '🥩',
    per100g: { calories: 215, protein: 26.1, carbs: 0.0, fiber: 0.0, fats: 11.8 },
  },
  {
    id: 'milk',
    name: 'Milk (whole)',
    emoji: '🥛',
    per100g: { calories: 61, protein: 3.2, carbs: 4.8, fiber: 0.0, fats: 3.3 },
    unit: 'ml',
    gramsPerUnit: 1,
  },
];

export const getFoodById = (id) => FOODS.find((f) => f.id === id) || null;

export const calculateNutrients = (food, grams) => {
  const ratio = grams / 100;
  return {
    calories: Math.round(food.per100g.calories * ratio),
    protein: parseFloat((food.per100g.protein * ratio).toFixed(1)),
    carbs: parseFloat((food.per100g.carbs * ratio).toFixed(1)),
    fiber: parseFloat((food.per100g.fiber * ratio).toFixed(1)),
    fats: parseFloat((food.per100g.fats * ratio).toFixed(1)),
  };
};
