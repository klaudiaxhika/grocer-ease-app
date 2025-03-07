
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Recipe, MealPlan } from '@/lib/types';
import { createRecipe } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UploadMealPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (recipes: Recipe[], mealPlans: Omit<MealPlan, 'id'>[]) => void;
}

const UploadMealPlanDialog: React.FC<UploadMealPlanDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [mealPlanText, setMealPlanText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [extractedData, setExtractedData] = useState<{
    recipes: Recipe[];
    mealPlans: Omit<MealPlan, 'id'>[];
  } | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMealPlanText(e.target.value);
  };

  const resetForm = () => {
    setMealPlanText('');
    setIsProcessing(false);
    setProcessingStatus('idle');
    setExtractedData(null);
  };

  const processMealPlan = async () => {
    if (!mealPlanText.trim()) {
      toast.error('Please enter meal plan text to process');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('processing');

    try {
      // Call the Edge Function to process the meal plan
      const { data, error } = await supabase.functions.invoke('process-meal-plan', {
        body: { mealPlanText }
      });

      if (error) throw new Error(error.message);
      if (!data?.data?.mealPlan) throw new Error('No meal plan data returned');

      const mealPlanData = data.data.mealPlan;
      console.log('Processed meal plan data:', mealPlanData);

      // Transform the data into the format we need
      const recipes: Recipe[] = [];
      const mealPlans: Omit<MealPlan, 'id'>[] = [];

      // Process each meal plan entry
      for (const entry of mealPlanData) {
        if (!entry.recipe || !entry.recipe.name) continue;

        // Create a recipe object
        const recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
          name: entry.recipe.name,
          description: entry.recipe.description || '',
          ingredients: entry.recipe.ingredients?.map(ing => ({
            id: crypto.randomUUID(),
            name: ing.name,
            quantity: ing.quantity || 1,
            unit: ing.unit || '',
            category: 'other'
          })) || [],
          instructions: entry.recipe.instructions || [],
          servings: entry.recipe.servings || 2,
          prep_time: entry.recipe.prepTime || 15,
          cook_time: entry.recipe.cookTime || 30,
          tags: [],
          image_url: ''
        };

        // Add recipe to our collection if it has ingredients
        if (recipe.ingredients.length > 0) {
          // Check if we already have a similar recipe by name
          const existingRecipeIndex = recipes.findIndex(r => 
            r.name.toLowerCase() === recipe.name.toLowerCase()
          );

          let recipeId: string;
          
          if (existingRecipeIndex === -1) {
            // New recipe
            const newRecipe = {
              ...recipe,
              id: crypto.randomUUID(),
              user_id: '00000000-0000-0000-0000-000000000000', // Placeholder, will be set on save
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            recipes.push(newRecipe);
            recipeId = newRecipe.id;
          } else {
            // Use existing recipe
            recipeId = recipes[existingRecipeIndex].id;
          }

          // Create a meal plan entry if we have date and meal type
          if (entry.date || entry.mealType) {
            const date = entry.date ? new Date(entry.date) : new Date();
            const mealType = entry.mealType || 'dinner';
            
            mealPlans.push({
              recipe_id: recipeId,
              date,
              meal_type: mealType,
              servings: entry.recipe.servings || 2,
              day: date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
            });
          }
        }
      }

      setExtractedData({ recipes, mealPlans });
      setProcessingStatus('success');
      toast.success(`Successfully extracted ${recipes.length} recipes and ${mealPlans.length} meal plan entries`);
    } catch (error) {
      console.error('Error processing meal plan:', error);
      setProcessingStatus('error');
      toast.error(error.message || 'Failed to process meal plan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (!extractedData) return;
    onSuccess(extractedData.recipes, extractedData.mealPlans);
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !isProcessing) {
        resetForm();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Meal Plan</DialogTitle>
          <DialogDescription>
            Paste your meal plan text and our AI will extract recipes and meal schedule.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="text">
              <FileText className="h-4 w-4 mr-2" /> Text Input
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Paste your meal plan text here. Include recipe names, ingredients, instructions, and meal times if available."
                className="min-h-[200px]"
                value={mealPlanText}
                onChange={handleTextChange}
                disabled={isProcessing || processingStatus === 'success'}
              />
              <p className="text-xs text-muted-foreground">
                Tip: The more detailed your meal plan, the better the AI can extract recipe information.
              </p>
            </div>

            {processingStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  There was an error processing your meal plan. Please try again with more detailed text.
                </AlertDescription>
              </Alert>
            )}

            {processingStatus === 'success' && extractedData && (
              <div className="space-y-4">
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    Successfully extracted {extractedData.recipes.length} recipes and {extractedData.mealPlans.length} meal plan entries.
                  </AlertDescription>
                </Alert>
                
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-medium mb-2">Extracted Recipes:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {extractedData.recipes.map((recipe, index) => (
                      <li key={index}>{recipe.name} ({recipe.ingredients.length} ingredients)</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-4 space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          
          {processingStatus !== 'success' ? (
            <Button 
              onClick={processMealPlan} 
              disabled={isProcessing || !mealPlanText.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Process Meal Plan
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleImport}
              disabled={!extractedData || extractedData.recipes.length === 0}
            >
              <Check className="mr-2 h-4 w-4" />
              Import to Meal Planner
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadMealPlanDialog;
