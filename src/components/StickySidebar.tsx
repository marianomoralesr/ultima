import React, { useEffect, useRef, useState } from 'react';

interface StickySidebarProps {
  children: React.ReactNode;
  topOffset?: number;
}

const StickySidebar: React.FC<StickySidebarProps> = ({ children, topOffset = 16 }) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [isBottom, setIsBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!sidebarRef.current) return;

      const sidebar = sidebarRef.current;
      const parentRect = sidebar.parentElement?.getBoundingClientRect();
      const footer = document.querySelector('footer');

      if (!parentRect) return;

      const shouldBeSticky = window.scrollY > parentRect.top + window.scrollY - topOffset;

      // Check if sidebar would overlap with footer
      if (footer && shouldBeSticky) {
        const footerRect = footer.getBoundingClientRect();
        const sidebarHeight = sidebar.offsetHeight;
        const sidebarBottom = topOffset + sidebarHeight;

        if (footerRect.top < sidebarBottom) {
          // Stop being sticky and position at the bottom
          setIsSticky(false);
          setIsBottom(true);
        } else {
          setIsSticky(true);
          setIsBottom(false);
        }
      } else if (shouldBeSticky) {
        setIsSticky(true);
        setIsBottom(false);
      } else {
        setIsSticky(false);
        setIsBottom(false);
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
        position: isBottom ? 'absolute' : (isSticky ? 'fixed' : 'relative'),
        top: isSticky ? `${topOffset}px` : 'auto',
        bottom: isBottom ? '0' : 'auto',
        width: isSticky || isBottom ? '384px' : 'auto',
        zIndex: 10,
      }}
    >
      {children}
    </div>
  );
};

export default StickySidebar;
