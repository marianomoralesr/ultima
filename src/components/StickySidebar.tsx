import React from 'react';

interface StickySidebarProps {
  children: React.ReactNode;
  topOffset?: number;
}

const StickySidebar: React.FC<StickySidebarProps> = ({ children, topOffset = 16 }) => {
  return (
    <div
      style={{
        position: 'sticky',
        top: `${topOffset}px`,
        alignSelf: 'flex-start',
        maxHeight: `calc(100vh - ${topOffset}px - 16px)`,
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 10,
      }}
    >
      {children}
    </div>
  );
};

export default StickySidebar;
