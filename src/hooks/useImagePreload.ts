import { useEffect, useState } from "react";

export function useImagePreload(src?: string) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoaded(false);
      setError(true);
      return;
    }

    let isMounted = true;
    const image = new Image();

    setLoaded(false);
    setError(false);

    image.src = src;

    image.onload = () => {
      if (!isMounted) return;
      setLoaded(true);
    };

    image.onerror = () => {
      if (!isMounted) return;
      setError(true);
    };

    return () => {
      isMounted = false;
    };
  }, [src]);

  return {
    loaded,
    error,
  };
}
