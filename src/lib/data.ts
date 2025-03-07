
import { Ingredient, Recipe, MealPlan, GroceryList, IngredientCategory, GroceryItem } from './types';
import { v4 as uuidv4 } from 'uuid';

// Sample recipes
export const sampleRecipes: Recipe[] = [
  {
    id: uuidv4(),
    name: 'Classic Omelette',
    description: 'A simple and delicious breakfast option.',
    servings: 1,
    prep_time: 5,
    cook_time: 10,
    ingredients: [
      { id: uuidv4(), name: 'Eggs', quantity: 3, unit: 'large', category: 'dairy' },
      { id: uuidv4(), name: 'Milk', quantity: 2, unit: 'tbsp', category: 'dairy' },
      { id: uuidv4(), name: 'Bell Pepper', quantity: 0.5, unit: 'medium', category: 'produce' },
      { id: uuidv4(), name: 'Onion', quantity: 0.25, unit: 'medium', category: 'produce' },
      { id: uuidv4(), name: 'Cheddar Cheese', quantity: 0.25, unit: 'cup', category: 'dairy' },
      { id: uuidv4(), name: 'Salt', quantity: 0.25, unit: 'tsp', category: 'spices' },
      { id: uuidv4(), name: 'Black Pepper', quantity: 0.125, unit: 'tsp', category: 'spices' },
    ],
    instructions: [
      'Whisk eggs and milk together in a bowl.',
      'Dice bell pepper and onion.',
      'Heat a non-stick pan over medium heat.',
      'Pour egg mixture into the pan and cook until edges start to set.',
      'Sprinkle vegetables and cheese over one half of the omelette.',
      'Fold omelette in half and cook until cheese is melted and eggs are set.',
      'Season with salt and pepper to taste.'
    ],
    tags: ['breakfast', 'quick', 'vegetarian', 'high-protein']
  },
  {
    id: uuidv4(),
    name: 'Chicken Caesar Salad',
    description: 'A classic Caesar salad with grilled chicken.',
    servings: 2,
    prep_time: 15,
    cook_time: 15,
    ingredients: [
      { id: uuidv4(), name: 'Chicken Breast', quantity: 1, unit: 'large', category: 'meat' },
      { id: uuidv4(), name: 'Romaine Lettuce', quantity: 1, unit: 'head', category: 'produce' },
      { id: uuidv4(), name: 'Parmesan Cheese', quantity: 0.25, unit: 'cup', category: 'dairy' },
      { id: uuidv4(), name: 'Croutons', quantity: 1, unit: 'cup', category: 'bakery' },
      { id: uuidv4(), name: 'Caesar Dressing', quantity: 0.25, unit: 'cup', category: 'condiments' },
      { id: uuidv4(), name: 'Olive Oil', quantity: 1, unit: 'tbsp', category: 'condiments' },
      { id: uuidv4(), name: 'Lemon Juice', quantity: 1, unit: 'tbsp', category: 'produce' },
      { id: uuidv4(), name: 'Garlic', quantity: 1, unit: 'clove', category: 'produce' },
      { id: uuidv4(), name: 'Salt', quantity: 0.5, unit: 'tsp', category: 'spices' },
      { id: uuidv4(), name: 'Black Pepper', quantity: 0.25, unit: 'tsp', category: 'spices' },
    ],
    instructions: [
      'Season chicken breast with salt, pepper, and olive oil.',
      'Grill chicken until fully cooked, about 6-7 minutes per side.',
      'Wash and chop romaine lettuce.',
      'Slice cooked chicken into strips.',
      'Toss lettuce with dressing, parmesan, and croutons.',
      'Top with sliced chicken and additional parmesan if desired.'
    ],
    tags: ['lunch', 'salad', 'high-protein', 'low-carb']
  },
  {
    id: uuidv4(),
    name: 'Spaghetti Bolognese',
    description: 'Classic Italian pasta with meat sauce.',
    servings: 4,
    prep_time: 15,
    cook_time: 45,
    ingredients: [
      { id: uuidv4(), name: 'Ground Beef', quantity: 1, unit: 'pound', category: 'meat' },
      { id: uuidv4(), name: 'Spaghetti', quantity: 1, unit: 'pound', category: 'dry goods' },
      { id: uuidv4(), name: 'Onion', quantity: 1, unit: 'medium', category: 'produce' },
      { id: uuidv4(), name: 'Garlic', quantity: 3, unit: 'cloves', category: 'produce' },
      { id: uuidv4(), name: 'Carrot', quantity: 1, unit: 'large', category: 'produce' },
      { id: uuidv4(), name: 'Celery', quantity: 1, unit: 'stalk', category: 'produce' },
      { id: uuidv4(), name: 'Crushed Tomatoes', quantity: 28, unit: 'oz', category: 'canned' },
      { id: uuidv4(), name: 'Tomato Paste', quantity: 2, unit: 'tbsp', category: 'canned' },
      { id: uuidv4(), name: 'Red Wine', quantity: 0.5, unit: 'cup', category: 'beverages' },
      { id: uuidv4(), name: 'Dried Oregano', quantity: 1, unit: 'tsp', category: 'spices' },
      { id: uuidv4(), name: 'Dried Basil', quantity: 1, unit: 'tsp', category: 'spices' },
      { id: uuidv4(), name: 'Bay Leaf', quantity: 1, unit: '', category: 'spices' },
      { id: uuidv4(), name: 'Parmesan Cheese', quantity: 0.25, unit: 'cup', category: 'dairy' },
      { id: uuidv4(), name: 'Olive Oil', quantity: 2, unit: 'tbsp', category: 'condiments' },
      { id: uuidv4(), name: 'Salt', quantity: 1, unit: 'tsp', category: 'spices' },
      { id: uuidv4(), name: 'Black Pepper', quantity: 0.5, unit: 'tsp', category: 'spices' },
    ],
    instructions: [
      'Finely dice onion, carrot, celery, and garlic.',
      'Heat olive oil in a large pot over medium heat.',
      'Add vegetables and cook until softened, about 5-7 minutes.',
      'Add ground beef and cook until browned.',
      'Add tomato paste and stir for 1-2 minutes.',
      'Pour in red wine and simmer for 2-3 minutes.',
      'Add crushed tomatoes, herbs, bay leaf, salt, and pepper.',
      'Simmer sauce on low heat for 30 minutes, stirring occasionally.',
      'Cook spaghetti according to package instructions.',
      'Serve sauce over spaghetti and top with grated parmesan.'
    ],
    tags: ['dinner', 'italian', 'pasta', 'family-friendly']
  },
  {
    id: uuidv4(),
    name: 'Greek Yogurt with Berries',
    description: 'A simple, healthy snack with protein and antioxidants.',
    servings: 1,
    prep_time: 5,
    cook_time: 0,
    ingredients: [
      { id: uuidv4(), name: 'Greek Yogurt', quantity: 1, unit: 'cup', category: 'dairy' },
      { id: uuidv4(), name: 'Mixed Berries', quantity: 0.5, unit: 'cup', category: 'produce' },
      { id: uuidv4(), name: 'Honey', quantity: 1, unit: 'tsp', category: 'condiments' },
      { id: uuidv4(), name: 'Granola', quantity: 2, unit: 'tbsp', category: 'dry goods' },
    ],
    instructions: [
      'Place yogurt in a bowl.',
      'Top with berries and granola.',
      'Drizzle with honey.',
    ],
    tags: ['snack', 'quick', 'healthy', 'no-cook']
  }
];

