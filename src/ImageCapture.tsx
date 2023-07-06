import { useCallback, useEffect, useRef, useState } from "react";

const imageList = {
  aqua: "/assets/aqua.png",
  rem: "/assets/rem.png",
};

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

  const [selectedImage, setSelectedImage] = useState("aqua");
  const [imageScale, setImageScale] = useState(0.4);

  const [imagePos, setImagePos] = useState({ x: 0, y: 0 });

  const imageX = imagePos.x;
  const imageY = imagePos.y;

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

    image.src = imageList[selectedImage as keyof typeof imageList];

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

  const onCaptureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (canvas && video) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.globalCompositeOperation = "destination-over";

      ctx.drawImage(video, 0, 0, cameraDimension.w, cameraDimension.h);

      const dataUrl = canvas.toDataURL();
      const link = document.createElement("a");
      link.download = `${Intl.DateTimeFormat("jp-JP").format(new Date())}`;
      link.href = dataUrl;
      link.click();

      // reset image
      ctx.clearRect(0, 0, cameraDimension.w, cameraDimension.h);
      drawImage();
    }
  };

  const onChangeIllust = (e: any) => {
    console.log(e);

    const value = e.target.value;
    setSelectedImage(value);
  };

  const moveDelta = 50;
  const scaleDelta = 0.1;

  const moveVertical = (up?: boolean) => {
    setImagePos((s) => {
      s.x = s.x + (up ? -1 : 1) * moveDelta;
      return s;
    });
  };

  const moveHorizontal = (left?: boolean) => {
    setImagePos((s) => {
      s.y = s.y + (left ? -1 : 1) * moveDelta;
      return s;
    });
  };

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
        <button className="white" onClick={onCaptureImage}>
          <img src="/assets/camera.png" alt="" />
        </button>
        <div className="direction">
          <button onClick={() => moveVertical(true)}>^</button>
          <button onClick={() => moveVertical()}>v</button>
          <button onClick={() => moveHorizontal(true)}>{"<"}</button>
          <button onClick={() => moveHorizontal()}>{">"}</button>
        </div>
        <div>
          <button onClick={() => setImageScale((s) => (s -= scaleDelta))}>
            -
          </button>
          <span style={{ color: "#fff" }}>Zoom</span>
          <button onClick={() => setImageScale((s) => (s += scaleDelta))}>
            +
          </button>
        </div>
        <select
          value={selectedImage}
          name="illust"
          id=""
          onChange={onChangeIllust}
        >
          {Object.entries(imageList).map(([key]) => (
            <option key={Math.random()} value={key}>
              {key}
            </option>
          ))}
        </select>
      </main>
    </>
  );
};

export default ImageCapture;
