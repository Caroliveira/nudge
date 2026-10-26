'use client';

import React, { useState } from 'react';
import { motion, useTransform, useMotionValueEvent, MotionValue } from 'framer-motion';

interface SwipeActionProps {
  threshold: number;
  baseText: string;
  activeText: string;
  successText?: string;
  baseColor: string;
  activeColor: string;
  alignment: 'start' | 'end';
  x: MotionValue<number>;
  onClick: () => void;
  isConfirmed?: boolean;
}

export const SwipeAction: React.FC<SwipeActionProps> = ({
  x,
  onClick,
  threshold,
  baseText,
  activeText,
  successText,
  baseColor,
  activeColor,
  alignment,
  isConfirmed = false,
}) => {
  const [dynamicText, setDynamicText] = useState(baseText);

  const text = isConfirmed && successText ? successText : dynamicText;

  const isTriggered = (val: number) => (threshold < 0 ? val < threshold : val > threshold);

  const bg = useTransform(x, (val) => (isTriggered(val) ? activeColor : baseColor));

  const scale = useTransform(x, (val) => (isTriggered(val) ? 1.1 : 1));

  useMotionValueEvent(x, 'change', (latest) => {
    if (isConfirmed && successText) return;

    if (isTriggered(latest) && dynamicText !== activeText) setDynamicText(activeText);
    if (!isTriggered(latest) && dynamicText !== baseText) setDynamicText(baseText);
  });

  const alignmentClass = alignment === 'end' ? 'justify-end pr-6' : 'justify-start pl-6';

  return (
    <motion.div
      className={`h-full w-full flex items-center ${alignmentClass} rounded-xl`}
      style={{ backgroundColor: bg }}
    >
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="text-white font-bold p-2"
        style={{ scale }}
        aria-label={`${baseText} task`}
      >
        {text}
      </motion.button>
    </motion.div>
  );
};