// Helper function to get ISO string date for a given weekday of the current week
const getDateForWeekday = (weekday: string): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const currentDay = now.getDay(); // 0-6, where 0 is Sunday
  const targetDayIndex = days.indexOf(weekday.toLowerCase());
  
  // Calculate the difference in days
  let diff = targetDayIndex - currentDay;
  
  // If the target day has already passed this week, get next week's date
  if (diff < 0) {
    diff += 7;
  }
  
  // Set the date to the target weekday
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + diff);
  
  return targetDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

// Sample meal plan
export const sampleMealPlan: MealPlan[] = [
  {
    id: uuidv4(),
    date: getDateForWeekday('monday'),
    day: 'monday',
    mealType: 'breakfast',
    recipe: sampleRecipes[0], // Classic Omelette
    servings: 1
  },
  {
    id: uuidv4(),
    date: getDateForWeekday('monday'),
    day: 'monday',
    mealType: 'lunch',
    recipe: sampleRecipes[1], // Chicken Caesar Salad
    servings: 1
  },
  {
    id: uuidv4(),
    date: getDateForWeekday('monday'),
    day: 'monday',
    mealType: 'dinner',
    recipe: sampleRecipes[2], // Spaghetti Bolognese
    servings: 2
  },
  {
    id: uuidv4(),
    date: getDateForWeekday('tuesday'),
    day: 'tuesday',
    mealType: 'breakfast',
    recipe: sampleRecipes[0], // Classic Omelette
    servings: 1
  },
  {
    id: uuidv4(),
    date: getDateForWeekday('tuesday'),
    day: 'tuesday',
    mealType: 'snack',
    recipe: sampleRecipes[3], // Greek Yogurt with Berries
    servings: 1
  },
  {
    id: uuidv4(),
    date: getDateForWeekday('wednesday'),
    day: 'wednesday',
    mealType: 'lunch',
    recipe: sampleRecipes[1], // Chicken Caesar Salad
    servings: 1
  }
];

