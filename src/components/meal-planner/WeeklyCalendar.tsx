
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import MealCard from './MealCard';
import { MealPlan, MealType, WeekDay } from '@/lib/types';
import AnimatedContainer from '@/components/ui/AnimatedContainer';

interface WeeklyCalendarProps {
  mealPlan: MealPlan[];
  onAddMeal: (day: WeekDay, mealType: MealType) => void;
  onEditMeal: (meal: MealPlan) => void;
  onDeleteMeal: (mealId: string) => void;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  mealPlan,
  onAddMeal,
  onEditMeal,
  onDeleteMeal
}) => {
  const weekDays: WeekDay[] = [
    'monday', 
    'tuesday', 
    'wednesday', 
    'thursday', 
    'friday', 
    'saturday', 
    'sunday'
  ];

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  const formatDay = (day: WeekDay): string => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const getMealsForDayAndType = (day: WeekDay, mealType: MealType): MealPlan[] => {
    return mealPlan.filter(meal => meal.day === day && meal.mealType === mealType);
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden border">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-medium">Weekly Meal Plan</h2>
      </div>
      
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-4">
          {weekDays.map((day, dayIndex) => (
            <AnimatedContainer 
              key={day} 
              animation="fade-up" 
              delay={dayIndex === 0 ? 'none' : dayIndex === 1 ? 'stagger-1' : dayIndex === 2 ? 'stagger-2' : 'stagger-3'}
              className="mb-8"
            >
              <div className="flex items-center mb-3">
                <h3 className="text-base font-medium">{formatDay(day)}</h3>
                <div className="h-px flex-1 bg-gray-100 ml-3"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {mealTypes.map(mealType => {
                  const mealsForType = getMealsForDayAndType(day, mealType);
                  
                  return (
                    <div key={`${day}-${mealType}`} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm text-muted-foreground capitalize">{mealType}</h4>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2"
                          onClick={() => onAddMeal(day, mealType)}
                        >
                          <PlusCircle size={14} className="mr-1" />
                          <span className="text-xs">Add</span>
                        </Button>
                      </div>
                      
                      {mealsForType.length > 0 ? (
                        mealsForType.map(meal => (
                          <MealCard 
                            key={meal.id} 
                            meal={meal} 
                            onEdit={onEditMeal} 
                            onDelete={onDeleteMeal} 
                          />
                        ))
                      ) : (
                        <div className="border border-dashed rounded-lg p-4 flex flex-col items-center justify-center h-32 text-center">
                          <p className="text-sm text-muted-foreground">No meals added</p>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 mt-1"
                            onClick={() => onAddMeal(day, mealType)}
                          >
                            <span className="text-xs">Add meal</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default WeeklyCalendar;
