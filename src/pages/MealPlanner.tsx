
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';
import WeeklyCalendar from '@/components/meal-planner/WeeklyCalendar';
import AnimatedContainer from '@/components/ui/AnimatedContainer';
import { MealPlan, MealType, Recipe, WeekDay } from '@/lib/types';
import { sampleMealPlan, sampleRecipes } from '@/lib/data';
import { generateGroceryList } from '@/lib/groceryUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { v4 as uuidv4 } from 'uuid';

const MealPlanner = () => {
  const [mealPlan, setMealPlan] = useState<MealPlan[]>(sampleMealPlan);
  const [selectedDay, setSelectedDay] = useState<WeekDay | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [servings, setServings] = useState<number>(1);
  const [isAddMealDialogOpen, setIsAddMealDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealPlan | null>(null);

  const handleAddMeal = (day: WeekDay, mealType: MealType) => {
    setSelectedDay(day);
    setSelectedMealType(mealType);
    setSelectedRecipe(null);
    setServings(1);
    setEditingMeal(null);
    setIsAddMealDialogOpen(true);
  };

  const handleEditMeal = (meal: MealPlan) => {
    setSelectedDay(meal.day);
    setSelectedMealType(meal.mealType);
    setSelectedRecipe(meal.recipe);
    setServings(meal.servings);
    setEditingMeal(meal);
    setIsAddMealDialogOpen(true);
  };

  const handleDeleteMeal = (mealId: string) => {
    setMealPlan(prevMealPlan => prevMealPlan.filter(meal => meal.id !== mealId));
    toast.success('Meal removed from plan');
  };

  const handleSaveMeal = () => {
    if (!selectedDay || !selectedMealType || !selectedRecipe) {
      toast.error('Please fill in all fields');
      return;
    }

    if (editingMeal) {
      // Update existing meal
      setMealPlan(prevMealPlan => 
        prevMealPlan.map(meal => 
          meal.id === editingMeal.id 
            ? {
                ...meal,
                day: selectedDay,
                mealType: selectedMealType,
                recipe: selectedRecipe,
                servings: servings
              }
            : meal
        )
      );
      toast.success('Meal updated successfully');
    } else {
      // Add new meal
      const newMeal: MealPlan = {
        id: uuidv4(),
        day: selectedDay,
        mealType: selectedMealType,
        recipe: selectedRecipe,
        servings: servings
      };
      
      setMealPlan(prevMealPlan => [...prevMealPlan, newMeal]);
      toast.success('Meal added to plan');
    }

    // Close dialog and reset
    setIsAddMealDialogOpen(false);
    setEditingMeal(null);
  };

  const handleGenerateGroceryList = () => {
    if (mealPlan.length === 0) {
      toast.error('Please add meals to your plan first');
      return;
    }

    try {
      // In a real app, we'd save this to storage or state management
      const groceryList = generateGroceryList(mealPlan);
      console.log('Generated grocery list:', groceryList);
      toast.success('Grocery list generated successfully!');
      
      // Navigate to grocery list page
      // In a real implementation, we'd pass the generated list through state management
    } catch (error) {
      console.error('Error generating grocery list:', error);
      toast.error('Failed to generate grocery list');
    }
  };

  const formatDay = (day: WeekDay): string => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const formatMealType = (type: MealType): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <AnimatedContainer animation="fade-up" className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Meal Planner</h1>
            <p className="text-muted-foreground">Plan your meals for the week and generate a grocery list.</p>
          </div>
          
          <div className="flex mt-4 md:mt-0">
            <Button 
              variant="outline" 
              className="mr-2"
              onClick={() => setMealPlan([])}
            >
              Clear Plan
            </Button>
            <Button 
              onClick={handleGenerateGroceryList}
              asChild
            >
              <Link to="/grocery-list">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Generate Grocery List
              </Link>
            </Button>
          </div>
        </AnimatedContainer>

        <WeeklyCalendar 
          mealPlan={mealPlan} 
          onAddMeal={handleAddMeal}
          onEditMeal={handleEditMeal}
          onDeleteMeal={handleDeleteMeal}
        />
      </div>

      {/* Add/Edit Meal Dialog */}
      <Dialog open={isAddMealDialogOpen} onOpenChange={setIsAddMealDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingMeal ? 'Edit Meal' : 'Add Meal'}</DialogTitle>
            <DialogDescription>
              {editingMeal 
                ? 'Update the details for this meal.' 
                : 'Add a new meal to your weekly plan.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="day" className="text-sm font-medium">Day</label>
                <Select
                  value={selectedDay || undefined}
                  onValueChange={(value) => setSelectedDay(value as WeekDay)}
                  disabled={!!editingMeal}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <SelectItem key={day} value={day}>
                        {formatDay(day as WeekDay)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="mealType" className="text-sm font-medium">Meal Type</label>
                <Select
                  value={selectedMealType || undefined}
                  onValueChange={(value) => setSelectedMealType(value as MealType)}
                  disabled={!!editingMeal}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select meal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatMealType(type as MealType)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="recipe" className="text-sm font-medium">Recipe</label>
              <Select
                value={selectedRecipe?.id || undefined}
                onValueChange={(value) => {
                  const recipe = sampleRecipes.find(r => r.id === value);
                  setSelectedRecipe(recipe || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipe" />
                </SelectTrigger>
                <SelectContent>
                  {sampleRecipes.map((recipe) => (
                    <SelectItem key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="servings" className="text-sm font-medium">Servings</label>
              <Input
                id="servings"
                type="number"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                min={1}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMealDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMeal}>
              {editingMeal ? 'Update' : 'Add to Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default MealPlanner;
