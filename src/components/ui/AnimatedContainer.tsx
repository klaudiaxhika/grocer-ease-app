
import React from 'react';
import { cn } from '@/lib/utils';

type AnimationType = 'fade-in' | 'fade-up' | 'scale-in' | 'slide-in';

interface AnimatedContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  animation?: AnimationType;
  delay?: 'stagger-1' | 'stagger-2' | 'stagger-3' | 'none';
  duration?: 'fast' | 'normal' | 'slow';
  children: React.ReactNode;
}

const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  animation = 'fade-up',
  delay = 'none',
  duration = 'normal',
  className,
  children,
  ...props
}) => {
  // Define duration classes
  const durationClass = {
    fast: 'duration-200',
    normal: 'duration-300',
    slow: 'duration-500'
  }[duration];
  
  return (
    <div
      className={cn(
        `animate-${animation}`,
        delay !== 'none' && delay,
        durationClass,
        'animate-once',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default AnimatedContainer;
