
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading grocery list...' 
}) => {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-lg">{message}</span>
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  title = 'Error Loading Grocery List',
  message = 'The grocery list could not be found or you don\'t have access to it.'
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <h2 className="text-xl font-semibold text-destructive mb-2">{title}</h2>
      <p className="text-muted-foreground mb-4">{message}</p>
      <Button onClick={() => navigate('/grocery-list')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Grocery Lists
      </Button>
    </div>
  );
};
