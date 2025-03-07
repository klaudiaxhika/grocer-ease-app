
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Utensils, CalendarDays, ShoppingCart, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AnimatedContainer from '@/components/ui/AnimatedContainer';
import UserMenu from './UserMenu';

const Navbar: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { path: '/', label: 'Home', icon: <Utensils size={18} /> },
    { path: '/meal-planner', label: 'Meal Planner', icon: <CalendarDays size={18} /> },
    { path: '/grocery-list', label: 'Grocery List', icon: <ShoppingCart size={18} /> },
    { path: '/recipes', label: 'Recipes', icon: <BookOpen size={18} /> },
  ];

  return (
    <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-amber-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                GrocerEase
              </span>
            </Link>
          </div>
          
          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-primary bg-amber-50'
                    : 'text-gray-700 hover:text-primary hover:bg-amber-50'
                }`}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            
            <div className="ml-4">
              <UserMenu />
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <div className="mr-2">
              <UserMenu />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <AnimatedContainer
          animation="fade-in"
          className="md:hidden bg-white border-b pb-2"
        >
          <div className="flex flex-col space-y-1 px-4">
            {navItems.map((item, index) => (
              <AnimatedContainer 
                key={item.path} 
                animation="fade-up" 
                delay={index === 0 ? 'none' : index === 1 ? 'stagger-1' : index === 2 ? 'stagger-2' : 'stagger-3'}
              >
                <Link
                  to={item.path}
                  className={`flex items-center px-3 py-3 rounded-md text-sm font-medium ${
                    location.pathname === item.path
                      ? 'text-primary bg-amber-50'
                      : 'text-gray-700 hover:text-primary hover:bg-amber-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              </AnimatedContainer>
            ))}
          </div>
        </AnimatedContainer>
      )}
    </nav>
  );
};

export default Navbar;
