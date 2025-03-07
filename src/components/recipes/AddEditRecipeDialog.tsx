
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, X, Link, Loader2, Sparkles } from 'lucide-react';
import { Recipe, Ingredient, IngredientCategory } from '@/lib/types';
import { createRecipe } from '@/lib/supabase';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from "@/components/ui/switch";

interface AddEditRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (recipe: Recipe) => void;
}

const emptyIngredient = (): Ingredient => ({
  id: uuidv4(),
  name: '',
  quantity: 1,
  unit: '',
  category: 'other',
});

const ingredientCategories: IngredientCategory[] = [
  'produce', 'dairy', 'meat', 'seafood', 'bakery', 'frozen', 
  'canned', 'dry goods', 'spices', 'condiments', 'beverages', 'snacks', 'other'
];

const AddEditRecipeDialog: React.FC<AddEditRecipeDialogProps> = ({ 
  open, 
  onOpenChange,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recipeUrl, setRecipeUrl] = useState('');
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState(2);
  const [prepTime, setPrepTime] = useState(15);
  const [cookTime, setCookTime] = useState(30);
  const [imageUrl, setImageUrl] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([emptyIngredient()]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const resetForm = () => {
    setRecipeUrl('');
    setName('');
    setDescription('');
    setServings(2);
    setPrepTime(15);
    setCookTime(30);
    setImageUrl('');
    setIngredients([emptyIngredient()]);
    setInstructions(['']);
    setTags([]);
    setTagInput('');
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, emptyIngredient()]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: any) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: field === 'quantity' ? parseFloat(value) || 0 : value
    };
    setIngredients(newIngredients);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleScrapeRecipe = async () => {
    if (!recipeUrl || !recipeUrl.startsWith('http')) {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsScrapingUrl(true);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-recipe', {
        body: { url: recipeUrl, useAI }
      });

      if (error) throw new Error(error.message);
      if (!data || !data.data) throw new Error('No recipe data found');

      const recipeData = data.data;
      
      // Populate the form with the scraped data
      if (recipeData.name) setName(recipeData.name);
      if (recipeData.description) setDescription(recipeData.description);
      if (recipeData.servings) setServings(recipeData.servings);
      if (recipeData.prepTime) setPrepTime(recipeData.prepTime);
      if (recipeData.cookTime) setCookTime(recipeData.cookTime);
      if (recipeData.imageUrl) setImageUrl(recipeData.imageUrl);
      
      // Handle ingredients
      if (recipeData.ingredients && recipeData.ingredients.length > 0) {
        const formattedIngredients = recipeData.ingredients.map(ing => ({
          id: uuidv4(),
          name: ing.name,
          quantity: ing.quantity || 1,
          unit: ing.unit || '',
          category: 'other' as IngredientCategory
        }));
        setIngredients(formattedIngredients);
      }
      
      // Handle instructions
      if (recipeData.instructions && recipeData.instructions.length > 0) {
        setInstructions(recipeData.instructions);
      }

      toast.success(useAI 
        ? 'Recipe details imported successfully with AI assistance'
        : 'Recipe details imported successfully');
    } catch (error) {
      console.error('Error scraping recipe:', error);
      toast.error(error.message || 'Failed to import recipe');
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const handleSubmit = async () => {
    if (!name) {
      toast.error('Recipe name is required');
      return;
    }

    if (ingredients.some(i => !i.name)) {
      toast.error('All ingredients must have a name');
      return;
    }

    if (instructions.some(i => !i.trim())) {
      toast.error('All instructions must have content');
      return;
    }

    setIsSubmitting(true);

    try {
      const filteredInstructions = instructions.filter(i => i.trim());
      
      const newRecipe: Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
        name,
        description,
        servings,
        prep_time: prepTime,
        cook_time: cookTime,
        image_url: imageUrl,
        ingredients: ingredients,
        instructions: filteredInstructions,
        tags
      };

      const { data, error } = await createRecipe(newRecipe);
      
      if (error) throw error;
      
      toast.success('Recipe created successfully');
      resetForm();
      onOpenChange(false);
      
      if (onSuccess && data) {
        onSuccess(data);
      }
    } catch (error) {
      console.error('Error creating recipe:', error);
      toast.error('Failed to create recipe');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !isSubmitting) {
        resetForm();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Recipe</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* URL Import Section */}
          <div className="space-y-2 border p-4 rounded-md">
            <Label htmlFor="recipeUrl">Import from URL</Label>
            <div className="flex space-x-2">
              <Input
                id="recipeUrl"
                value={recipeUrl}
                onChange={(e) => setRecipeUrl(e.target.value)}
                placeholder="https://example.com/recipe"
                className="flex-grow"
              />
              <Button 
                onClick={handleScrapeRecipe} 
                disabled={isScrapingUrl || !recipeUrl}
                variant="secondary"
                className="whitespace-nowrap"
              >
                {isScrapingUrl ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Link className="mr-2 h-4 w-4" />
                    Import
                  </>
                )}
              </Button>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Switch 
                id="use-ai" 
                checked={useAI} 
                onCheckedChange={setUseAI} 
              />
              <Label htmlFor="use-ai" className="cursor-pointer flex items-center">
                <Sparkles className="h-4 w-4 mr-1 text-amber-500" />
                Use AI to enhance recipe extraction
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste a URL to a recipe page to attempt to extract recipe details automatically. 
              AI assistance can provide better results but may take slightly longer.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Recipe Name*</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter recipe name"
                required
              />
            </div>
            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the recipe"
              className="resize-none h-20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                type="number"
                min="1"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label htmlFor="prepTime">Prep Time (mins)</Label>
              <Input
                id="prepTime"
                type="number"
                min="0"
                value={prepTime}
                onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="cookTime">Cook Time (mins)</Label>
              <Input
                id="cookTime"
                type="number"
                min="0"
                value={cookTime}
                onChange={(e) => setCookTime(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Ingredients*</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleAddIngredient}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Ingredient
              </Button>
            </div>
            
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex flex-wrap gap-2 mb-3 items-start">
                <div className="flex-grow min-w-[200px]">
                  <Input
                    value={ingredient.name}
                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                    placeholder="Ingredient name"
                    className="w-full"
                  />
                </div>
                
                <div className="w-20">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={ingredient.quantity}
                    onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                    placeholder="Qty"
                    className="w-full"
                  />
                </div>
                
                <div className="w-20">
                  <Input
                    value={ingredient.unit}
                    onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                    placeholder="Unit"
                    className="w-full"
                  />
                </div>
                
                <div className="w-32">
                  <Select 
                    value={ingredient.category} 
                    onValueChange={(value) => handleIngredientChange(index, 'category', value as IngredientCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredientCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleRemoveIngredient(index)}
                  disabled={ingredients.length === 1}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Instructions*</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleAddInstruction}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Step
              </Button>
            </div>
            
            {instructions.map((instruction, index) => (
              <div key={index} className="flex gap-2 mb-3 items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium mt-2">
                  {index + 1}
                </div>
                <div className="flex-grow">
                  <Textarea
                    value={instruction}
                    onChange={(e) => handleInstructionChange(index, e.target.value)}
                    placeholder={`Step ${index + 1}`}
                    className="resize-none h-20"
                  />
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleRemoveInstruction(index)}
                  disabled={instructions.length === 1}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag (e.g., vegetarian, dessert)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button 
                type="button" 
                variant="outline"
                onClick={handleAddTag}
              >
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div 
                  key={tag} 
                  className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                >
                  {tag}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveTag(tag)} 
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Save Recipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditRecipeDialog;
