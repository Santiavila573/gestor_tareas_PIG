import React from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: React.ElementType;
}

export const GlitchText: React.FC<GlitchTextProps> = ({ text, className = '', as: Component = 'span' }) => {
  return (
    <Component 
      className={`glitch-text relative inline-block ${className}`} 
      data-text={text}
    >
      {text}
    </Component>
  );
};
