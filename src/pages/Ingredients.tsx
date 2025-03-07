import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Trash2, Edit, Check, X, Loader2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Ingredient, IngredientCategory } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import AnimatedContainer from '@/components/ui/AnimatedContainer';

const STANDALONE_RECIPE_ID = '00000000-0000-0000-0000-000000000000'; // Using a fixed UUID for standalone ingredients

const Ingredients = () => {
  const queryClient = useQueryClient();
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [newIngredient, setNewIngredient] = useState<Partial<Ingredient>>({
    name: '',
    quantity: 1,
    unit: '',
    category: 'other' as IngredientCategory,
  });
  const [selectedCategory, setSelectedCategory] = useState<IngredientCategory | 'all'>('all');

  // Fetch ingredients
  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Ingredient[];
    },
  });

  // Add ingredient mutation
  const addIngredientMutation = useMutation({
    mutationFn: async (ingredient: Omit<Ingredient, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('ingredients')
        .insert({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          category: ingredient.category,
          recipe_id: STANDALONE_RECIPE_ID // Add the required recipe_id field
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      setNewIngredient({
        name: '',
        quantity: 1,
        unit: '',
        category: 'other' as IngredientCategory,
      });
      toast.success('Ingredient added successfully');
    },
    onError: (error) => {
      console.error('Error adding ingredient:', error);
      toast.error('Failed to add ingredient');
    },
  });

  // Update ingredient mutation
  const updateIngredientMutation = useMutation({
    mutationFn: async (ingredient: Ingredient) => {
      const { data, error } = await supabase
        .from('ingredients')
        .update({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          category: ingredient.category,
        })
        .eq('id', ingredient.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      setEditingIngredient(null);
      toast.success('Ingredient updated successfully');
    },
    onError: (error) => {
      console.error('Error updating ingredient:', error);
      toast.error('Failed to update ingredient');
    },
  });

  // Delete ingredient mutation
  const deleteIngredientMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      toast.success('Ingredient deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting ingredient:', error);
      toast.error('Failed to delete ingredient');
    },
  });

  const handleAddIngredient = () => {
    if (!newIngredient.name) {
      toast.error('Ingredient name is required');
      return;
    }

    addIngredientMutation.mutate({
      name: newIngredient.name,
      quantity: newIngredient.quantity || 1,
      unit: newIngredient.unit || '',
      category: newIngredient.category || 'other',
      recipe_id: STANDALONE_RECIPE_ID, // Add the required recipe_id field for the mutation
    } as Ingredient);
  };

  const handleUpdateIngredient = () => {
    if (!editingIngredient || !editingIngredient.name) {
      toast.error('Ingredient name is required');
      return;
    }

    updateIngredientMutation.mutate(editingIngredient);
  };

  const handleDeleteIngredient = (id: string) => {
    if (window.confirm('Are you sure you want to delete this ingredient?')) {
      deleteIngredientMutation.mutate(id);
    }
  };

  const startEdit = (ingredient: Ingredient) => {
    setEditingIngredient({ ...ingredient });
  };

  const cancelEdit = () => {
    setEditingIngredient(null);
  };

  const ingredientCategories: IngredientCategory[] = [
    'produce', 'dairy', 'meat', 'seafood', 'bakery', 'frozen', 
    'canned', 'dry goods', 'spices', 'condiments', 'beverages', 'snacks', 'other'
  ];

  const filteredIngredients = selectedCategory === 'all' 
    ? ingredients 
    : ingredients.filter(ing => ing.category === selectedCategory);

  return (
    <AppLayout>
      <div className="container py-8">
        <AnimatedContainer animation="fade-up" className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Ingredients</h1>
          <p className="text-muted-foreground mb-8">
            Manage your ingredient database - add, edit, or remove ingredients as needed.
          </p>
        </AnimatedContainer>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AnimatedContainer animation="fade-up" delay="stagger-1" className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Add New Ingredient</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">Name*</label>
                    <Input
                      id="name"
                      value={newIngredient.name}
                      onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                      placeholder="Enter ingredient name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium mb-1">Quantity</label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newIngredient.quantity}
                        onChange={(e) => setNewIngredient({ ...newIngredient, quantity: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label htmlFor="unit" className="block text-sm font-medium mb-1">Unit</label>
                      <Input
                        id="unit"
                        value={newIngredient.unit}
                        onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                        placeholder="e.g., g, kg, ml"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
                    <Select
                      value={newIngredient.category}
                      onValueChange={(value) => setNewIngredient({ ...newIngredient, category: value as IngredientCategory })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
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
                    className="w-full" 
                    onClick={handleAddIngredient}
                    disabled={addIngredientMutation.isPending || !newIngredient.name}
                  >
                    {addIngredientMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Ingredient
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>

          <AnimatedContainer animation="fade-up" delay="stagger-2" className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Ingredient List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => setSelectedCategory(value as IngredientCategory | 'all')}
                  >
                    <SelectTrigger className="sm:hidden">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {ingredientCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Tabs defaultValue="all" className="space-y-4">
                  <TabsList className="hidden sm:flex sm:flex-wrap mb-2">
                    <TabsTrigger value="all" onClick={() => setSelectedCategory('all')}>All</TabsTrigger>
                    {ingredientCategories.map((category) => (
                      <TabsTrigger 
                        key={category} 
                        value={category}
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="all" className="space-y-4">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : filteredIngredients.length > 0 ? (
                      <div className="grid gap-2 sm:grid-cols-1 md:grid-cols-2">
                        {filteredIngredients.map((ingredient) => (
                          <div 
                            key={ingredient.id} 
                            className="flex items-center justify-between p-3 bg-card rounded-md border"
                          >
                            {editingIngredient?.id === ingredient.id ? (
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                                <Input
                                  className="flex-grow"
                                  value={editingIngredient.name}
                                  onChange={(e) => setEditingIngredient({ ...editingIngredient, name: e.target.value })}
                                />
                                <div className="flex flex-row gap-2">
                                  <Input
                                    className="w-20"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editingIngredient.quantity}
                                    onChange={(e) => setEditingIngredient({ ...editingIngredient, quantity: parseFloat(e.target.value) || 0 })}
                                  />
                                  <Input
                                    className="w-20"
                                    value={editingIngredient.unit}
                                    onChange={(e) => setEditingIngredient({ ...editingIngredient, unit: e.target.value })}
                                  />
                                  <Select
                                    value={editingIngredient.category}
                                    onValueChange={(value) => setEditingIngredient({ ...editingIngredient, category: value as IngredientCategory })}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
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
                                <div className="flex gap-1">
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    onClick={handleUpdateIngredient}
                                    disabled={updateIngredientMutation.isPending}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    onClick={cancelEdit}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <span className="font-medium truncate">{ingredient.name}</span>
                                  {ingredient.quantity > 0 && (
                                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                                      {ingredient.quantity} {ingredient.unit}
                                    </span>
                                  )}
                                  <span className="text-xs px-2 py-0.5 bg-muted rounded-full whitespace-nowrap">
                                    {ingredient.category}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 ml-2 shrink-0">
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    onClick={() => startEdit(ingredient)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteIngredient(ingredient.id)}
                                    disabled={deleteIngredientMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No ingredients found. Add some ingredients to get started!
                      </div>
                    )}
                  </TabsContent>

                  {/* Content for individual category tabs will be controlled by filteredIngredients */}
                  {ingredientCategories.map((category) => (
                    <TabsContent key={category} value={category}/>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </div>
      </div>
    </AppLayout>
  );
};

export default Ingredients;
