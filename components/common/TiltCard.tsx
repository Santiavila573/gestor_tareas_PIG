import React, { useRef, useState } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  perspective?: number;
  maxRotation?: number; // degrees
  scale?: number;
  glareEnable?: boolean;
  glareMaxOpacity?: number;
  glareColor?: string;
  glarePosition?: 'all' | 'top' | 'bottom';
}

export const TiltCard: React.FC<TiltCardProps> = ({ 
  children, 
  className = '', 
  onClick, 
  perspective = 1000, 
  maxRotation = 5,
  scale = 1.02,
  glareEnable = true,
  glareMaxOpacity = 0.4,
  glareColor = 'rgba(255, 255, 255, 0.4)',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [glareStyle, setGlareStyle] = useState({});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left) / width; // 0 to 1
    const y = (e.clientY - top) / height; // 0 to 1
    
    // Calculate rotation
    const rotateY = (x - 0.5) * 2 * maxRotation; 
    const rotateX = (0.5 - y) * 2 * maxRotation;

    setTransform(`perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`);
    
    if (glareEnable) {
      const glareX = x * 100;
      const glareY = y * 100;
      setGlareStyle({
        background: `radial-gradient(circle at ${glareX}% ${glareY}%, ${glareColor}, transparent)`,
        opacity: glareMaxOpacity * 0.8 // slight reduction for subtlety
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform(`perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`);
    if (glareEnable) {
      setGlareStyle({ opacity: 0 });
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{ 
        transform, 
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out'
      }}
      className={`relative preserve-3d will-change-transform ${className}`}
    >
      {children}
      
      {glareEnable && (
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 ease-out z-10 rounded-[inherit]"
          style={{
            ...glareStyle,
            mixBlendMode: 'overlay',
            opacity: isHovered ? (glareStyle as any).opacity : 0
          }}
        />
      )}
    </div>
  );
};
