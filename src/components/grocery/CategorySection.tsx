
import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import GroceryItem from './GroceryItem';
import { GroceryItem as GroceryItemType, IngredientCategory } from '@/lib/types';
import AnimatedContainer from '@/components/ui/AnimatedContainer';

interface CategorySectionProps {
  category: IngredientCategory;
  categoryName: string;
  items: GroceryItemType[];
  onToggleChecked: (id: string, checked: boolean) => void;
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  categoryName,
  items,
  onToggleChecked,
  onRemoveItem,
  onUpdateQuantity
}) => {
  const [isOpen, setIsOpen] = React.useState(true);
  
  // Count how many items are checked
  const checkedCount = items.filter(item => item.checked).length;
  
  // Determine if all items are checked
  const allChecked = checkedCount === items.length;
  
  // Progress percentage
  const progressPercentage = items.length > 0 
    ? Math.round((checkedCount / items.length) * 100) 
    : 0;
  
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
          
          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${allChecked ? 'bg-secondary' : 'bg-primary'}`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2">
          {items.map((item) => (
            <GroceryItem
              key={item.id}
              item={item}
              onToggleChecked={onToggleChecked}
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
