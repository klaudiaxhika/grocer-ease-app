
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // Corrected casing
import { MealPlan, MealType } from '@/lib/types';
import AnimatedContainer from '@/components/ui/AnimatedContainer';

interface MealCardProps {
  meal: MealPlan;
  onEdit: (meal: MealPlan) => void;
  onDelete: (mealId: string) => void;
}

const mealTypeColor: Record<MealType, { bg: string; text: string }> = {
  breakfast: { bg: 'bg-blue-100', text: 'text-blue-800' },
  lunch: { bg: 'bg-green-100', text: 'text-green-800' },
  dinner: { bg: 'bg-purple-100', text: 'text-purple-800' },
  snack: { bg: 'bg-yellow-100', text: 'text-yellow-800' }
};

const MealCard: React.FC<MealCardProps> = ({ meal, onEdit, onDelete }) => {
  const { recipe, mealType, servings } = meal;
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
              <div className={`${mealTypeColor[mealType].bg} ${mealTypeColor[mealType].text} px-2 py-1 rounded text-xs font-medium`}>
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
                <Clock size={12} /> 
                <span>{totalTime} min</span>
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users size={12} /> 
                <span>{servings}</span>
              </Badge>
            </div>
            
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => onEdit(meal)}
              >
                <Edit size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(meal.id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
};

export default MealCard;
