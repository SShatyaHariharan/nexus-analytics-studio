
import { useState, useEffect } from 'react';

export const useMobileWidth = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // Standard mobile breakpoint
    };

    // Check on first render
    checkIfMobile();

    // Add event listener
    window.addEventListener('resize', checkIfMobile);

    // Clean up event listener
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return isMobile;
};
