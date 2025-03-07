
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MealPlan, MealType, Recipe, WeekDay } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { getRecipes } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface AddMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMeal: (meal: Omit<MealPlan, 'id'>) => void;
  selectedDate: Date;
  availableRecipes: Recipe[];
}

// Helper function to convert date to weekday
const getWeekDay = (date: Date): WeekDay => {
  const days: WeekDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

const AddMealDialog: React.FC<AddMealDialogProps> = ({ 
  open, 
  onOpenChange, 
  onAddMeal, 
  selectedDate
}) => {
  const [selectedRecipe, setSelectedRecipe] = useState<string>('');
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [servings, setServings] = useState<number>(2);
  
  // Fetch recipes from database
  const { data: recipesData, isLoading: isLoadingRecipes, isError: isRecipesError } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data, error } = await getRecipes();
      if (error) throw error;
      return data || [];
    },
    enabled: open // Only fetch when dialog is open
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const recipe = recipesData?.find(r => r.id === selectedRecipe);
    if (!recipe) return;
    
    const newMeal: Omit<MealPlan, 'id'> = {
      date: selectedDate.toISOString(),
      day: getWeekDay(selectedDate),
      recipe: recipe,
      mealType: mealType,
      servings: servings
    };
    
    onAddMeal(newMeal);
    resetForm();
  };
  
  const resetForm = () => {
    setSelectedRecipe('');
    setMealType('breakfast');
    setServings(2);
  };
  
  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Meal to Plan</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipe">Recipe</Label>
            {isLoadingRecipes ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading recipes...</span>
              </div>
            ) : isRecipesError ? (
              <div className="text-sm text-destructive p-2 border border-destructive/20 rounded-md">
                Failed to load recipes. Please try again.
              </div>
            ) : (
              <Select
                value={selectedRecipe}
                onValueChange={setSelectedRecipe}
                required
              >
                <SelectTrigger id="recipe">
                  <SelectValue placeholder="Select a recipe" />
                </SelectTrigger>
                <SelectContent>
                  {recipesData && recipesData.length > 0 ? (
                    recipesData.map(recipe => (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        {recipe.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="text-center py-2 text-sm text-muted-foreground">
                      No recipes found. Add some from the Recipes page.
                    </div>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="meal-type">Meal Type</Label>
            <Select
              value={mealType}
              onValueChange={(value) => setMealType(value as MealType)}
              required
            >
              <SelectTrigger id="meal-type">
                <SelectValue placeholder="Select meal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="servings">Servings</Label>
            <Input
              id="servings"
              type="number"
              min="1"
              max="20"
              value={servings}
              onChange={e => setServings(parseInt(e.target.value))}
              required
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedRecipe || isLoadingRecipes}
            >
              Add to Plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMealDialog;
