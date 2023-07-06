import { useState } from "react";

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
