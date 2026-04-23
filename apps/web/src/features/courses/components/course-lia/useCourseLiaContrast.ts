import { useEffect, useRef, useState } from 'react';

export function useCourseLiaContrast(panelBg: string, isLightTheme: boolean) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [forceDarkText, setForceDarkText] = useState(false);

  useEffect(() => {
    const checkContrast = () => {
      if (!panelRef.current) {
        return;
      }

      const backgroundColor = window.getComputedStyle(panelRef.current).backgroundColor;
      const rgb = backgroundColor.match(/\d+/g);

      if (!rgb || rgb.length < 3) {
        return;
      }

      const brightness =
        (parseInt(rgb[0], 10) * 299 + parseInt(rgb[1], 10) * 587 + parseInt(rgb[2], 10) * 114) / 1000;

      setForceDarkText(brightness > 200);
    };

    checkContrast();
    const timer = setTimeout(checkContrast, 500);

    return () => clearTimeout(timer);
  }, [panelBg, isLightTheme]);

  return { forceDarkText, panelRef };
}
