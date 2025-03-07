
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  updateGroceryListItem, 
  deleteGroceryList,
  deleteGroceryListItem,
  updateGroceryListItemQuantity 
} from '@/lib/supabase';
import { GroceryList, GroceryItem, IngredientCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AnimatedContainer from '@/components/ui/AnimatedContainer';
import { 
  ArrowLeft,
  Calendar,
  Trash2,
  CheckCheck,
  ShoppingCart
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import CategorySection from '@/components/grocery/CategorySection';
import { toast } from 'sonner';
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

interface GroceryListDetailsProps {
  groceryList: GroceryList;
  id: string;
}

const GroceryListDetails: React.FC<GroceryListDetailsProps> = ({ groceryList, id }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const updateItemMutation = useMutation({
    mutationFn: (item: GroceryItem) => updateGroceryListItem(id, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryList', id] });
    },
    onError: (error) => {
      console.error('Error updating grocery item:', error);
      toast.error('Failed to update item');
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => deleteGroceryListItem(id, itemId),
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
      updateGroceryListItemQuantity(id, itemId, quantity),
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

  const handleCheckAllInCategory = (category: string, checked: boolean) => {
    if (!groceryList) return;

    const itemsInCategory = groceryList.items.filter(item => item.category === category);
    
    // Update all items in this category
    itemsInCategory.forEach(item => {
      if (item.checked !== checked) {
        const updatedItem = { ...item, checked };
        updateItemMutation.mutate(updatedItem);
      }
    });

    toast.success(`${checked ? 'Checked' : 'Unchecked'} all items in ${category}`);
  };

  const handleCheckAllItems = () => {
    if (!groceryList) return;

    // Count total and checked items
    const totalItems = groceryList.items.length;
    const checkedItems = groceryList.items.filter(item => item.checked).length;
    
    // Determine if we should check or uncheck all
    const shouldCheck = checkedItems < totalItems;
    
    // Update all items
    groceryList.items.forEach(item => {
      if (item.checked !== shouldCheck) {
        const updatedItem = { ...item, checked: shouldCheck };
        updateItemMutation.mutate(updatedItem);
      }
    });

    toast.success(`${shouldCheck ? 'Checked' : 'Unchecked'} all items`);
  };
  
  const startDate = parseISO(groceryList.start_date);
  const endDate = parseISO(groceryList.end_date);
  
  // Calculate total checked items
  const totalItems = groceryList.items.length;
  const checkedItems = groceryList.items.filter(item => item.checked).length;
  const allItemsChecked = totalItems > 0 && checkedItems === totalItems;
  
  const groupedItems = groceryList?.items?.reduce((acc, item) => {
    const category = item.category as IngredientCategory;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<IngredientCategory, GroceryItem[]>) || {} as Record<IngredientCategory, GroceryItem[]>;
  
  return (
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
        
        <div className="flex space-x-2">
          <Button 
            variant={allItemsChecked ? "outline" : "default"} 
            size="sm"
            onClick={handleCheckAllItems}
            className="flex items-center"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            {allItemsChecked ? "Uncheck All" : "Check All"}
          </Button>
          
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
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Shopping List</span>
            <span className="text-sm font-normal text-muted-foreground">
              {checkedItems} of {totalItems} items checked
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
                  onCheckAllInCategory={handleCheckAllInCategory}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
};

export default GroceryListDetails;
