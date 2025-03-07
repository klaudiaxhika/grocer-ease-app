
import React from 'react';
import { ChevronDown, ChevronRight, Check, CheckCheck } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import GroceryItem from './GroceryItem';
import { GroceryItem as GroceryItemType, IngredientCategory } from '@/lib/types';
import AnimatedContainer from '@/components/ui/AnimatedContainer';
import { Button } from '@/components/ui/button';

interface CategorySectionProps {
  category: string;
  items: GroceryItemType[];
  onToggleItem: (item: GroceryItemType) => void;
  onRemoveItem?: (id: string) => void;
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onCheckAllInCategory?: (category: string, checked: boolean) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  items,
  onToggleItem,
  onRemoveItem = () => {},
  onUpdateQuantity = () => {},
  onCheckAllInCategory = () => {}
}) => {
  const [isOpen, setIsOpen] = React.useState(true);
  
  // Count how many items are checked
  const checkedCount = items.filter(item => item.checked).length;
  
  // Determine if all items are checked
  const allChecked = checkedCount === items.length && items.length > 0;
  
  // Progress percentage
  const progressPercentage = items.length > 0 
    ? Math.round((checkedCount / items.length) * 100) 
    : 0;
    
  // Format category name
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
  
  const handleCheckAll = () => {
    onCheckAllInCategory(category, !allChecked);
  };
  
  return (
    <AnimatedContainer animation="fade-up" className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-between p-3 bg-white rounded-lg border">
          <div className="flex items-center">
            {isOpen ? <ChevronDown size={18} className="mr-2" /> : <ChevronRight size={18} className="mr-2" />}
            <span className="font-medium">{categoryName}</span>
            <span className="ml-2 text-sm text-muted-foreground">
              ({checkedCount}/{items.length})
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${allChecked ? 'bg-secondary' : 'bg-primary'}`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2"
              onClick={(e) => {
                e.stopPropagation();
                handleCheckAll();
              }} 
              title={allChecked ? "Uncheck all items" : "Check all items"}
            >
              {allChecked ? <Check className="h-4 w-4" /> : <CheckCheck className="h-4 w-4" />}
            </Button>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2">
          {items.map((item) => (
            <GroceryItem
              key={item.id}
              item={item}
              onToggleChecked={(id, checked) => {
                const updatedItem = {...item, checked};
                onToggleItem(updatedItem);
              }}
              onRemoveItem={onRemoveItem}
              onUpdateQuantity={onUpdateQuantity}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </AnimatedContainer>
  );
};

export default CategorySection;
