import React, { useState } from 'react';
import { PlusCircle, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import AnimatedContainer from '@/components/ui/AnimatedContainer';
import WeeklyCalendar from '@/components/meal-planner/WeeklyCalendar';
import { MealPlan, Recipe } from '@/lib/types';
import MealPlanCard from '@/components/meal-planner/MealPlanCard';
import { toast } from 'sonner';
import AddMealDialog from '@/components/meal-planner/AddMealDialog';
import UploadMealPlanDialog from '@/components/meal-planner/UploadMealPlanDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMealPlans, createMealPlan, updateMealPlan, deleteMealPlan, createRecipe } from '@/lib/supabase';
import { Loader2 as Loader } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const MealPlanner = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [isUploadMealPlanOpen, setIsUploadMealPlanOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const { data: mealPlans, isLoading, isError } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: getMealPlans,
    select: (data) => data.data || [],
    enabled: !!user,
  });

  const createMealPlanMutation = useMutation({
    mutationFn: createMealPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast.success('Meal added to your plan');
    },
    onError: (error) => {
      console.error('Error creating meal plan:', error);
      toast.error('Failed to add meal to plan');
    }
  });

  const createRecipeMutation = useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
    onError: (error) => {
      console.error('Error creating recipe:', error);
      toast.error('Failed to create recipe');
    }
  });

  const updateMealPlanMutation = useMutation({
    mutationFn: updateMealPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast.success('Meal updated');
    },
    onError: (error) => {
      console.error('Error updating meal plan:', error);
      toast.error('Failed to update meal');
    }
  });

  const deleteMealPlanMutation = useMutation({
    mutationFn: deleteMealPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast.success('Meal removed from your plan');
    },
    onError: (error) => {
      console.error('Error deleting meal plan:', error);
      toast.error('Failed to remove meal');
    }
  });

  const mealsForSelectedDate = mealPlans?.filter(meal => {
    const mealDate = new Date(meal.date);
    return mealDate.toDateString() === selectedDate.toDateString();
  }) || [];

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddMeal = (meal: Omit<MealPlan, 'id'>) => {
    createMealPlanMutation.mutate(meal);
    setIsAddMealOpen(false);
  };

  const handleDeleteMeal = (mealId: string) => {
    deleteMealPlanMutation.mutate(mealId);
  };

  const handleEditMeal = (updatedMeal: MealPlan) => {
    updateMealPlanMutation.mutate(updatedMeal);
  };

  const handleImportMealPlan = async (recipes: Recipe[], mealPlans: Omit<MealPlan, 'id'>[]) => {
    if (!user) {
      toast.error('You must be logged in to import meal plans');
      return;
    }

    setIsImporting(true);
    try {
      const recipePromises = recipes.map(async (recipe) => {
        const { id, user_id, created_at, updated_at, ...recipeData } = recipe;
        
        const { data, error } = await createRecipeMutation.mutateAsync(recipeData);
        if (error) throw error;
        
        return { originalId: id, newId: data.id };
      });
      
      const createdRecipes = await Promise.all(recipePromises);
      
      const recipeIdMap = new Map(
        createdRecipes.map(r => [r.originalId, r.newId])
      );
      
      const mealPlanPromises = mealPlans.map(async (mealPlan) => {
        const newRecipeId = recipeIdMap.get(mealPlan.recipe.id);
        if (!newRecipeId) {
          console.error(`Could not find new ID for recipe ${mealPlan.recipe.id}`);
          return;
        }
        
        const newMealPlan = {
          recipe_id: newRecipeId,
          date: mealPlan.date,
          day: mealPlan.day,
          meal_type: mealPlan.meal_type,
          servings: mealPlan.servings
        };
        
        return createMealPlanMutation.mutateAsync(newMealPlan);
      });
      
      await Promise.all(mealPlanPromises);
      
      toast.success(`Successfully imported ${recipes.length} recipes and ${mealPlans.length} meal plans`);
    } catch (error) {
      console.error('Error importing meal plan:', error);
      toast.error('Failed to import meal plan');
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading your meal plans...</span>
        </div>
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Meal Plans</h2>
          <p className="text-muted-foreground mb-4">There was a problem loading your meal plans.</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['mealPlans'] })}>
            Try Again
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <AnimatedContainer animation="fade-up" className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Meal Planner</h1>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsUploadMealPlanOpen(true)}
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Meal Plan
                </>
              )}
            </Button>
            <Button onClick={() => setIsAddMealOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Meal
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <WeeklyCalendar 
              selectedDate={selectedDate} 
              onSelectDate={handleDateSelect} 
              mealPlans={mealPlans || []}
            />
          </CardContent>
        </Card>
      </AnimatedContainer>

      <AnimatedContainer animation="fade-up" delay="stagger-1">
        <h2 className="text-xl font-semibold mb-4">
          {mealsForSelectedDate.length > 0 
            ? `Meals for ${selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}` 
            : `No meals planned for ${selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`
          }
        </h2>
        
        {mealsForSelectedDate.length === 0 ? (
          <Card className="bg-muted/50">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">You haven't planned any meals for this day yet.</p>
              <Button onClick={() => setIsAddMealOpen(true)}>Add Your First Meal</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mealsForSelectedDate.map((meal) => (
              <MealPlanCard 
                key={meal.id} 
                mealPlan={meal} 
                onEdit={handleEditMeal} 
                onDelete={handleDeleteMeal} 
              />
            ))}
          </div>
        )}
      </AnimatedContainer>

      <AddMealDialog 
        open={isAddMealOpen} 
        onOpenChange={setIsAddMealOpen}
        onAddMeal={handleAddMeal}
        selectedDate={selectedDate}
        availableRecipes={[]} // This prop is no longer used as we fetch recipes in the dialog
      />

      <UploadMealPlanDialog
        open={isUploadMealPlanOpen}
        onOpenChange={setIsUploadMealPlanOpen}
        onSuccess={handleImportMealPlan}
      />
    </AppLayout>
  );
};

export default MealPlanner;
