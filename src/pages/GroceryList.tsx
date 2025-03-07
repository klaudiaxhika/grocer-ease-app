import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  getGroceryLists, 
  getGroceryList, 
  updateGroceryListItem, 
  deleteGroceryList,
  deleteGroceryListItem,
  updateGroceryListItemQuantity 
} from '@/lib/supabase';
import { GroceryList, GroceryItem, IngredientCategory } from '@/lib/types';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AnimatedContainer from '@/components/ui/AnimatedContainer';
import { 
  FileText, 
  List, 
  Plus, 
  ShoppingCart, 
  Loader2, 
  ArrowLeft,
  Calendar,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import CategorySection from '@/components/grocery/CategorySection';
import GenerateGroceryListDialog from '@/components/grocery/GenerateGroceryListDialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/lib/auth-context';

const GroceryListPage = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  
  const { data: groceryLists, isLoading: isLoadingLists } = useQuery({
    queryKey: ['groceryLists'],
    queryFn: getGroceryLists,
    select: (data) => data.data || [],
    enabled: !id && !!user,
  });
  
  const { data: groceryList, isLoading: isLoadingList, isError } = useQuery({
    queryKey: ['groceryList', id],
    queryFn: () => getGroceryList(id!),
    select: (data) => data.data,
    enabled: !!id && !!user,
  });
  
  const updateItemMutation = useMutation({
    mutationFn: (item: GroceryItem) => updateGroceryListItem(id!, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryList', id] });
    },
    onError: (error) => {
      console.error('Error updating grocery item:', error);
      toast.error('Failed to update item');
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => deleteGroceryListItem(id!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryList', id] });
      toast.success('Item removed');
    },
    onError: (error) => {
      console.error('Error deleting grocery item:', error);
      toast.error('Failed to remove item');
    }
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => 
      updateGroceryListItemQuantity(id!, itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryList', id] });
    },
    onError: (error) => {
      console.error('Error updating item quantity:', error);
      toast.error('Failed to update quantity');
    }
  });
  
  const deleteListMutation = useMutation({
    mutationFn: deleteGroceryList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryLists'] });
      toast.success('Grocery list deleted');
      navigate('/grocery-list');
    },
    onError: (error) => {
      console.error('Error deleting grocery list:', error);
      toast.error('Failed to delete grocery list');
    }
  });
  
  const handleDeleteList = () => {
    if (id) {
      deleteListMutation.mutate(id);
    }
  };
  
  const handleToggleItem = (item: GroceryItem) => {
    updateItemMutation.mutate(item);
  };

  const handleRemoveItem = (itemId: string) => {
    deleteItemMutation.mutate(itemId);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    updateQuantityMutation.mutate({ itemId, quantity });
  };
  
  const handleGenerateSuccess = (newList: GroceryList) => {
    queryClient.invalidateQueries({ queryKey: ['groceryLists'] });
    navigate(`/grocery-list/${newList.id}`);
  };
  
  const groupedItems = groceryList?.items?.reduce((acc, item) => {
    const category = item.category as IngredientCategory;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<IngredientCategory, GroceryItem[]>) || {} as Record<IngredientCategory, GroceryItem[]>;
  
  if ((isLoadingLists && !id) || (isLoadingList && id)) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading grocery list...</span>
        </div>
      </AppLayout>
    );
  }
  
  if (isError && id) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Grocery List</h2>
          <p className="text-muted-foreground mb-4">The grocery list could not be found or you don't have access to it.</p>
          <Button onClick={() => navigate('/grocery-list')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Grocery Lists
          </Button>
        </div>
      </AppLayout>
    );
  }
  
  if (id && groceryList) {
    const startDate = parseISO(groceryList.start_date);
    const endDate = parseISO(groceryList.end_date);
    
    return (
      <AppLayout>
        <AnimatedContainer animation="fade-up" className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="mr-2" 
                  onClick={() => navigate('/grocery-list')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold">{groceryList.name}</h1>
              </div>
              <div className="flex items-center mt-2 text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
                </span>
              </div>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete List
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this grocery list and all its items.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteList}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Shopping List</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {groceryList.items.filter(item => item.checked).length} of {groceryList.items.length} items checked
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(groupedItems).length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No items in this grocery list</h3>
                  <p className="text-muted-foreground mb-4">
                    This list is empty. Try generating a new list with meal plans.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedItems).map(([category, items]) => (
                    <CategorySection 
                      key={category}
                      category={category}
                      items={items}
                      onToggleItem={handleToggleItem}
                      onRemoveItem={handleRemoveItem}
                      onUpdateQuantity={handleUpdateQuantity}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedContainer>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <AnimatedContainer animation="fade-up" className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Grocery Lists</h1>
          <Button onClick={() => setIsGenerateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Generate List
          </Button>
        </div>
        
        {groceryLists && groceryLists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groceryLists.map((list) => {
              const startDate = parseISO(list.start_date);
              const endDate = parseISO(list.end_date);
              const checkedItems = list.items.filter(item => item.checked).length;
              const totalItems = list.items.length;
              
              return (
                <Card 
                  key={list.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/grocery-list/${list.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(parseISO(list.created_at || ''), "MMM d, yyyy")}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-medium mt-2 mb-1">{list.name}</h3>
                    
                    <div className="flex items-center text-sm text-muted-foreground mb-3">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <ShoppingCart className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {checkedItems} of {totalItems} items
                        </span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <List className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-muted/50">
            <CardContent className="p-10 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Grocery Lists Yet</h3>
              <p className="text-muted-foreground mb-6">
                Generate a grocery list based on your meal plans for the week.
              </p>
              <Button onClick={() => setIsGenerateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Generate Your First List
              </Button>
            </CardContent>
          </Card>
        )}
      </AnimatedContainer>
      
      <GenerateGroceryListDialog
        open={isGenerateOpen}
        onOpenChange={setIsGenerateOpen}
        onSuccess={handleGenerateSuccess}
      />
    </AppLayout>
  );
};

export default GroceryListPage;
