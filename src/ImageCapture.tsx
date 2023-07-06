import { useCallback, useEffect, useRef, useState } from "react";
import { usePosition } from "./utils/hooks";

const useMouseState = (canvas: HTMLCanvasElement | null) => {
  const [isMouseDown, setMouseDown] = useState(false);

  useEffect(() => {
    const mouseDown = () => {
      console.log("first");
      setMouseDown(true);
    };
    const mouseUp = () => {
      setMouseDown(false);
    };

    window?.addEventListener("mousedown", mouseDown);
    window?.addEventListener("mouseup", mouseUp);
  }, []);

  return { isMouseDown, isMouseUp: !isMouseDown };
};

const ImageCapture = () => {
  //  width and height
  const [cameraDimension, setCameraDimensions] = useState({ w: 1080, h: 720 });



  const { imageX, imageY, moveHorizontal, moveVertical } = usePosition();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;
    const image = new Image();

    image.onload = () => {
      ctx.clearRect(0, 0, cameraDimension.w, cameraDimension.h);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(
        image,
        imageX,
        imageY,
        image.width * imageScale,
        image.height * imageScale
      );
    };


    requestAnimationFrame(drawImage);
  }, [cameraDimension, imageX, imageY, imageScale, selectedImage]);

  const startCamera = () => {
    const devices = navigator.mediaDevices;

    if (!devices) {
      console.log("You don't have camera");
      return;
    }

    devices.getUserMedia({ video: true }).then((stream) => {
      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      video.play().catch(console.log);
    });
  };

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--camera-height",
      `${cameraDimension.h}px`
    );

    document.documentElement.style.setProperty(
      "--camera-width",
      `${cameraDimension.w}px`
    );
  }, [cameraDimension]);

  useEffect(() => {
    drawImage();
    startCamera();
  }, [drawImage]);





  const scaleDelta = 0.1;

  return (
    <>
      <main className="container">
        <div className="camera-container">
          <video
            ref={videoRef}
            height={cameraDimension.h}
            width={cameraDimension.w}
          ></video>
          <canvas
            ref={canvasRef}
            height={cameraDimension.h}
            width={cameraDimension.w}
          ></canvas>
        </div>
     
        <div className="direction">
          <button onClick={() => moveVertical(true)}>^</button>
          <button onClick={() => moveVertical()}>v</button>
          <button onClick={() => moveHorizontal(true)}>{"<"}</button>
          <button onClick={() => moveHorizontal()}>{">"}</button>
        </div>
       
      
      </main>
    </>
  );
};

export default ImageCapture;
