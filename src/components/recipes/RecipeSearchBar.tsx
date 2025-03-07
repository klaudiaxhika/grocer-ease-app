
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import AnimatedContainer from '@/components/ui/AnimatedContainer';

interface RecipeSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const RecipeSearchBar: React.FC<RecipeSearchBarProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <AnimatedContainer animation="fade-up" delay="stagger-1" className="mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search recipes by name or tag..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </AnimatedContainer>
  );
};

export default RecipeSearchBar;
