import React, { useEffect, useRef, useState } from 'react';

interface StickySidebarProps {
  children: React.ReactNode;
  topOffset?: number;
}

const StickySidebar: React.FC<StickySidebarProps> = ({ children, topOffset = 16 }) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!sidebarRef.current) return;

      const sidebar = sidebarRef.current;
      const rect = sidebar.getBoundingClientRect();
      const parentRect = sidebar.parentElement?.getBoundingClientRect();

      if (!parentRect) return;

      // Check if we should be sticky
      if (window.scrollY > parentRect.top + window.scrollY - topOffset) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [topOffset]);

  return (
    <div
      ref={sidebarRef}
      style={{
        position: isSticky ? 'fixed' : 'relative',
        top: isSticky ? `${topOffset}px` : 'auto',
        width: isSticky ? '384px' : 'auto',
        zIndex: 10,
      }}
    >
      {children}
    </div>
  );
};

export default StickySidebar;
