
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getGroceryLists, getGroceryList } from '@/lib/supabase';
import AppLayout from '@/components/layout/AppLayout';
import GenerateGroceryListDialog from '@/components/grocery/GenerateGroceryListDialog';
import { useAuth } from '@/lib/auth-context';
import { GroceryList } from '@/lib/types';
import GroceryListDetails from '@/components/grocery/GroceryListDetails';
import GroceryListOverview from '@/components/grocery/GroceryListOverview';
import { LoadingState, ErrorState } from '@/components/grocery/GroceryListStates';

const GroceryListPage = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  
  const handleGenerateSuccess = (newList: GroceryList) => {
    navigate(`/grocery-list/${newList.id}`);
  };
  
  if ((isLoadingLists && !id) || (isLoadingList && id)) {
    return (
      <AppLayout>
        <LoadingState />
      </AppLayout>
    );
  }
  
  if (isError && id) {
    return (
      <AppLayout>
        <ErrorState />
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      {id && groceryList ? (
        <GroceryListDetails 
          groceryList={groceryList} 
          id={id} 
        />
      ) : (
        <GroceryListOverview 
          groceryLists={groceryLists || []} 
          onGenerateList={() => setIsGenerateOpen(true)} 
        />
      )}
      
      <GenerateGroceryListDialog
        open={isGenerateOpen}
        onOpenChange={setIsGenerateOpen}
        onSuccess={handleGenerateSuccess}
      />
    </AppLayout>
  );
};

export default GroceryListPage;
