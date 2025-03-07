
import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import AnimatedContainer from '@/components/ui/AnimatedContainer';
import WeeklyCalendar from '@/components/meal-planner/WeeklyCalendar';
import { MealPlan, Recipe } from '@/lib/types';
import { sampleMealPlans, sampleRecipes } from '@/lib/data';
import MealPlanCard from '@/components/meal-planner/MealPlanCard';
import { toast } from 'sonner';
import AddMealDialog from '@/components/meal-planner/AddMealDialog';

const MealPlanner = () => {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>(sampleMealPlans);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  
  // Filter meals for the selected date
  const mealsForSelectedDate = mealPlans.filter(meal => {
    const mealDate = new Date(meal.date);
    return mealDate.toDateString() === selectedDate.toDateString();
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddMeal = (meal: MealPlan) => {
    setMealPlans([...mealPlans, meal]);
    setIsAddMealOpen(false);
    toast.success('Meal added to your plan');
  };

  const handleDeleteMeal = (mealId: string) => {
    setMealPlans(mealPlans.filter(meal => meal.id !== mealId));
    toast.success('Meal removed from your plan');
  };

  const handleEditMeal = (updatedMeal: MealPlan) => {
    setMealPlans(mealPlans.map(meal => 
      meal.id === updatedMeal.id ? updatedMeal : meal
    ));
    toast.success('Meal updated');
  };

  return (
    <AppLayout>
      <AnimatedContainer animation="fade-up" className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Meal Planner</h1>
          <Button onClick={() => setIsAddMealOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Meal
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <WeeklyCalendar 
              selectedDate={selectedDate} 
              onSelectDate={handleDateSelect} 
              mealPlans={mealPlans}
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
        availableRecipes={sampleRecipes}
      />
    </AppLayout>
  );
};

export default MealPlanner;
