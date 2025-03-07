
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MealPlan, MealType, Recipe } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface AddMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMeal: (meal: MealPlan) => void;
  selectedDate: Date;
  availableRecipes: Recipe[];
}

const AddMealDialog: React.FC<AddMealDialogProps> = ({ 
  open, 
  onOpenChange, 
  onAddMeal, 
  selectedDate,
  availableRecipes 
}) => {
  const [selectedRecipe, setSelectedRecipe] = useState<string>('');
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [servings, setServings] = useState<number>(2);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const recipe = availableRecipes.find(r => r.id === selectedRecipe);
    if (!recipe) return;
    
    const newMeal: MealPlan = {
      id: uuidv4(),
      date: selectedDate.toISOString(),
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
            <Select
              value={selectedRecipe}
              onValueChange={setSelectedRecipe}
              required
            >
              <SelectTrigger id="recipe">
                <SelectValue placeholder="Select a recipe" />
              </SelectTrigger>
              <SelectContent>
                {availableRecipes.map(recipe => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button type="submit" disabled={!selectedRecipe}>
              Add to Plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMealDialog;
