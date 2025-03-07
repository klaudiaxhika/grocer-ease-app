
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GroceryList } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AnimatedContainer from '@/components/ui/AnimatedContainer';
import { 
  FileText, 
  ShoppingCart, 
  List, 
  Calendar,
  Plus
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface GroceryListOverviewProps {
  groceryLists: GroceryList[];
  onGenerateList: () => void;
}

const GroceryListOverview: React.FC<GroceryListOverviewProps> = ({ 
  groceryLists, 
  onGenerateList 
}) => {
  const navigate = useNavigate();

  return (
    <AnimatedContainer animation="fade-up" className="mb-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Grocery Lists</h1>
        <Button onClick={onGenerateList}>
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
            <Button onClick={onGenerateList}>
              <Plus className="mr-2 h-4 w-4" /> Generate Your First List
            </Button>
          </CardContent>
        </Card>
      )}
    </AnimatedContainer>
  );
};

export default GroceryListOverview;
