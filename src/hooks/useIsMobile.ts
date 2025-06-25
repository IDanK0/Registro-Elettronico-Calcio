import { useState, useEffect } from 'react';

// Hook to detect if the user is on a mobile device based on a media query
export default function useIsMobile(breakpoint = 640): boolean {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };
    mediaQuery.addEventListener('change', handler);
    // Initialize
    setIsMobile(mediaQuery.matches);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}