// Function to generate a grocery list from a meal plan
export const generateGroceryList = (mealPlan: MealPlan[]): GroceryList => {
  const groceryItems: Record<string, GroceryItem> = {};

  mealPlan.forEach(meal => {
    meal.recipe.ingredients.forEach(ingredient => {
      const key = `${ingredient.name.toLowerCase()}-${ingredient.unit}`;
      
      if (groceryItems[key]) {
        // Adjust quantity based on servings and add recipe to the list
        groceryItems[key].quantity += (ingredient.quantity * meal.servings) / meal.recipe.servings;
        if (!groceryItems[key].recipes.includes(meal.recipe.name)) {
          groceryItems[key].recipes.push(meal.recipe.name);
        }
      } else {
        // Create new grocery item
        groceryItems[key] = {
          id: uuidv4(),
          name: ingredient.name,
          quantity: (ingredient.quantity * meal.servings) / meal.recipe.servings,
          unit: ingredient.unit,
          category: ingredient.category,
          checked: false,
          recipes: [meal.recipe.name]
        };
      }
    });
  });

  // Convert to array and sort by category
  const itemsArray = Object.values(groceryItems);
  
  return {
    id: uuidv4(),
    name: 'Weekly Grocery List',
    date: new Date().toISOString(),
    items: itemsArray
  };
};

// Sample grocery list based on the meal plan
export const sampleGroceryList: GroceryList = generateGroceryList(sampleMealPlan);

// Categorized grocery store sections for UI organization
export const groceryCategories: Record<IngredientCategory, string> = {
  'produce': 'Produce',
  'dairy': 'Dairy & Eggs',
  'meat': 'Meat & Poultry',
  'seafood': 'Seafood',
  'bakery': 'Bakery',
  'frozen': 'Frozen Foods',
  'canned': 'Canned Goods',
  'dry goods': 'Dry Goods & Pasta',
  'spices': 'Spices & Herbs',
  'condiments': 'Condiments & Oils',
  'beverages': 'Beverages',
  'snacks': 'Snacks',
  'other': 'Other'
};

// Days of the week for UI
export const weekDays = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

// Meal types for UI
export const mealTypes = [
  'breakfast',
  'lunch', 
  'dinner',
  'snack'
];
