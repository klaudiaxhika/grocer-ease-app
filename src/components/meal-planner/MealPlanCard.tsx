
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // Lowercase import to match the actual file
import { MealPlan, MealType } from '@/lib/types';
import AnimatedContainer from '@/components/ui/AnimatedContainer';

interface MealPlanCardProps {
  mealPlan: MealPlan;
  onEdit: (meal: MealPlan) => void;
  onDelete: (mealId: string) => void;
}

const mealTypeColor: Record<MealType, string> = {
  breakfast: 'bg-blue-100 text-blue-800',
  lunch: 'bg-green-100 text-green-800',
  dinner: 'bg-purple-100 text-purple-800',
  snack: 'bg-yellow-100 text-yellow-800'
};

const MealPlanCard: React.FC<MealPlanCardProps> = ({ mealPlan, onEdit, onDelete }) => {
  const { recipe, mealType, servings } = mealPlan;
  const totalTime = recipe.prepTime + recipe.cookTime;
  
  const capitalizedMealType = mealType.charAt(0).toUpperCase() + mealType.slice(1);
  
  return (
    <AnimatedContainer animation="fade-up">
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <CardHeader className="p-0">
          <div className="relative h-36 bg-gray-100 overflow-hidden">
            {recipe.image ? (
              <img 
                src={recipe.image} 
                alt={recipe.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
                <span className="text-gray-400 text-lg">{recipe.name}</span>
              </div>
            )}
            <div className="absolute top-2 left-2">
              <div className={`${mealTypeColor[mealType]} px-2 py-1 rounded text-xs font-medium`}>
                {capitalizedMealType}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-2">
            <h3 className="font-medium text-base line-clamp-1">{recipe.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 h-10">{recipe.description}</p>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> 
                <span>{totalTime} min</span>
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" /> 
                <span>{servings}</span>
              </Badge>
            </div>
            
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => onEdit(mealPlan)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(mealPlan.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
};

export default MealPlanCard;
