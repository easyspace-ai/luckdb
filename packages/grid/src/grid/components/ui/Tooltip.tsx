import React, { useState, useEffect, type FC } from 'react';
import { useGridTooltipStore } from './tooltip-store';

// Re-export the hook for convenience
export { useGridTooltipStore };

/**
 * Tooltip props
 */
interface IGridTooltipProps {
  id?: string;
}

/**
 * Merge class names
 */
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Grid tooltip component
 * Displays contextual tooltip information within the grid
 */
export const GridTooltip: FC<IGridTooltipProps> = (props) => {
  const { id } = props;
  const { tooltipInfo } = useGridTooltipStore();
  const [isVisible, setIsVisible] = useState(false);

  const visible = Boolean(tooltipInfo) && tooltipInfo?.id === id;
  const { text, position, triggerClassName, triggerStyle, contentClassName, contentStyle } =
    tooltipInfo ?? {};

  // Calculate trigger position
  const triggerPositionStyle = position
    ? {
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height,
      }
    : {};

  // Show tooltip with delay
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setIsVisible(true), 200);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="grid-tooltip-container">
      {/* Trigger element - invisible but positioned */}
      <div
        className={cn('grid-tooltip-trigger', triggerClassName)}
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          cursor: 'pointer',
          ...triggerStyle,
          ...triggerPositionStyle,
        }}
      />

      {/* Tooltip content */}
      {isVisible && (
        <div
          className={cn('grid-tooltip-content', contentClassName)}
          style={{
            position: 'absolute',
            left: position ? position.x : 0,
            top: position ? (position.y + (position.height || 0) + 8) : 0,
            pointerEvents: 'none',
            zIndex: 200,
            padding: '8px 12px',
            backgroundColor: '#1f2937',
            color: '#ffffff',
            fontSize: '12px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            maxWidth: '300px',
            whiteSpace: 'pre-line',
            wordBreak: 'break-word',
            ...contentStyle,
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
};

/**
 * Tooltip wrapper component
 * Provides simple tooltip functionality for children
 */
interface ITooltipProps {
  content: string;
  children: React.ReactElement;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: FC<ITooltipProps> = ({ content, children, delay = 500, position = 'bottom' }) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    
    let x = rect.left;
    let y = rect.bottom + 8;

    switch (position) {
      case 'top':
        y = rect.top - 8;
        break;
      case 'left':
        x = rect.left - 8;
        y = rect.top + rect.height / 2;
        break;
      case 'right':
        x = rect.right + 8;
        y = rect.top + rect.height / 2;
        break;
    }

    setCoords({ x, y });
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  };

  const handleMouseLeave = () => {
    setShow(false);
  };

  // Safety check for children
  if (!children || !React.isValidElement(children)) {
    return null;
  }

  return (
    <>
      {React.cloneElement(children, {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      })}
      {show && (
        <div
          style={{
            position: 'fixed',
            left: coords.x,
            top: coords.y,
            zIndex: 9999,
            padding: '6px 10px',
            backgroundColor: '#1f2937',
            color: '#ffffff',
            fontSize: '12px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {content}
        </div>
      )}
    </>
  );
};

