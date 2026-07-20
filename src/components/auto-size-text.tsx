'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

export function AutoSizeText({ children, className = '', align = 'left' }: { children: ReactNode, className?: string, align?: 'left' | 'right' | 'center' }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const adjustSize = () => {
      if (!containerRef.current || !textRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      // Reset scale to 1 temporarily to get the natural scrollWidth
      textRef.current.style.transform = 'scale(1)';
      
      const textWidth = textRef.current.scrollWidth;
      
      if (textWidth > containerWidth && containerWidth > 0) {
        // Calculate the scale needed to fit, slightly smaller to ensure no clipping
        const newScale = (containerWidth / textWidth) * 0.98;
        setScale(newScale);
      } else {
        setScale(1);
      }
    };

    adjustSize();

    // Use ResizeObserver for more robust resizing detection
    const observer = new ResizeObserver(() => {
      // Need a small timeout to let the layout settle
      requestAnimationFrame(adjustSize);
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [children]);

  const originClass = align === 'right' ? 'origin-right ml-auto' : align === 'center' ? 'origin-center mx-auto' : 'origin-left';

  return (
    <div ref={containerRef} className="w-full min-w-0 overflow-hidden flex items-center">
      <div 
        ref={textRef} 
        className={`whitespace-nowrap transition-transform duration-75 ${originClass} ${className}`}
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
