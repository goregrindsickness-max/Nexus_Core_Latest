import React, { useState, useEffect } from 'react';

export const AnimatedCount: React.FC<{ value: number; prefix?: string; suffix?: string; className?: string }> = ({ value, prefix = '', suffix = '', className = '' }) => {
  const [displayValue, setDisplayValue] = React.useState(value);
  
  React.useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;
    
    const duration = 600; // ms
    const startTime = performance.now();
    let animationFrame: number;
    
    const updateCount = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutQuart
      const easeProgress = progress * (2 - progress);
      const current = Math.round(start + (end - start) * easeProgress);
      
      setDisplayValue(current);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      }
    };
    
    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [value]);
  
  return (
    <span className={className}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
};

export const AnimatedText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  return (
    <span className={`inline-block animate-fade-in ${className}`}>
      {text}
    </span>
  );
};
