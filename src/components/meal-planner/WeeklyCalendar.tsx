
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { MealPlan, MealType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface WeeklyCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  mealPlans: MealPlan[];
}

interface DayProps {
  day: Date;
  isSelected: boolean;
  onClick: () => void;
  meals: { [key in MealType]?: number };
}

const mealTypeColors: Record<MealType, string> = {
  breakfast: 'bg-blue-500',
  lunch: 'bg-green-500',
  dinner: 'bg-purple-500',
  snack: 'bg-yellow-500',
};

const Day: React.FC<DayProps> = ({ day, isSelected, onClick, meals }) => {
  const dayNumber = format(day, 'd');
  const dayName = format(day, 'EEE');
  const isToday = isSameDay(day, new Date());

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-start pt-2 pb-1 rounded-lg transition-colors cursor-pointer relative",
        isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted",
        isToday && !isSelected && "ring-1 ring-primary"
      )}
      onClick={onClick}
    >
      <div className="text-xs font-medium mb-1">{dayName}</div>
      <div className={cn("font-semibold text-lg mb-2", isSelected ? "text-primary-foreground" : "")}>{dayNumber}</div>
      
      {/* Meal indicators */}
      <div className="flex gap-[3px] mb-1">
        {Object.entries(meals).map(([type, count]) => (
          count > 0 && (
            <div 
              key={type} 
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                mealTypeColors[type as MealType],
                isSelected && "opacity-80"
              )}
              title={`${count} ${type} meal${count > 1 ? 's' : ''}`}
            />
          )
        ))}
      </div>
    </div>
  );
};

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ selectedDate, onSelectDate, mealPlans }) => {
  // Get start of current week (Sunday)
  const startDate = startOfWeek(selectedDate);
  
  // Generate the 7 days of the week
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const day = addDays(startDate, i);
    
    // Count meals for each meal type on this day
    const mealCounts: { [key in MealType]?: number } = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0
    };
    
    mealPlans.forEach(meal => {
      const mealDate = new Date(meal.date);
      if (isSameDay(day, mealDate)) {
        mealCounts[meal.mealType] = (mealCounts[meal.mealType] || 0) + 1;
      }
    });
    
    return {
      date: day,
      isSelected: isSameDay(day, selectedDate),
      meals: mealCounts
    };
  });
  
  const handlePrevWeek = () => {
    const newDate = addDays(startDate, -7);
    onSelectDate(newDate);
  };
  
  const handleNextWeek = () => {
    const newDate = addDays(startDate, 7);
    onSelectDate(newDate);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">{format(startDate, 'MMMM yyyy')}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <Day
            key={day.date.toISOString()}
            day={day.date}
            isSelected={day.isSelected}
            onClick={() => onSelectDate(day.date)}
            meals={day.meals}
          />
        ))}
      </div>
    </div>
  );
};

export default WeeklyCalendar;
