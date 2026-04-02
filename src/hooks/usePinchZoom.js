import { useState, useRef, useEffect, useCallback } from 'react';
import { usePinch } from '@use-gesture/react';

export function usePinchZoom({ minScale = 1, maxScale = 5 } = {}) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState([0, 0]);
  const imageRef = useRef(null);

  const bindPinch = usePinch(({ offset: [d, a], memo, cancel }) => {
    if (d < minScale) {
       setScale(minScale);
       setOffset([0, 0]);
       return;
    }
    if (d > maxScale) {
       setScale(maxScale);
       return;
    }
    setScale(d);
  });

  const handleDoubleTap = useCallback((e) => {
    setScale(prev => (prev === 1 ? 2.5 : 1));
    setOffset([0,0]);
  }, []);

  return {
    bindPinch,
    scale,
    offset,
    imageRef,
    handleDoubleTap
  };
}
