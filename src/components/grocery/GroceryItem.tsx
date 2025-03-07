
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Info, Minus, Plus, X } from 'lucide-react';
import { formatQuantity } from '@/lib/groceryUtils';
import { GroceryItem as GroceryItemType } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GroceryItemProps {
  item: GroceryItemType;
  onToggleChecked: (id: string, checked: boolean) => void;
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
}

const GroceryItem: React.FC<GroceryItemProps> = ({
  item,
  onToggleChecked,
  onRemoveItem,
  onUpdateQuantity
}) => {
  const handleQuantityChange = (increment: boolean) => {
    const step = item.quantity < 1 ? 0.25 : 1;
    const newQuantity = increment 
      ? item.quantity + step 
      : Math.max(item.quantity - step, 0);
    
    onUpdateQuantity(item.id, newQuantity);
  };

  return (
    <div 
      className={`flex items-center p-3 rounded-lg bg-white border mb-2 transition-all ${
        item.checked ? 'bg-muted/30' : ''
      }`}
    >
      <Checkbox 
        checked={item.checked}
        onCheckedChange={(checked) => {
          if (typeof checked === 'boolean') {
            onToggleChecked(item.id, checked);
          }
        }}
        className="mr-3"
      />
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
          {item.name}
        </p>
        <div className="text-xs text-muted-foreground truncate">
          From: {item.recipe_sources.slice(0, 2).join(', ')}
          {item.recipe_sources.length > 2 && ` +${item.recipe_sources.length - 2} more`}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="flex items-center border rounded">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-none"
            onClick={() => handleQuantityChange(false)}
            disabled={item.quantity <= 0.25}
          >
            <Minus size={14} />
          </Button>
          
          <div className="px-2 text-sm min-w-[50px] text-center">
            {formatQuantity(item.quantity)} {item.unit}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-none"
            onClick={() => handleQuantityChange(true)}
          >
            <Plus size={14} />
          </Button>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => onRemoveItem(item.id)}
              >
                <X size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remove from list</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default GroceryItem;
