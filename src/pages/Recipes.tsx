
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Clock, Users, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import AnimatedContainer from '@/components/ui/AnimatedContainer';
import Badge from '@/components/ui/Badge';
import { Recipe } from '@/lib/types';
import { sampleRecipes } from '@/lib/data';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const Recipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>(sampleRecipes);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);

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

  return (
    <AppLayout>
      <div className="mb-8">
        <AnimatedContainer animation="fade-up" className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Recipes</h1>
            <p className="text-muted-foreground">Browse and manage your recipes.</p>
          </div>
          
          <Button className="mt-4 md:mt-0">
            <Plus className="mr-2 h-4 w-4" />
            Add New Recipe
          </Button>
        </AnimatedContainer>

        <AnimatedContainer animation="fade-up" delay="stagger-1" className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search recipes by name or tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </AnimatedContainer>

        <AnimatedContainer animation="fade-up" delay="stagger-2">
          {filteredRecipes.length > 0 ? (
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
              <Button variant="outline">
                Add Your First Recipe
              </Button>
            </div>
          )}
        </AnimatedContainer>
      </div>

      {/* Recipe Details Dialog */}
      {selectedRecipe && (
        <Dialog open={isRecipeDialogOpen} onOpenChange={setIsRecipeDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedRecipe.name}</DialogTitle>
              <DialogDescription>{selectedRecipe.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-sm">{selectedRecipe.prepTime + selectedRecipe.cookTime} min</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-sm">{selectedRecipe.servings} servings</span>
                  </div>
                </div>
                
                <Button size="sm" onClick={() => handleAddToMealPlan(selectedRecipe)}>
                  Add to Meal Plan
                </Button>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Ingredients</h3>
                <ul className="space-y-2">
                  {selectedRecipe.ingredients.map((ingredient) => (
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
                  {selectedRecipe.instructions.map((instruction, index) => (
                    <li key={index} className="text-sm list-decimal">
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>

              {selectedRecipe.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipe.tags.map((tag) => (
                      <Badge key={tag} variant="outline" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
};

interface RecipeCardProps {
  recipe: Recipe;
  onView: () => void;
  onAddToMealPlan: () => void;
  delay?: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onView, onAddToMealPlan, delay }) => {
  const { name, description, prepTime, cookTime, servings, tags } = recipe;
  const totalTime = prepTime + cookTime;
  
  return (
    <AnimatedContainer
      animation="fade-up"
      delay={delay ? "stagger-1" : "none"}
      className="h-full"
    >
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
        <CardHeader className="p-0">
          <div className="relative h-40 bg-gray-100 overflow-hidden">
            {recipe.image ? (
              <img src={recipe.image} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
                <span className="text-muted-foreground">{name}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5 flex flex-col flex-grow">
          <h3 className="font-medium text-lg mb-1">{name}</h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-grow">{description}</p>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              <span>{totalTime} min</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              <span>{servings}</span>
            </div>
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" size="sm">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline" size="sm">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex gap-2 mt-auto">
            <Button variant="outline" className="flex-1" onClick={onView}>
              View
            </Button>
            <Button className="flex-1" onClick={onAddToMealPlan}>
              Add to Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
};

export default Recipes;
