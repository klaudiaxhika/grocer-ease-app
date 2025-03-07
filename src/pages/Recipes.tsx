
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import AnimatedContainer from '@/components/ui/AnimatedContainer';
import { Recipe } from '@/lib/types';
import { toast } from 'sonner';
import RecipeCard from '@/components/recipes/RecipeCard';
import RecipeDetailsDialog from '@/components/recipes/RecipeDetailsDialog';
import RecipeSearchBar from '@/components/recipes/RecipeSearchBar';
import { getRecipes } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import AddEditRecipeDialog from '@/components/recipes/AddEditRecipeDialog';

const Recipes = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);
  const [isAddRecipeDialogOpen, setIsAddRecipeDialogOpen] = useState(false);
  
  // Fetch recipes using React Query
  const { data: recipesData, isLoading, isError, refetch } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data, error } = await getRecipes();
      if (error) throw error;
      return data || [];
    },
    enabled: !!user, // Only fetch if user is logged in
  });

  // Use the fetched recipes or empty array if not available
  const recipes = recipesData || [];

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsRecipeDialogOpen(true);
  };

  const handleAddToMealPlan = (recipe: Recipe) => {
    // In a real app, this would navigate to meal planner with pre-selected recipe
    toast.success(`${recipe.name} added to meal planner`);
  };

  const handleAddRecipeSuccess = () => {
    refetch(); // Refresh the recipes list
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <AnimatedContainer animation="fade-up" className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Recipes</h1>
            <p className="text-muted-foreground">Browse and manage your recipes.</p>
          </div>
          
          <Button className="mt-4 md:mt-0" onClick={() => setIsAddRecipeDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Recipe
          </Button>
        </AnimatedContainer>

        <RecipeSearchBar 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
        />

        <AnimatedContainer animation="fade-up" delay="stagger-2">
          {isLoading ? (
            <div className="text-center py-12">
              <p>Loading your recipes...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <h3 className="text-lg font-medium mb-2 text-destructive">Error loading recipes</h3>
              <p className="text-muted-foreground mb-4">
                There was a problem loading your recipes.
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe, index) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onView={() => handleViewRecipe(recipe)}
                  onAddToMealPlan={() => handleAddToMealPlan(recipe)}
                  delay={index < 6}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No recipes found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Try a different search term'
                  : 'You have no recipes yet'}
              </p>
              <Button variant="outline" onClick={() => setIsAddRecipeDialogOpen(true)}>
                Add Your First Recipe
              </Button>
            </div>
          )}
        </AnimatedContainer>
      </div>

      <RecipeDetailsDialog
        recipe={selectedRecipe}
        open={isRecipeDialogOpen}
        onOpenChange={setIsRecipeDialogOpen}
        onAddToMealPlan={handleAddToMealPlan}
      />

      <AddEditRecipeDialog
        open={isAddRecipeDialogOpen}
        onOpenChange={setIsAddRecipeDialogOpen}
        onSuccess={handleAddRecipeSuccess}
      />
    </AppLayout>
  );
};

export default Recipes;
