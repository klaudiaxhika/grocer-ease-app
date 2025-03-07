
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, CheckSquare, Share2, Trash2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import CategorySection from '@/components/grocery/CategorySection';
import AnimatedContainer from '@/components/ui/AnimatedContainer';
import { GroceryItem, GroceryList as GroceryListType, IngredientCategory } from '@/lib/types';
import { sampleGroceryList, groceryCategories } from '@/lib/data';
import { groupItemsByCategory, exportGroceryList, filterGroceryItems } from '@/lib/groceryUtils';
import { toast } from 'sonner';

const GroceryList = () => {
  const [groceryList, setGroceryList] = useState<GroceryListType>(sampleGroceryList);
  const [searchTerm, setSearchTerm] = useState('');
  const [showChecked, setShowChecked] = useState(true);
  const [filteredItems, setFilteredItems] = useState<GroceryItem[]>(groceryList.items);

  useEffect(() => {
    // Filter items based on search term and checkbox status
    const newFilteredItems = filterGroceryItems(groceryList.items, {
      searchTerm: searchTerm,
      showChecked: showChecked
    });
    setFilteredItems(newFilteredItems);
  }, [groceryList.items, searchTerm, showChecked]);

  const handleToggleChecked = (id: string, checked: boolean) => {
    setGroceryList(prevList => ({
      ...prevList,
      items: prevList.items.map(item => 
        item.id === id ? { ...item, checked } : item
      )
    }));
  };

  const handleRemoveItem = (id: string) => {
    setGroceryList(prevList => ({
      ...prevList,
      items: prevList.items.filter(item => item.id !== id)
    }));
    toast.success('Item removed from list');
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setGroceryList(prevList => ({
      ...prevList,
      items: prevList.items.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    }));
  };

  const handleExportList = () => {
    const text = exportGroceryList(groceryList, 'text');
    
    // Create a blob and download it
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grocery-list.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Grocery list exported successfully');
  };

  const handleClearCheckedItems = () => {
    setGroceryList(prevList => ({
      ...prevList,
      items: prevList.items.filter(item => !item.checked)
    }));
    toast.success('Checked items cleared');
  };

  const handleShareList = () => {
    // In a real app, this would open a sharing dialog or copy a link
    toast.success('Sharing functionality coming soon!');
  };

  // Group grocery items by category
  const groupedItems = groupItemsByCategory(filteredItems);

  return (
    <AppLayout>
      <div className="mb-8">
        <AnimatedContainer animation="fade-up" className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Grocery List</h1>
            <p className="text-muted-foreground">Your organized shopping list based on your meal plan.</p>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearCheckedItems}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Clear Checked
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportList}
            >
              <Download className="mr-1 h-4 w-4" />
              Export
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleShareList}
            >
              <Share2 className="mr-1 h-4 w-4" />
              Share
            </Button>
          </div>
        </AnimatedContainer>

        <AnimatedContainer animation="fade-up" delay="stagger-1" className="mb-6">
          <div className="bg-white border rounded-lg p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showChecked}
                    onChange={() => setShowChecked(!showChecked)}
                    className="sr-only"
                  />
                  <div className={`h-5 w-5 rounded border mr-2 flex items-center justify-center ${showChecked ? 'bg-primary border-primary' : 'bg-white'}`}>
                    {showChecked && <CheckSquare className="h-4 w-4 text-white" />}
                  </div>
                  <span className="text-sm">Show checked items</span>
                </label>
              </div>
            </div>
          </div>
        </AnimatedContainer>

        <AnimatedContainer animation="fade-up" delay="stagger-2">
          <div className="space-y-4">
            {Object.entries(groceryCategories).map(([category, categoryName]) => {
              const categoryItems = groupedItems[category as IngredientCategory] || [];
              
              if (categoryItems.length === 0) return null;
              
              return (
                <CategorySection
                  key={category}
                  category={category as IngredientCategory}
                  categoryName={categoryName}
                  items={categoryItems}
                  onToggleChecked={handleToggleChecked}
                  onRemoveItem={handleRemoveItem}
                  onUpdateQuantity={handleUpdateQuantity}
                />
              );
            })}
            
            {Object.keys(groupedItems).length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No items found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? 'Try a different search term'
                    : 'Your grocery list is empty'}
                </p>
                <Button variant="outline" asChild>
                  <a href="/meal-planner">Plan Your Meals</a>
                </Button>
              </div>
            )}
          </div>
        </AnimatedContainer>
      </div>
    </AppLayout>
  );
};

export default GroceryList;
