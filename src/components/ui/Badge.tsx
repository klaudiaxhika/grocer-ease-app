
import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  rounded?: 'default' | 'full';
  size?: 'sm' | 'default' | 'lg';
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  rounded = 'default',
  size = 'default',
  className,
  children,
  ...props
}) => {
  // Define variant classes
  const variantClasses = {
    default: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    outline: 'bg-transparent border border-muted-foreground/30 text-muted-foreground',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  // Define size classes
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    default: 'text-xs px-2 py-1',
    lg: 'text-sm px-2.5 py-1',
  };

  // Define rounded classes
  const roundedClasses = {
    default: 'rounded-md',
    full: 'rounded-full',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center font-medium',
        variantClasses[variant],
        sizeClasses[size],
        roundedClasses[rounded],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Badge;
