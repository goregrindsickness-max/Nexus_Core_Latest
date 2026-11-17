import React, { useRef, useState, useEffect } from 'react';

interface MarqueeTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function MarqueeText({ text, className = "", style }: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [overflowOffset, setOverflowOffset] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const textWidth = textRef.current.getBoundingClientRect().width;
        const containerWidth = containerRef.current.getBoundingClientRect().width;
        const hasOverflow = textWidth > containerWidth;
        setShouldScroll(hasOverflow);
        if (hasOverflow) {
          // Extra breathing room padding (16px) added to the offset
          setOverflowOffset(textWidth - containerWidth + 16);
        } else {
          setOverflowOffset(0);
        }
      }
    };

    // Run measurement immediately and after a short paint delay
    checkOverflow();
    const timer = setTimeout(checkOverflow, 150);

    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [text]);

  const styleObj = shouldScroll ? {
    '--marquee-scroll': `px`,
    animation: 'custom-marquee 8s ease-in-out 2s infinite'
  } as React.CSSProperties : {};

  return (
    <div 
      ref={containerRef} 
      className="w-full overflow-hidden whitespace-nowrap relative select-none"
      style={style}
    >
      <span 
        ref={textRef}
        style={styleObj}
        className={`inline-block transition-transform duration-300 ${shouldScroll ? 'animate-marquee' : ''} ${className}`}
      >
        {text}
      </span>
    </div>
  );
}
