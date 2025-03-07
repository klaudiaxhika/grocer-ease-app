
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users } from 'lucide-react';
import AnimatedContainer from '@/components/ui/AnimatedContainer';
import { Recipe } from '@/lib/types';

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
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline">
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

export default RecipeCard;
