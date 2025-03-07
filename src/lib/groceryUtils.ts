
import { GroceryItem, GroceryList, Ingredient, MealPlan, Recipe } from "./types";
import { v4 as uuidv4 } from 'uuid';

// Calculate the total quantity of an ingredient based on servings
export const calculateIngredientQuantity = (
  ingredient: Ingredient,
  servings: number,
  recipeServings: number
): number => {
  return (ingredient.quantity * servings) / recipeServings;
};

// Generate a grocery list from a meal plan
export const generateGroceryList = (mealPlan: MealPlan[]): GroceryList => {
  const groceryItems: Record<string, GroceryItem> = {};

  mealPlan.forEach(meal => {
    meal.recipe.ingredients.forEach(ingredient => {
      // Create a unique key based on ingredient name and unit
      const key = `${ingredient.name.toLowerCase()}-${ingredient.unit}`;
      
      if (groceryItems[key]) {
        // Update existing item
        groceryItems[key].quantity += calculateIngredientQuantity(
          ingredient,
          meal.servings,
          meal.recipe.servings
        );
        
        // Add recipe to the list if not already included
        if (!groceryItems[key].recipes.includes(meal.recipe.name)) {
          groceryItems[key].recipes.push(meal.recipe.name);
        }
      } else {
        // Create new grocery item
        groceryItems[key] = {
          id: uuidv4(),
          name: ingredient.name,
          quantity: calculateIngredientQuantity(
            ingredient,
            meal.servings,
            meal.recipe.servings
          ),
          unit: ingredient.unit,
          category: ingredient.category,
          checked: false,
          recipes: [meal.recipe.name],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
    });
  });

  // Convert to array
  const itemsArray = Object.values(groceryItems);
  
  const now = new Date().toISOString();
  
  return {
    id: uuidv4(),
    name: 'Weekly Grocery List',
    start_date: now,
    end_date: now, // This should be updated with proper date logic
    items: itemsArray,
    created_at: now,
    updated_at: now
  };
};

// Round quantity to a more natural measurement
export const formatQuantity = (quantity: number): string => {
  if (quantity % 1 === 0) {
    return quantity.toString();
  }
  
  // Handle common fractions
  if (Math.abs(quantity - 0.25) < 0.01) return "¼";
  if (Math.abs(quantity - 0.33) < 0.01) return "⅓";
  if (Math.abs(quantity - 0.5) < 0.01) return "½";
  if (Math.abs(quantity - 0.67) < 0.01) return "⅔";
  if (Math.abs(quantity - 0.75) < 0.01) return "¾";
  
  // For other decimals, round to 2 decimal places
  return quantity.toFixed(2);
};

// Group grocery items by category
export const groupItemsByCategory = (items: GroceryItem[]): Record<string, GroceryItem[]> => {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, GroceryItem[]>);
};

// Calculate total number of unchecked items
export const countUncheckedItems = (items: GroceryItem[]): number => {
  return items.filter(item => !item.checked).length;
};

// Find recipes that use a specific ingredient
export const findRecipesWithIngredient = (
  ingredientName: string, 
  recipes: Recipe[]
): Recipe[] => {
  return recipes.filter(recipe => 
    recipe.ingredients.some(ingredient => 
      ingredient.name.toLowerCase() === ingredientName.toLowerCase()
    )
  );
};

// Update a grocery list when a meal plan changes
export const updateGroceryListFromMealPlan = (
  currentList: GroceryList, 
  oldMealPlan: MealPlan[],
  newMealPlan: MealPlan[]
): GroceryList => {
  // Generate a new list from scratch - more reliable than trying to patch
  return generateGroceryList(newMealPlan);
};

// Export grocery list to different formats
export const exportGroceryList = (list: GroceryList, format: 'text' | 'csv' = 'text'): string => {
  const groupedItems = groupItemsByCategory(list.items);
  
  if (format === 'text') {
    let output = `${list.name}\n${new Date(list.start_date).toLocaleDateString()}\n\n`;
    
    Object.entries(groupedItems).forEach(([category, items]) => {
      output += `${category.toUpperCase()}\n`;
      items.forEach(item => {
        output += `[ ] ${formatQuantity(item.quantity)} ${item.unit} ${item.name}\n`;
      });
      output += '\n';
    });
    
    return output;
  } else if (format === 'csv') {
    let output = 'Category,Item,Quantity,Unit,Recipes\n';
    
    list.items.forEach(item => {
      output += `${item.category},${item.name},${formatQuantity(item.quantity)},${item.unit},"${item.recipes.join(', ')}"\n`;
    });
    
    return output;
  }
  
  return '';
};

// Filter grocery list by category or search term
export const filterGroceryItems = (
  items: GroceryItem[], 
  options: { 
    category?: string; 
    searchTerm?: string;
    showChecked?: boolean;
  }
): GroceryItem[] => {
  return items.filter(item => {
    // Filter by whether item is checked
    if (options.showChecked === false && item.checked) {
      return false;
    }
    
    // Filter by category
    if (options.category && item.category !== options.category) {
      return false;
    }
    
    // Filter by search term
    if (options.searchTerm && !item.name.toLowerCase().includes(options.searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
};
