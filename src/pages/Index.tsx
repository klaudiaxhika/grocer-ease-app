import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';
import { ShoppingCart, CalendarDays, BookOpen, CheckCircle, Utensils } from 'lucide-react';
import AnimatedContainer from '@/components/ui/AnimatedContainer';

const Index = () => {
  return (
    <AppLayout>
      <div className="flex flex-col pt-8 md:pt-12 pb-16">
        <AnimatedContainer animation="fade-up" className="mb-8 md:mb-24 text-left max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground">
            Plan your meals with <span className="text-primary">GrocerEase</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mb-8">
            Create grocery lists, plan your meals, and simplify your shopping experience.
          </p>
        </AnimatedContainer>

        <AnimatedContainer 
          animation="fade-up" 
          delay="stagger-1"
          className="bg-white/90 backdrop-blur-md rounded-lg p-6 border border-gray-200 shadow-lg mb-8"
        >
          <h2 className="text-2xl font-bold mb-6 text-foreground">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<CalendarDays className="h-8 w-8 text-primary" />}
              title="Meal Planning"
              description="Create weekly meal schedules with detailed recipes and portion control."
              link="/meal-planner"
            />
            
            <FeatureCard 
              icon={<ShoppingCart className="h-8 w-8 text-primary" />}
              title="Smart Grocery Lists"
              description="Generate optimized shopping lists based on your meal plans."
              link="/grocery-list"
            />
            
            <FeatureCard 
              icon={<BookOpen className="h-8 w-8 text-primary" />}
              title="Recipe Collection"
              description="Browse, save, and customize recipes from our collection or add your own."
              link="/recipes"
            />
          </div>
        </AnimatedContainer>

        <AnimatedContainer animation="fade-up" delay="stagger-2" className="mb-12">
          <div className="bg-white/90 backdrop-blur-md rounded-lg overflow-hidden border border-gray-200 shadow-lg">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-foreground">How It Works</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StepCard 
                  number={1}
                  title="Choose Recipes"
                  description="Select recipes for each day of the week."
                />
                
                <StepCard 
                  number={2}
                  title="Set Portions"
                  description="Specify servings for accurate ingredient calculations."
                />
                
                <StepCard 
                  number={3}
                  title="Generate List"
                  description="Create a smart shopping list with exact quantities."
                />
                
                <StepCard 
                  number={4}
                  title="Shop Efficiently"
                  description="Enjoy organized, stress-free grocery shopping."
                />
              </div>
            </div>
          </div>
        </AnimatedContainer>

        <AnimatedContainer animation="fade-up" delay="stagger-3" className="text-center">
          <Button asChild size="lg" className="rounded-md px-8 py-6 text-lg font-semibold shadow-lg">
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
    <div className="bg-white rounded-lg overflow-hidden border border-gray-200 h-full transition-all hover:shadow-md">
      <div className="p-6 flex flex-col h-full">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground mb-6 flex-grow">{description}</p>
        <Button asChild variant="outline" className="mt-auto border-gray-200 hover:bg-gray-50 hover:text-primary">
          <Link to={link}>Get Started</Link>
        </Button>
      </div>
    </div>
  );
};

interface StepCardProps {
  number: number;
  title: string;
  description: string;
}

const StepCard: React.FC<StepCardProps> = ({ number, title, description }) => {
  return (
    <div className="flex flex-col p-4 bg-white/50 rounded-lg border border-gray-100">
      <div className="rounded-full bg-primary/10 w-10 h-10 flex items-center justify-center mb-4">
        <span className="text-primary font-semibold">{number}</span>
      </div>
      <h3 className="font-medium mb-2 text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

export default Index;
