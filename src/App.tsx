
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Recipes from "./pages/Recipes";
import MealPlanner from "./pages/MealPlanner";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import GroceryList from "./pages/GroceryList";
import Ingredients from "./pages/Ingredients";
import { AuthProvider } from "./lib/auth-context";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/ingredients" element={<Ingredients />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/meal-planner" 
              element={
                <ProtectedRoute>
                  <MealPlanner />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/grocery-list" 
              element={
                <ProtectedRoute>
                  <GroceryList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/grocery-list/:id" 
              element={
                <ProtectedRoute>
                  <GroceryList />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
