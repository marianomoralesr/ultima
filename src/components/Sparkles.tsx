import React from 'react';
import { useSpring, animated } from 'react-spring';

const random = (min: number, max: number) => Math.random() * (max - min) + min;

const Sparkle: React.FC<{ color: string; size: number; style: any }> = ({ color, size, style }) => {
  return (
    <animated.div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: '50%',
        ...style,
      }}
    />
  );
};

const Sparkles: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sparkles = Array.from({ length: 15 }).map(() => {
    const size = random(5, 10);
    const color = ['#FFC700', '#FF8C00', '#FFD700'][Math.floor(random(0, 3))];
    
    const spring = useSpring({
      from: {
        opacity: 0,
        transform: 'translate(0px, 0px) scale(0)',
      },
      to: async (next) => {
        while (1) {
          await next({
            opacity: 1,
            transform: `translate(${random(-100, 100)}px, ${random(-50, 50)}px) scale(1)`,
          });
          await next({
            opacity: 0,
            transform: `translate(${random(-100, 100)}px, ${random(-50, 50)}px) scale(0)`,
          });
        }
      },
      config: {
        duration: random(2000, 4000),
      },
    });

    return <Sparkle key={Math.random()} color={color} size={size} style={spring} />;
  });

  return (
    <div className="relative inline-block">
      {sparkles}
      {children}
    </div>
  );
};

export default Sparkles;
