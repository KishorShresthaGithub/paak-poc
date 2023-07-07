import { useEffect, useState } from "react";

export const usePosition = (moveDelta = 50) => {
  const [imagePos, setImagePos] = useState({ x: 0, y: 0 });

  const imageX = imagePos.x;
  const imageY = imagePos.y;

  const moveVertical = (up?: boolean) => {
    setImagePos((state) => {
      const s = { ...state };
      s.y = s.y + (up ? -1 : 1) * moveDelta;
      return s;
    });
  };

  const moveHorizontal = (left?: boolean) => {
    setImagePos((state) => {
      const s = { ...state };
      s.x = s.x + (left ? -1 : 1) * moveDelta;
      return s;
    });
  };

  return { imageX, imageY, moveVertical, moveHorizontal };
};

export const useResponsive = () => {
  const vw = Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  );
  const vh = Math.max(
    document.documentElement.clientHeight || 0,
    window.innerHeight || 0
  );
  const [dimension, setDimension] = useState({
    w: vw,
    h: vh,
  });

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const contentSize = entry.contentRect;

        setDimension({ w: contentSize.width, h: contentSize.height });
      }
    });
    observer.observe(document.body);
  }, []);

  return { ...dimension, vw, vh };
};
