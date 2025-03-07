
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users } from 'lucide-react';
import { Recipe } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface RecipeDetailsDialogProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToMealPlan: (recipe: Recipe) => void;
}

const RecipeDetailsDialog: React.FC<RecipeDetailsDialogProps> = ({ 
  recipe, 
  open, 
  onOpenChange,
  onAddToMealPlan
}) => {
  if (!recipe) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recipe.name}</DialogTitle>
          <DialogDescription>{recipe.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                <span className="text-sm">{recipe.prepTime + recipe.cookTime} min</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                <span className="text-sm">{recipe.servings} servings</span>
              </div>
            </div>
            
            <Button size="sm" onClick={() => onAddToMealPlan(recipe)}>
              Add to Meal Plan
            </Button>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Ingredients</h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient.id} className="text-sm flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    {ingredient.quantity} {ingredient.unit} {ingredient.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Instructions</h3>
            <ol className="space-y-2 ml-4">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="text-sm list-decimal">
                  {instruction}
                </li>
              ))}
            </ol>
          </div>

          {recipe.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeDetailsDialog;
