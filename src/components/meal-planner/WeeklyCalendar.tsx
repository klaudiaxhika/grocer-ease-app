
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MealPlan, MealType } from '@/lib/types';

interface WeeklyCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  mealPlans: MealPlan[];
}

// Define the colors for meal types
const mealIndicatorColors: Record<MealType, string> = {
  breakfast: 'bg-blue-400',
  lunch: 'bg-green-400',
  dinner: 'bg-purple-400',
  snack: 'bg-yellow-400'
};

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ 
  selectedDate, 
  onSelectDate, 
  mealPlans 
}) => {
  // Get the current day and calculate the start of the week (Sunday)
  const today = new Date();
  const currentDay = new Date(selectedDate);
  const dayOfWeek = currentDay.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Move to the start of the week (Sunday)
  const startOfWeek = new Date(currentDay);
  startOfWeek.setDate(currentDay.getDate() - dayOfWeek);
  
  // Generate an array of 7 days starting from the start of the week
  const daysOfWeek = [...Array(7)].map((_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });
  
  // Function to navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = new Date(startOfWeek);
    newDate.setDate(startOfWeek.getDate() - 7);
    onSelectDate(newDate);
  };
  
  // Function to navigate to next week
  const goToNextWeek = () => {
    const newDate = new Date(startOfWeek);
    newDate.setDate(startOfWeek.getDate() + 7);
    onSelectDate(newDate);
  };
  
  // Function to get meal indicators for a specific date
  const getMealIndicators = (date: Date) => {
    const mealsOnDate = mealPlans.filter(meal => {
      const mealDate = new Date(meal.date);
      return mealDate.toDateString() === date.toDateString();
    });
    
    const mealTypes = mealsOnDate.map(meal => meal.mealType);
    // Remove duplicates
    return [...new Set(mealTypes)];
  };
  
  // Format the month and year for the header
  const formattedMonth = startOfWeek.toLocaleDateString('en-US', { month: 'long' });
  const formattedYear = startOfWeek.getFullYear();
  
  // Check if the end of the week is in a different month
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const endFormattedMonth = endOfWeek.toLocaleDateString('en-US', { month: 'long' });
  
  // Create a header string
  const headerString = formattedMonth === endFormattedMonth
    ? `${formattedMonth} ${formattedYear}`
    : `${formattedMonth} - ${endFormattedMonth} ${formattedYear}`;
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-medium">{headerString}</h3>
        <Button variant="outline" size="icon" onClick={goToNextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {daysOfWeek.map((date, i) => {
          const dayString = date.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = date.getDate();
          const isToday = date.toDateString() === today.toDateString();
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const mealTypes = getMealIndicators(date);
          
          return (
            <Button
              key={i}
              variant="ghost"
              className={`h-auto flex flex-col items-center py-2 px-0 gap-1 rounded-lg ${
                isSelected ? 'bg-primary/10 text-primary' : ''
              } ${
                isToday && !isSelected ? 'border border-primary/30' : ''
              }`}
              onClick={() => onSelectDate(date)}
            >
              <span className="text-xs font-medium">{dayString}</span>
              <span className={`flex items-center justify-center w-8 h-8 rounded-full ${
                isToday ? 'bg-primary text-primary-foreground' : ''
              }`}>
                {dayNum}
              </span>
              
              {/* Meal type indicators */}
              {mealTypes.length > 0 && (
                <div className="flex space-x-1 mt-1">
                  {mealTypes.map((type, index) => (
                    <div 
                      key={index}
                      className={`w-2 h-2 rounded-full ${mealIndicatorColors[type]}`} 
                      title={type.charAt(0).toUpperCase() + type.slice(1)}
                    />
                  ))}
                </div>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyCalendar;
