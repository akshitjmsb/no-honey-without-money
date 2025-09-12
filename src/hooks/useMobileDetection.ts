import { useState, useEffect } from 'react';

interface MobileDetection {
  isMobile: boolean;
  isIPhone13Pro: boolean;
  screenWidth: number;
  screenHeight: number;
}

export const useMobileDetection = (): MobileDetection => {
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isIPhone13Pro: false,
    screenWidth: 0,
    screenHeight: 0,
  });

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // iPhone 13 Pro specific detection
      const isIPhone13Pro = width <= 390 && height <= 844;
      
      // General mobile detection
      const isMobile = width <= 768 || isIPhone13Pro;
      
      setDetection({
        isMobile,
        isIPhone13Pro,
        screenWidth: width,
        screenHeight: height,
      });
    };

    // Initial check
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  return detection;
};
