
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Recipe, MealPlan, MealType, WeekDay } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [extractedData, setExtractedData] = useState<{
    recipes: Recipe[];
    mealPlans: Omit<MealPlan, 'id'>[]; 
  } | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMealPlanText(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        toast.error('Please upload a PDF file');
      }
    }
  };

  const resetForm = () => {
    setMealPlanText('');
    setSelectedFile(null);
    setIsProcessing(false);
    setProcessingStatus('idle');
    setExtractedData(null);
  };

  // Helper function to get weekday from date
  const getWeekDay = (date: Date): WeekDay => {
    const day = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as WeekDay;
    return day || 'monday';
  };

  // Helper function to validate and convert meal type
  const validateMealType = (type: string): MealType => {
    const validTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    return validTypes.includes(type as MealType) 
      ? (type as MealType) 
      : 'dinner';
  };

  const processMealPlan = async () => {
    if (!mealPlanText && !selectedFile) {
      toast.error('Please enter meal plan text or upload a PDF file');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('processing');

    try {
      // Get auth session for the token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      
      // Get the URL for the process-meal-plan function
      // We use a string template to construct the URL since we can't access the protected 'url' property
      const functionUrl = `https://yilqlufqhjwszclncjdk.supabase.co/functions/v1/process-meal-plan`;
      
      let response;
      
      if (selectedFile) {
        // If we have a file, we need to use FormData
        const formData = new FormData();
        if (mealPlanText) {
          formData.append('mealPlanText', mealPlanText);
        }
        formData.append('pdfFile', selectedFile);
        
        response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Using the project's anon key directly instead of accessing the protected supabaseKey
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpbHFsdWZxaGp3c3pjbG5jamRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNTUwOTksImV4cCI6MjA1NjkzMTA5OX0.msrgbjLs0wm_TimAXba31fd8mnaN7sAiFw8dAGSMSms'
          },
          body: formData
        });
      } else {
        // For text-only, we can use JSON
        response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Using the project's anon key directly instead of accessing the protected supabaseKey
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpbHFsdWZxaGp3c3pjbG5jamRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNTUwOTksImV4cCI6MjA1NjkzMTA5OX0.msrgbjLs0wm_TimAXba31fd8mnaN7sAiFw8dAGSMSms',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ mealPlanText })
        });
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data?.mealPlan) {
        throw new Error('No meal plan data returned');
      }

      console.log('Processed meal plan data:', data.mealPlan);

      // Transform the data into the format we need
      const recipes: Recipe[] = [];
      const mealPlans: Omit<MealPlan, 'id'>[] = [];

      // Process each meal plan entry
      for (const entry of data.mealPlan) {
        if (!entry.recipe || !entry.recipe.name) continue;

        // Create a recipe object
        const recipe: Recipe = {
          id: crypto.randomUUID(),
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
          image_url: '',
          user_id: '00000000-0000-0000-0000-000000000000',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Add recipe to our collection if it has ingredients
        if (recipe.ingredients.length > 0) {
          // Check if we already have a similar recipe by name
          const existingRecipeIndex = recipes.findIndex(r => 
            r.name.toLowerCase() === recipe.name.toLowerCase()
          );

          if (existingRecipeIndex === -1) {
            recipes.push(recipe);
          }

          // Create a meal plan entry if we have date and meal type
          if (entry.date || entry.mealType) {
            const date = entry.date ? new Date(entry.date) : new Date();
            const mealType = validateMealType(entry.mealType || 'dinner');
            
            mealPlans.push({
              recipe,
              date: date.toISOString(),
              day: getWeekDay(date),
              mealType,
              servings: entry.recipe.servings || 2,
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
            Upload a PDF file or paste your meal plan text and our AI will extract recipes and meal schedule.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="text">
              <FileText className="h-4 w-4 mr-2" /> Text Input
            </TabsTrigger>
            <TabsTrigger value="pdf">
              <Upload className="h-4 w-4 mr-2" /> PDF Upload
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
          </TabsContent>

          <TabsContent value="pdf" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      {selectedFile ? selectedFile.name : 'Click to upload a PDF file'}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={isProcessing || processingStatus === 'success'}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a PDF file containing your meal plan. The AI will extract all recipes and schedules.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {processingStatus === 'error' && (
          <div className="mt-4">
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="p-4 flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Error Processing</p>
                  <p className="text-sm text-destructive/90">
                    There was an error processing your meal plan. Please try again with more detailed text.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {processingStatus === 'success' && extractedData && (
          <div className="mt-4 space-y-4">
            <Card className="border-green-600 bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-4 flex items-start space-x-2">
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-600">Success</p>
                  <p className="text-sm text-green-600/90">
                    Successfully extracted {extractedData.recipes.length} recipes and {extractedData.mealPlans.length} meal plan entries.
                  </p>
                </div>
              </CardContent>
            </Card>
            
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

        <DialogFooter className="mt-6 space-x-2">
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
              disabled={isProcessing || (!mealPlanText && !selectedFile)}
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
