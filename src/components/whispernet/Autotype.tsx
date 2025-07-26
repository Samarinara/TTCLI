"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AutotypeProps {
  text: string;
  typingSpeed?: number;
  className?: string;
  onFinished?: () => void;
}

export function Autotype({ text, typingSpeed = 20, className, onFinished }: AutotypeProps) {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    setDisplayedText('');
    if (!text) {
        if(onFinished) onFinished();
        return;
    };
    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i > text.length - 1) {
        clearInterval(intervalId);
        if (onFinished) {
          onFinished();
        }
      }
    }, typingSpeed);

    return () => clearInterval(intervalId);
  }, [text, typingSpeed, onFinished]);

  return (
    <span className={cn(className)}>
      {displayedText}
    </span>
  );
}
