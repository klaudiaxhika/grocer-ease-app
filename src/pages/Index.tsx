
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';
import { ShoppingCart, CalendarDays, BookOpen, CheckCircle, Utensils, Apple, CookingPot, Salad } from 'lucide-react';
import AnimatedContainer from '@/components/ui/AnimatedContainer';

const Index = () => {
  return (
    <AppLayout>
      <div className="flex flex-col py-8 md:py-12">
        <AnimatedContainer animation="fade-up" className="mb-8 md:mb-12 text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
            Welcome to GrocerEase
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Plan your meals, generate optimized grocery lists, and simplify your shopping experience.
          </p>
        </AnimatedContainer>

        <AnimatedContainer 
          animation="fade-up" 
          delay="stagger-1"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <FeatureCard 
            icon={<CalendarDays className="h-8 w-8 text-primary" />}
            title="Plan Your Meals"
            description="Create a weekly meal schedule with detailed recipes and portion control."
            link="/meal-planner"
          />
          
          <FeatureCard 
            icon={<ShoppingCart className="h-8 w-8 text-primary" />}
            title="Generate Grocery Lists"
            description="Automatically create optimized shopping lists based on your meal plan."
            link="/grocery-list"
          />
          
          <FeatureCard 
            icon={<BookOpen className="h-8 w-8 text-primary" />}
            title="Manage Recipes"
            description="Browse, save, and customize recipes from our collection or add your own."
            link="/recipes"
          />
        </AnimatedContainer>

        <AnimatedContainer animation="fade-up" delay="stagger-2" className="mb-12">
          <div className="bg-white rounded-lg overflow-hidden border border-amber-100 shadow-sm">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-foreground">How It Works</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StepCard 
                  icon={<CookingPot className="h-5 w-5 text-primary" />}
                  number={1}
                  title="Plan Your Meals"
                  description="Select recipes for each day of the week and specify servings."
                />
                
                <StepCard 
                  icon={<Apple className="h-5 w-5 text-primary" />}
                  number={2}
                  title="Review Ingredients"
                  description="The app calculates all required ingredients with exact quantities."
                />
                
                <StepCard 
                  icon={<ShoppingCart className="h-5 w-5 text-primary" />}
                  number={3}
                  title="Optimize Your List"
                  description="Adjust quantities and remove items you already have at home."
                />
                
                <StepCard 
                  icon={<Salad className="h-5 w-5 text-primary" />}
                  number={4}
                  title="Shop Efficiently"
                  description="Use your categorized list for an organized shopping experience."
                />
              </div>
            </div>
          </div>
        </AnimatedContainer>

        <AnimatedContainer animation="fade-up" delay="stagger-3" className="text-center">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/meal-planner">
              Start Planning Your Meals
            </Link>
          </Button>
        </AnimatedContainer>
      </div>
    </AppLayout>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, link }) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden border border-amber-100 h-full transition-all hover:shadow-md">
      <div className="p-6 flex flex-col h-full">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground mb-6 flex-grow">{description}</p>
        <Button asChild variant="outline" className="mt-auto border-amber-200 hover:bg-amber-50">
          <Link to={link}>Get Started</Link>
        </Button>
      </div>
    </div>
  );
};

interface StepCardProps {
  icon?: React.ReactNode;
  number: number;
  title: string;
  description: string;
}

const StepCard: React.FC<StepCardProps> = ({ icon, number, title, description }) => {
  return (
    <div className="flex flex-col items-center text-center p-4">
      <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
        {icon ? icon : <span className="text-primary font-semibold">{number}</span>}
      </div>
      <h3 className="font-medium mb-2 text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

export default Index;
