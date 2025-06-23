import React, { useEffect, useState } from 'react';

const emberColors = ['bg-ember', 'bg-carmine', 'bg-deepblue', 'bg-softwhite'];

interface Ember {
  id: number;
  x: number;
  y: number;
  angle: number;
  color: string;
  delay: number;
}

export const PixelEmbers: React.FC = () => {
  const [embers, setEmbers] = useState<Ember[]>([]);

  useEffect(() => {
    const generateEmbers = () => {
      const newEmbers: Ember[] = Array.from({ length: 12 }, (_, i) => {
        const angle = Math.random() * 2 * Math.PI;
        const distance = 40; // spawn from just outside the button
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        return {
          id: Date.now() + i,
          x,
          y,
          angle,
          color: emberColors[Math.floor(Math.random() * emberColors.length)],
          delay: Math.random() * 0.5,
        };
      });

      setEmbers(newEmbers);
    };

    generateEmbers();
    const interval = setInterval(generateEmbers, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {embers.map((ember) => (
        <span
          key={ember.id}
          className={`absolute w-[2px] h-[2px] ${ember.color} opacity-70 rounded-sm animate-flyEmber`}
          style={{
            left: `calc(50% + ${ember.x}px)`,
            top: `calc(50% + ${ember.y}px)`,
            animationDelay: `${ember.delay}s`,
            transform: `rotate(${ember.angle}rad)`,
          }}
        />
      ))}
    </>
  );
};
