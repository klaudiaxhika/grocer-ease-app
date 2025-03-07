
import { createClient } from '@supabase/supabase-js';
import { Ingredient, Recipe } from './types';

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
