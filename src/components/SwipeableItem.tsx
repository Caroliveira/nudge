'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, MotionValue, animate } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { SWIPE_CONFIG } from '../constants';

interface SwipeableItemProps {
  children: React.ReactNode;
  onSwipeRight?: () => void;
  renderLeftBackground?: (x: MotionValue<number>, isConfirmed: boolean) => React.ReactNode;
  onSwipeLeft?: () => void;
  renderRightBackground?: (x: MotionValue<number>, isConfirmed: boolean) => React.ReactNode;
  className?: string;
}

const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  onSwipeRight,
  renderLeftBackground,
  onSwipeLeft,
  renderRightBackground,
  className = '',
}) => {
  const { t } = useTranslation();
  const x = useMotionValue(0);
  const isDragging = useRef(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isLeftConfirmed, setIsLeftConfirmed] = useState(false);
  const [isRightConfirmed, setIsRightConfirmed] = useState(false);

  const rightOpacity = useTransform(x, (val) => (val < -5 ? 1 : 0));
  const leftOpacity = useTransform(x, (val) => (val > 5 ? 1 : 0));

  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    };
  }, []);

  const handleDragStart = () => {
    isDragging.current = true;
  };

  const handleDragEnd = async (_: unknown, info: PanInfo) => {
    // Small timeout to prevent click immediately after drag release
    dragTimeoutRef.current = setTimeout(() => {
      isDragging.current = false;
    }, SWIPE_CONFIG.DRAG_END_TIMEOUT_MS);

    const currentX = info.offset.x;
    const threshold = SWIPE_CONFIG.THRESHOLD_PX;

    if (currentX < -threshold && onSwipeLeft) {
      setIsLeftConfirmed(true);
      await animate(x, -window.innerWidth, {
        type: 'spring',
        stiffness: 500,
        damping: 50,
        mass: 1,
      });
      onSwipeLeft();
    } else if (currentX > threshold && onSwipeRight) {
      setIsRightConfirmed(true);
      onSwipeRight();
      await animate(x, 0, { type: 'spring', stiffness: 500, damping: 50 });
      setIsRightConfirmed(false);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 50 });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && onSwipeLeft) {
      onSwipeLeft();
      e.preventDefault();
    } else if (e.key === 'Enter' && onSwipeRight) {
      onSwipeRight();
      e.preventDefault();
    }
  };

  const descriptionId = React.useId();

  return (
    <div
      className={`relative overflow-hidden rounded-xl touch-pan-y select-none focus:outline-none focus:ring-2 focus:ring-accent ${className}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="listitem"
      aria-describedby={descriptionId}
    >
      <span id={descriptionId} className="sr-only">
        {onSwipeLeft ? t('swipe.a11yRemove') : ''}
        {onSwipeRight ? t('swipe.a11yEdit') : ''}
      </span>

      {renderRightBackground && (
        <motion.div
          className="absolute inset-y-0 right-0 w-full"
          style={{
            opacity: rightOpacity,
          }}
        >
          {renderRightBackground(x, isLeftConfirmed)}
        </motion.div>
      )}

      {renderLeftBackground && (
        <motion.div
          className="absolute inset-y-0 left-0 w-full"
          style={{
            opacity: leftOpacity,
          }}
        >
          {renderLeftBackground(x, isRightConfirmed)}
        </motion.div>
      )}

      <motion.div
        className="relative z-10"
        style={{ x }}
        drag="x"
        dragConstraints={{
          left: onSwipeLeft ? -SWIPE_CONFIG.DRAG_CONSTRAINT_PX : 0,
          right: onSwipeRight ? SWIPE_CONFIG.DRAG_CONSTRAINT_PX : 0,
        }}
        dragElastic={0}
        dragSnapToOrigin={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClickCapture={(e) => {
          if (isDragging.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default SwipeableItem;
