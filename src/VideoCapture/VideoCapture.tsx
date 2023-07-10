import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import "./VideoCapture.scss";
import { usePosition, useResponsive } from "../utils/hooks";

const imageList = {
  aqua: "/assets/aqua.png",
  rem: "/assets/rem.png",
};

function stop(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop());
}

const VideoCapture = () => {
  const { w, h, vw } = useResponsive();

  // camera for video and canvas dimension
  const [canvasDimension, setCanvasDimension] = useState({
    w: Math.min(1080, w),
    h: Math.min(720, h),
  });
  // start recording
  const [recordStart, setRecordStart] = useState(false);
  // camera environment state
  const [front, setFront] = useState(false);
  // scaling illustration
  const [imageScale, setImageScale] = useState(w < 640 ? 0.2 : 0.3);
  const scaleDelta = w < 640 ? 0.05 : 0.1;

  //image position
  const { imageX, imageY, moveHorizontal, moveVertical } = usePosition();
  const [selectedImage, setSelectedImage] = useState("aqua");

  // reference for canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // drawing illustration to canvas
  const drawIllust = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const image = new Image();

      image.src = imageList[selectedImage as keyof typeof imageList];

      if (image.complete) {
        ctx.drawImage(
          image,
          imageX,
          imageY,
          image.width * imageScale,
          image.height * imageScale
        );
      }
    },
    [imageScale, imageX, imageY, selectedImage]
  );

  // getting dimensions of stream
  const getStreamDimension = useCallback((stream: MediaStream) => {
    const tracks = stream.getVideoTracks();
    const settings = tracks[0].getSettings();

    const trackHeight = settings.height || 0;
    const trackWidth = settings.width || 0;
    return { trackWidth, trackHeight };
  }, []);

  const videoRef = useRef<HTMLVideoElement>();

  // play video on canvas
  const playStream = useCallback(
    (stream: MediaStream) => {
      videoRef.current = videoRef.current || document.createElement("video");
      const video = videoRef.current;

      const { trackWidth, trackHeight } = getStreamDimension(stream);

      // delta width to center the video in canvas

      let dWidth = 0;

      video.addEventListener("loadedmetadata", () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx) return;

        ctx.globalCompositeOperation = "destination-over";

        const drawFrame = () => {
          ctx.clearRect(0, 0, canvasDimension.w, canvasDimension.h);
          // draw illustration
          drawIllust(ctx);
          // draw video frame
          // start from difference
          ctx.drawImage(video, dWidth * -0.5, 0);
          requestAnimationFrame(drawFrame);
        };
        drawFrame();
      });

      video.autoplay = true;
      video.srcObject = stream;

      if (canvasRef.current) {
        dWidth = trackWidth - canvasRef.current.width;

        if (trackHeight < canvasDimension.h) {
          canvasRef.current
            .getContext("2d")
            ?.clearRect(0, 0, canvasDimension.w, canvasDimension.h);

          setCanvasDimension((s) => ({
            ...s,
            h: trackHeight,
          }));
        }
      }
    },
    [canvasDimension.h, canvasDimension.w, drawIllust, getStreamDimension]
  );

  // play the video
  const playVideo = useCallback(() => {
    const devices = navigator.mediaDevices;
    if (!devices) throw new Error("Input devices not available");

    devices
      .getUserMedia({
        video: {
          height: { ideal: 540 },
          facingMode: front ? "user" : "environment",
        },
      })
      .then(playStream);
  }, [front, playStream]);

  useEffect(() => {
    playVideo();
  }, [playVideo]);

  // change illustration
  const onChangeIllust = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedImage(value);
  };

  // capture the image
  const onCaptureImage = () => {
    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dataUrl = canvas.toDataURL();
      const link = document.createElement("a");
      link.download = `${Intl.DateTimeFormat("jp-JP").format(new Date())}`;
      link.href = dataUrl;
      link.click();
    }
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // record video
  const onRecord = useCallback(async () => {
    const currentRecordState = !recordStart;
    const canvas = canvasRef.current;

    if (!canvas) return;
    setRecordStart((s) => !s);

    const stream = canvas.captureStream(30);
    mediaRecorderRef.current =
      mediaRecorderRef.current || new MediaRecorder(stream);

    const mediaRecorder = mediaRecorderRef.current;

    mediaRecorder.ondataavailable = (e) => {
      console.log("pushing chunks");
      chunksRef.current.push(e.data);
    };
    mediaRecorder.onerror = console.log;
    mediaRecorder.onstop = () => console.log("recording stop");

    if (currentRecordState && mediaRecorder.state !== "recording") {
      //start
      chunksRef.current = [];
      mediaRecorder.start(200);
    } else {
      // stop
      mediaRecorder.stop();
      mediaRecorderRef.current = null;
      stop(stream);

      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.download = "test.webm";
      link.href = url;
      link.click();
    }
  }, [recordStart]);

  const onChangeFront = () => {
    setFront((s) => !s);
  };

  return (
    <main className="container">
      <h1>Video Capture</h1>

      <div className="frame-container">
        <canvas
          ref={canvasRef}
          height={canvasDimension.h}
          width={canvasDimension.w}
        ></canvas>
      </div>

      <div className="buttons-container">
        <div className="direction">
          <button onClick={() => moveVertical(true)}>^</button>
          <button onClick={() => moveVertical()}>v</button>
          <button onClick={() => moveHorizontal(true)}>{"<"}</button>
          <button onClick={() => moveHorizontal()}>{">"}</button>
        </div>
        <div className="btn-group">
          <button className="white" onClick={onCaptureImage}>
            <img src="/assets/camera.png" alt="" />
          </button>

          <button className="white" onClick={onRecord}>
            {recordStart ? "Recording..." : "Record"}
          </button>
        </div>

        <div className="zoom">
          <button
            className="white"
            onClick={() => setImageScale((s) => (s -= scaleDelta))}
          >
            -
          </button>
          <span style={{ color: "#fff" }}>Zoom</span>
          <button
            className="white"
            onClick={() => setImageScale((s) => (s += scaleDelta))}
          >
            +
          </button>
        </div>
        {w < 640 && (
          <div>
            <button className="white toggle" onClick={onChangeFront}>
              {front ? "Back" : "Front"} <img src="/assets/camera.png" alt="" />
            </button>
          </div>
        )}
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
  );
};
export default VideoCapture;
