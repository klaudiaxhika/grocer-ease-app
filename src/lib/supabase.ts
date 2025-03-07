import { createClient } from '@supabase/supabase-js';
import { Ingredient, Recipe, MealPlan, WeekDay, MealType, GroceryList, GroceryItem, IngredientCategory } from './types';

const supabaseUrl = 'https://yilqlufqhjwszclncjdk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpbHFsdWZxaGp3c3pjbG5jamRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNTUwOTksImV4cCI6MjA1NjkzMTA5OX0.msrgbjLs0wm_TimAXba31fd8mnaN7sAiFw8dAGSMSms';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export type Profile = {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  updated_at?: string;
}

export type User = {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
}

export async function getUserProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  return profile;
}

export async function updateUserProfile(updates: Partial<Profile>): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}

// Recipe functions

export async function getRecipes(): Promise<{ 
  data: Recipe[] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients (*)
      `)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}

export async function getRecipe(id: string): Promise<{ 
  data: Recipe | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        ingredients (*)
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error(`Error fetching recipe ${id}:`, error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}

export async function createRecipe(recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<{ 
  data: Recipe | null;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    // First create the recipe
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        name: recipe.name,
        description: recipe.description,
        servings: recipe.servings,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        instructions: recipe.instructions,
        tags: recipe.tags,
        image_url: recipe.image_url,
        user_id: user.id
      })
      .select()
      .single();
      
    if (recipeError) throw recipeError;
    
    // Then create the ingredients
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      const ingredientsToInsert = recipe.ingredients.map(ingredient => ({
        recipe_id: recipeData.id,
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        category: ingredient.category
      }));
      
      const { error: ingredientsError } = await supabase
        .from('ingredients')
        .insert(ingredientsToInsert);
        
      if (ingredientsError) throw ingredientsError;
    }
    
    // Get the complete recipe with ingredients
    return await getRecipe(recipeData.id);
    
  } catch (error) {
    console.error('Error creating recipe:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}

export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<{ 
  data: Recipe | null;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    // Extract ingredients from updates to handle separately
    const { ingredients, ...recipeUpdates } = updates;
    
    // Update recipe
    const { error: recipeError } = await supabase
      .from('recipes')
      .update(recipeUpdates)
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (recipeError) throw recipeError;
    
    // Handle ingredients if provided
    if (ingredients) {
      // Get existing ingredients
      const { data: existingIngredients } = await supabase
        .from('ingredients')
        .select('id')
        .eq('recipe_id', id);
        
      const existingIds = new Set(existingIngredients?.map(ing => ing.id) || []);
      
      // Separate ingredients into updates and creates
      const ingredientsToUpdate: Ingredient[] = [];
      const ingredientsToCreate: Omit<Ingredient, 'id'>[] = [];
      
      ingredients.forEach(ingredient => {
        if (ingredient.id && existingIds.has(ingredient.id)) {
          ingredientsToUpdate.push(ingredient);
          existingIds.delete(ingredient.id);
        } else {
          ingredientsToCreate.push({
            ...ingredient,
            recipe_id: id
          });
        }
      });
      
      // Delete ingredients that are no longer in the list
      if (existingIds.size > 0) {
        const { error: deleteError } = await supabase
          .from('ingredients')
          .delete()
          .in('id', Array.from(existingIds));
          
        if (deleteError) throw deleteError;
      }
      
      // Update existing ingredients
      for (const ingredient of ingredientsToUpdate) {
        const { error } = await supabase
          .from('ingredients')
          .update({
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            category: ingredient.category
          })
          .eq('id', ingredient.id);
          
        if (error) throw error;
      }
      
      // Create new ingredients
      if (ingredientsToCreate.length > 0) {
        const { error } = await supabase
          .from('ingredients')
          .insert(ingredientsToCreate);
          
        if (error) throw error;
      }
    }
    
    // Get updated recipe
    return await getRecipe(id);
    
  } catch (error) {
    console.error(`Error updating recipe ${id}:`, error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}

export async function deleteRecipe(id: string): Promise<{ 
  success: boolean;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    // Delete recipe (ingredients will be cascade deleted)
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error(`Error deleting recipe ${id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}

// Meal plan functions
export async function getMealPlans(): Promise<{ 
  data: MealPlan[] | null;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    const { data: mealPlansData, error: mealPlansError } = await supabase
      .from('meal_plans')
      .select(`
        id,
        date,
        day,
        meal_type,
        servings,
        recipe_id
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: true });
      
    if (mealPlansError) throw mealPlansError;
    
    // We need to fetch the recipes for each meal plan
    if (mealPlansData && mealPlansData.length > 0) {
      // Get unique recipe IDs
      const recipeIds = [...new Set(mealPlansData.map(mp => mp.recipe_id))];
      
      // Fetch all recipes at once
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select(`
          *,
          ingredients (*)
        `)
        .in('id', recipeIds);
        
      if (recipesError) throw recipesError;
      
      // Map recipes to meal plans
      const mealPlans: MealPlan[] = mealPlansData.map(mp => {
        const recipe = recipesData?.find(r => r.id === mp.recipe_id);
        return {
          id: mp.id,
          date: mp.date,
          day: mp.day as WeekDay,
          mealType: mp.meal_type as MealType,
          servings: mp.servings,
          recipe: recipe as Recipe
        };
      });
      
      return { data: mealPlans, error: null };
    }
    
    return { data: [], error: null };
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}

export async function createMealPlan(mealPlan: Omit<MealPlan, 'id'>): Promise<{ 
  data: MealPlan | null;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('meal_plans')
      .insert({
        user_id: user.id,
        date: mealPlan.date,
        day: mealPlan.day,
        meal_type: mealPlan.mealType,
        recipe_id: mealPlan.recipe.id,
        servings: mealPlan.servings
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Return the created meal plan
    const newMealPlan: MealPlan = {
      id: data.id,
      date: data.date,
      day: data.day as WeekDay,
      mealType: data.meal_type as MealType,
      servings: data.servings,
      recipe: mealPlan.recipe
    };
    
    return { data: newMealPlan, error: null };
  } catch (error) {
    console.error('Error creating meal plan:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}

export async function updateMealPlan(mealPlan: MealPlan): Promise<{ 
  success: boolean;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('meal_plans')
      .update({
        date: mealPlan.date,
        day: mealPlan.day,
        meal_type: mealPlan.mealType,
        recipe_id: mealPlan.recipe.id,
        servings: mealPlan.servings,
        updated_at: new Date().toISOString()
      })
      .eq('id', mealPlan.id)
      .eq('user_id', user.id);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating meal plan:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}

export async function deleteMealPlan(id: string): Promise<{ 
  success: boolean;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}

// Grocery list functions
export async function getGroceryLists(): Promise<{ 
  data: GroceryList[] | null;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('grocery_lists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return { data: [], error: null };
    }
    
    // Get all grocery items for these lists
    const groceryLists: GroceryList[] = [];
    
    for (const list of data) {
      const { data: itemsData, error: itemsError } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('list_id', list.id)
        .order('category', { ascending: true })
        .order('name', { ascending: true });
        
      if (itemsError) throw itemsError;
      
      const items: GroceryItem[] = (itemsData || []).map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category as IngredientCategory,
        checked: item.checked,
        recipe_sources: item.recipe_sources
      }));
      
      groceryLists.push({
        id: list.id,
        name: list.name,
        start_date: list.start_date,
        end_date: list.end_date,
        items: items,
        created_at: list.created_at,
        updated_at: list.updated_at
      });
    }
    
    return { data: groceryLists, error: null };
  } catch (error) {
    console.error('Error fetching grocery lists:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}

export async function getGroceryList(id: string): Promise<{ 
  data: GroceryList | null;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('grocery_lists')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
      
    if (error) throw error;
    
    // Get grocery items for this list
    const { data: itemsData, error: itemsError } = await supabase
      .from('grocery_items')
      .select('*')
      .eq('list_id', id)
      .order('category', { ascending: true })
      .order('name', { ascending: true });
      
    if (itemsError) throw itemsError;
    
    const items: GroceryItem[] = (itemsData || []).map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category as IngredientCategory,
      checked: item.checked,
      recipe_sources: item.recipe_sources
    }));
    
    const groceryList: GroceryList = {
      id: data.id,
      name: data.name,
      start_date: data.start_date,
      end_date: data.end_date,
      items: items,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    return { data: groceryList, error: null };
  } catch (error) {
    console.error(`Error fetching grocery list ${id}:`, error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}

export async function createGroceryList(groceryList: Omit<GroceryList, 'id' | 'created_at' | 'updated_at'>): Promise<{ 
  data: GroceryList | null;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    // First create the grocery list
    const { data: listData, error: listError } = await supabase
      .from('grocery_lists')
      .insert({
        user_id: user.id,
        name: groceryList.name,
        start_date: groceryList.start_date,
        end_date: groceryList.end_date
      })
      .select()
      .single();
      
    if (listError) throw listError;
    
    // Then create the grocery items
    if (groceryList.items && groceryList.items.length > 0) {
      const itemsToInsert = groceryList.items.map(item => ({
        list_id: listData.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        checked: item.checked,
        recipe_sources: item.recipe_sources
      }));
      
      const { error: itemsError } = await supabase
        .from('grocery_items')
        .insert(itemsToInsert);
        
      if (itemsError) throw itemsError;
    }
    
    // Return the created grocery list
    return await getGroceryList(listData.id);
    
  } catch (error) {
    console.error('Error creating grocery list:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}

export async function updateGroceryListItem(listId: string, item: GroceryItem): Promise<{ 
  success: boolean;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('grocery_items')
      .update({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        checked: item.checked,
        recipe_sources: item.recipe_sources,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id)
      .eq('list_id', listId);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating grocery item:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}

export async function deleteGroceryList(id: string): Promise<{ 
  success: boolean;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    // Delete grocery list (items will be cascade deleted)
    const { error } = await supabase
      .from('grocery_lists')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error(`Error deleting grocery list ${id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}

export async function generateGroceryList(startDate: Date, endDate: Date): Promise<{ 
  data: GroceryList | null;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    // Format dates for database query
    const formattedStartDate = startDate.toISOString();
    const formattedEndDate = endDate.toISOString();
    
    // Get meal plans for the specified date range
    const { data: mealPlansData, error: mealPlansError } = await getMealPlans();
    
    if (mealPlansError) throw mealPlansError;
    if (!mealPlansData) throw new Error('Failed to fetch meal plans');
    
    // Filter meal plans within the date range
    const mealPlansInRange = mealPlansData.filter(mp => {
      const mealDate = new Date(mp.date);
      return mealDate >= startDate && mealDate <= endDate;
    });
    
    if (mealPlansInRange.length === 0) {
      throw new Error('No meal plans found for the selected date range');
    }
    
    // Create a map to aggregate ingredients
    const ingredientMap = new Map<string, GroceryItem>();
    
    // Process each meal plan
    for (const mealPlan of mealPlansInRange) {
      const recipe = mealPlan.recipe;
      const servingsRatio = mealPlan.servings / recipe.servings;
      
      for (const ingredient of recipe.ingredients) {
        const key = `${ingredient.name.toLowerCase()}-${ingredient.unit.toLowerCase()}`;
        
        if (ingredientMap.has(key)) {
          // Update existing item
          const existingItem = ingredientMap.get(key)!;
          existingItem.quantity += ingredient.quantity * servingsRatio;
          
          // Add recipe to sources if not already there
          if (!existingItem.recipe_sources.includes(recipe.name)) {
            existingItem.recipe_sources.push(recipe.name);
          }
        } else {
          // Add new item
          ingredientMap.set(key, {
            id: '', // Will be set by database
            name: ingredient.name,
            quantity: ingredient.quantity * servingsRatio,
            unit: ingredient.unit,
            category: ingredient.category,
            checked: false,
            recipe_sources: [recipe.name]
          });
        }
      }
    }
    
    // Create the grocery list name based on the date range
    const startDateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDateStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const listName = `Grocery List ${startDateStr} - ${endDateStr}`;
    
    // Create and return the grocery list
    return await createGroceryList({
      name: listName,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      items: Array.from(ingredientMap.values())
    });
    
  } catch (error) {
    console.error('Error generating grocery list:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}
