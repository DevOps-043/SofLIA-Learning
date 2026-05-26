import { useEffect, useState } from 'react';

type NetworkInfo = {
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (event: string, callback: () => void) => void;
  removeEventListener?: (event: string, callback: () => void) => void;
};

export function useSlowConnection() {
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInfo }).connection;
    if (!connection) return;

    const evaluate = () => {
      setIsSlowConnection(
        connection.saveData === true ||
          connection.effectiveType === '2g' ||
          connection.effectiveType === 'slow-2g',
      );
    };

    evaluate();
    connection.addEventListener?.('change', evaluate);
    return () => connection.removeEventListener?.('change', evaluate);
  }, []);

  return isSlowConnection;
}
