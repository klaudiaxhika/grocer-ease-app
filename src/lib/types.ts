
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
}

export type IngredientCategory = 
  | 'produce' 
  | 'dairy' 
  | 'meat' 
  | 'seafood' 
  | 'bakery' 
  | 'frozen' 
  | 'canned' 
  | 'dry goods' 
  | 'spices' 
  | 'condiments' 
  | 'beverages' 
  | 'snacks' 
  | 'other';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  ingredients: Ingredient[];
  instructions: string[];
  tags: string[];
  image?: string;
}

export interface MealPlan {
  id: string;
  day: WeekDay;
  mealType: MealType;
  recipe: Recipe;
  servings: number;
}

export interface GroceryItem extends Omit<Ingredient, 'id'> {
  id: string;
  checked: boolean;
  recipes: string[]; // List of recipe names this ingredient is used in
}

export interface GroceryList {
  id: string;
  name: string;
  date: string;
  items: GroceryItem[];
}
