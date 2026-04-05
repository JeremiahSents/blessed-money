import { useRef } from "react";

interface UseSwipeOptions {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    threshold?: number;
}

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 80 }: UseSwipeOptions) {
    const startX = useRef<number>(0);

    const onTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        const deltaX = e.changedTouches[0].clientX - startX.current;
        if (deltaX < -threshold) onSwipeLeft?.();
        else if (deltaX > threshold) onSwipeRight?.();
    };

    return { onTouchStart, onTouchEnd };
}
