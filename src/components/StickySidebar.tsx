import React, { useEffect, useRef, useState } from 'react';

interface StickySidebarProps {
  children: React.ReactNode;
  topOffset?: number;
}

const StickySidebar: React.FC<StickySidebarProps> = ({ children, topOffset = 16 }) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [isBottom, setIsBottom] = useState(false);
  const [stopPoint, setStopPoint] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sidebarRef.current) return;

      const sidebar = sidebarRef.current;
      const parent = sidebar.parentElement;
      if (!parent) return;

      const sidebarHeight = sidebar.offsetHeight;
      const parentRect = parent.getBoundingClientRect();
      const parentTop = parentRect.top + window.scrollY;
      const parentBottom = parentTop + parentRect.height;

      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;

      // Calculate when sidebar should start being sticky
      const stickyStartPoint = parentTop - topOffset;

      // Calculate when sidebar should stop being sticky (when bottom of sidebar reaches bottom of parent)
      const stickyStopPoint = parentBottom - sidebarHeight - topOffset;

      // Check if we've reached the bottom
      if (scrollY >= stickyStopPoint) {
        setIsSticky(false);
        setIsBottom(true);
        if (stopPoint === null) {
          setStopPoint(stickyStopPoint);
        }
      } else if (scrollY >= stickyStartPoint) {
        setIsSticky(true);
        setIsBottom(false);
      } else {
        setIsSticky(false);
        setIsBottom(false);
        setStopPoint(null);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [topOffset, stopPoint]);

  return (
    <div
      ref={sidebarRef}
      style={{
        position: isBottom ? 'absolute' : (isSticky ? 'fixed' : 'relative'),
        top: isSticky ? `${topOffset}px` : (isBottom ? 'auto' : 'auto'),
        bottom: isBottom ? '0' : 'auto',
        width: isSticky || isBottom ? '384px' : 'auto',
        maxHeight: isSticky ? `calc(100vh - ${topOffset}px - 16px)` : 'none',
        overflowY: isSticky ? 'auto' : 'visible',
        zIndex: 10,
      }}
    >
      {children}
    </div>
  );
};

export default StickySidebar;
