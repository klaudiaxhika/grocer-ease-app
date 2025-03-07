
import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { generateGroceryList } from "@/lib/supabase";
import { toast } from "sonner";
import { GroceryList } from "@/lib/types";

interface GenerateGroceryListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (groceryList: GroceryList) => void;
}

const GenerateGroceryListDialog = ({
  open,
  onOpenChange,
  onSuccess
}: GenerateGroceryListDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Calculate week range
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday as start
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 }); // Sunday as end
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await generateGroceryList(weekStart, weekEnd);
      
      if (error) throw error;
      if (!data) throw new Error('Failed to generate grocery list');
      
      toast.success('Grocery list generated successfully');
      onSuccess(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating grocery list:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate grocery list');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Weekly Grocery List</DialogTitle>
          <DialogDescription>
            Select a week to generate a grocery list based on your meal plans.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Select Week</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    <>
                      {format(weekStart, "MMM d, yyyy")} - {format(weekEnd, "MMM d, yyyy")}
                    </>
                  ) : (
                    <span>Select week</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="mt-2">
            <h3 className="text-sm font-medium mb-2">Weekly Meal Summary:</h3>
            <div className="grid grid-cols-1 gap-2 bg-muted/50 p-3 rounded-md text-sm">
              {Array.from({ length: 7 }).map((_, i) => {
                const day = addDays(weekStart, i);
                return (
                  <div key={i} className="flex">
                    <span className="font-medium w-24">{format(day, "EEEE")}:</span>
                    <span className="text-muted-foreground">
                      {format(day, "MMM d")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-md mt-2">
            <p className="text-sm text-muted-foreground">
              This will create a grocery list with all ingredients needed for the meals planned in the selected week.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Grocery List'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateGroceryListDialog;
