import { useEffect, useState } from "react";

const isBrowser = typeof window !== "undefined";

export function useWindowSize() {
  const [size, setSize] = useState({
    width: isBrowser ? window.innerWidth : Infinity,
    height: isBrowser ? window.innerHeight : Infinity,
  });

  useEffect(() => {
    if (!isBrowser) return;

    let frameId: number;

    const handleResize = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        setSize({ width, height });
      });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return size;
}
