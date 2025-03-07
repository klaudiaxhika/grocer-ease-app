
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Ingredient {
  id: string;
  recipe_id?: string;
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  created_at?: string;
  updated_at?: string;
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
  user_id?: string;
  name: string;
  description: string;
  servings: number;
  prep_time: number;
  cook_time: number;
  ingredients: Ingredient[];
  instructions: string[];
  tags: string[];
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MealPlan {
  id: string;
  date: string;
  day: WeekDay;
  mealType: MealType;
  recipe: Recipe;
  servings: number;
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  checked: boolean;
  recipe_sources: string[]; // List of recipe names this ingredient is used in
}

export interface GroceryList {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  items: GroceryItem[];
  created_at?: string;
  updated_at?: string;
}
