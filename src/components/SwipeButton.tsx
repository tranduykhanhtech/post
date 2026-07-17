import { useState, useRef, useEffect } from 'react';
import { ChevronRight, Loader2, Check } from 'lucide-react';

interface SwipeButtonProps {
  onSwipeSuccess: () => void;
  text: string;
  loading?: boolean;
}

export function SwipeButton({ onSwipeSuccess, text, loading = false }: SwipeButtonProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  
  const THUMB_WIDTH = 50;
  
  // Calculate max drag distance
  const maxDrag = containerRef.current 
    ? containerRef.current.clientWidth - THUMB_WIDTH - 8 // 8px padding (4px on each side)
    : 200;

  useEffect(() => {
    if (!loading && isSuccess) {
      // If we stop loading, and it was a success, reset after a short delay (optional)
      // For now, we just let it stay at success until unmounted or reset explicitly
    }
    if (!loading && !isSuccess) {
      setDragOffset(0);
    }
  }, [loading, isSuccess]);

  const handleStart = () => {
    if (loading || isSuccess) return;
    setIsDragging(true);
    // document event listeners are added in effect, but for React we can just use window events
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || loading || isSuccess) return;
      
      let clientX = 0;
      if (e instanceof MouseEvent) {
        clientX = e.clientX;
      } else {
        clientX = e.touches[0].clientX;
      }

      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        // Calculate offset from the start of the container (accounting for left padding)
        let newOffset = clientX - containerRect.left - (THUMB_WIDTH / 2);
        
        // Boundaries
        newOffset = Math.max(0, newOffset);
        newOffset = Math.min(newOffset, maxDrag);
        
        setDragOffset(newOffset);
      }
    };

    const handleEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);
      
      if (dragOffset >= maxDrag * 0.95) {
        // Trigger success
        setDragOffset(maxDrag);
        setIsSuccess(true);
        onSwipeSuccess();
      } else {
        // Reset
        setDragOffset(0);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset, maxDrag, loading, isSuccess, onSwipeSuccess]);

  // Calculate percentage for visual effects
  const progress = maxDrag > 0 ? (dragOffset / maxDrag) : 0;
  // Make the text fade out slightly as we drag, or change color
  const textOpacity = 1 - (progress * 0.5);

  return (
    <div 
      className={`swipe-container ${isSuccess ? 'success' : ''} ${loading ? 'loading' : ''}`}
      ref={containerRef}
    >
      <div 
        className="swipe-progress" 
        style={{ width: `${dragOffset + (THUMB_WIDTH / 2)}px` }}
      />
      <div 
        className="swipe-text"
        style={{ opacity: textOpacity }}
      >
        {loading ? 'Processing...' : text}
      </div>
      <div 
        className={`swipe-thumb ${isDragging ? 'dragging' : ''}`}
        ref={thumbRef}
        style={{ transform: `translateX(${dragOffset}px)` }}
        onMouseDown={() => handleStart()}
        onTouchStart={() => handleStart()}
      >
        {loading ? (
          <Loader2 className="animate-spin text-accent" size={20} />
        ) : isSuccess ? (
          <Check className="text-success" size={20} color="#fff" />
        ) : (
          <ChevronRight size={24} color="var(--bg-color)" style={{ marginLeft: '2px' }} />
        )}
      </div>
    </div>
  );
}
