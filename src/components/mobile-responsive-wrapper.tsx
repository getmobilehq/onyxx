import { ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface MobileResponsiveWrapperProps {
  children: ReactNode;
  className?: string;
}

export function MobileResponsiveWrapper({ children, className }: MobileResponsiveWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  // Add viewport meta tag for proper mobile scaling
  useEffect(() => {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
  }, []);

  return (
    <div
      className={cn(
        'mobile-responsive-wrapper',
        {
          'is-mobile': isMobile,
          'is-tablet': isTablet,
          'is-desktop': !isMobile && !isTablet,
          'orientation-portrait': orientation === 'portrait',
          'orientation-landscape': orientation === 'landscape',
        },
        className
      )}
      data-device={isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}
      data-orientation={orientation}
    >
      {children}
    </div>
  );
}

// Mobile-only component visibility helper
export function MobileOnly({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('block md:hidden', className)}>{children}</div>;
}

// Desktop-only component visibility helper
export function DesktopOnly({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('hidden md:block', className)}>{children}</div>;
}

// Responsive grid component
export function ResponsiveGrid({ 
  children, 
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 }
}: { 
  children: ReactNode; 
  className?: string;
  cols?: { mobile?: number; tablet?: number; desktop?: number };
}) {
  return (
    <div
      className={cn(
        'grid gap-4',
        `grid-cols-${cols.mobile || 1}`,
        `md:grid-cols-${cols.tablet || 2}`,
        `lg:grid-cols-${cols.desktop || 3}`,
        className
      )}
    >
      {children}
    </div>
  );
}

// Touch-friendly button wrapper
export function TouchButton({ 
  children, 
  className,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'min-h-[44px] min-w-[44px] touch-manipulation',
        'active:scale-95 transition-transform',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Swipeable container for mobile gestures
export function SwipeableContainer({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
}: {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  return (
    <div
      className={cn('touch-pan-x', className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </div>
  );
}