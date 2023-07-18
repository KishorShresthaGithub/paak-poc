import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import "./VideoCapture.scss";
import { usePosition, useResponsive } from "../utils/hooks";

const imageList = {
  aqua: "/assets/aqua.png",
  rem: "/assets/rem.png",
  dio: "/assets/dio.png",
};

function stop(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop());
}

const VideoCapture = () => {
  const { w, h } = useResponsive();

  const videoHeight = 540;

  // camera for video and canvas dimension
  const [canvasDimension, setCanvasDimension] = useState({
    w: Math.min(720, w),
    h: Math.min(540, h),
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
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const recorderCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<any>(undefined);

  // drawing illustration to canvas
  const drawIllust = useCallback(() => {
    const image = imageRef.current || new Image();
    const canvas = imageCanvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!(image && ctx)) return;

    const drawImage = () => {
      ctx.clearRect(0, 0, canvasDimension.w, canvasDimension.h);
      ctx.drawImage(
        image,
        imageX,
        imageY,
        image.width * imageScale,
        image.height * imageScale
      );
    };

    image.onload = drawImage;

    image.src = imageList[selectedImage as keyof typeof imageList];
  }, [canvasDimension, imageScale, imageX, imageY, selectedImage]);

  // getting dimensions of stream
  const getStreamDimension = useCallback((stream: MediaStream) => {
    const tracks = stream.getVideoTracks();
    const settings = tracks[0].getSettings();

    const trackHeight = settings.height || 0;
    const trackWidth = settings.width || 0;

    return { trackWidth, trackHeight };
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);

  // play video on canvas
  const playStream = useCallback(
    (stream: MediaStream) => {
      const video = videoRef.current;

      if (!video) return;

      // we are using to 2 canvases on for viewing one for recording
      const videoCanvas = videoCanvasRef.current;
      const videoCtx = videoCanvas?.getContext("2d");
      const recorderCanvas = recorderCanvasRef.current;
      const recorderCtx = recorderCanvas?.getContext("2d");

      const { trackWidth, trackHeight } = getStreamDimension(stream);

      // delta width to center the video in canvas
      let dWidth = 0;

      if (!(videoCtx && recorderCtx)) return;

      // recorderCtx.globalCompositeOperation = "destination-over";

      const isSafari =
        navigator.userAgent.search("Safari") >= 0 &&
        navigator.userAgent.search("Chrome") < 0;

      const drawFrame = (ctx: CanvasRenderingContext2D) => {
        // ctx.globalCompositeOperation = "destination-over";
        ctx.clearRect(0, 0, canvasDimension.w, canvasDimension.h);

        //draw illustration to recording
        ctx.drawImage(video, isSafari ? 0 : dWidth * -0.5, 0);

        if (imageCanvasRef.current)
          recorderCtx.drawImage(imageCanvasRef.current, 0, 0);

        requestAnimationFrame(() => drawFrame(ctx));
      };

      video.addEventListener("loadedmetadata", () => {
        drawFrame(videoCtx);
        drawFrame(recorderCtx);
      });

      video.setAttribute("autoplay", "");
      video.setAttribute("playsinline", "");
      video.srcObject = stream;

      video.load();

      if (videoCanvasRef.current) {
        dWidth = trackWidth - canvasDimension.w;

        if (trackHeight < canvasDimension.h) {
          videoCanvasRef.current
            .getContext("2d")
            ?.clearRect(0, 0, canvasDimension.w, canvasDimension.h);

          setCanvasDimension((s) => ({
            ...s,
            h: trackHeight,
          }));
        }
      }
    },
    [canvasDimension.h, canvasDimension.w, getStreamDimension]
  );

  // play the video
  const playVideo = useCallback(() => {
    const devices = navigator.mediaDevices;
    if (!devices) throw new Error("Input devices not available");

    devices
      .getUserMedia({
        video: {
          height: videoHeight,
          facingMode: front ? "user" : "environment",
        },
        audio: true,
      })
      .then(playStream);
  }, [front, playStream]);

  useEffect(() => {
    drawIllust();
    playVideo();
  }, [drawIllust, playVideo]);

  // change illustration
  const onChangeIllust = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedImage(value);
  };

  // capture the image
  const onCaptureImage = () => {
    const recorderCanvas = recorderCanvasRef.current;

    if (recorderCanvas) {
      const recorderCtx = recorderCanvas.getContext("2d");

      if (!recorderCtx) return;

      const dataUrl = recorderCanvas.toDataURL();
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
    const canvas = recorderCanvasRef.current;

    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const audioTrack = audioStream.getAudioTracks()[0];

    if (!canvas) return;
    setRecordStart((s) => !s);

    const stream = canvas.captureStream(30);
    stream.addTrack(audioTrack);

    const codec = "video/webm;codecs=vp8,opus";
    mediaRecorderRef.current =
      mediaRecorderRef.current ||
      new MediaRecorder(stream, {
        mimeType: codec,
      });

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

      const blob = new Blob(chunksRef.current, { type: "video/mp4" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.download = "test.mp4";
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

      <div
        className="frame-container"
        style={{ width: canvasDimension.w, height: canvasDimension.h }}
      >
        <canvas
          ref={imageCanvasRef}
          height={canvasDimension.h}
          width={canvasDimension.w}
        ></canvas>

        <canvas
          ref={videoCanvasRef}
          height={canvasDimension.h}
          width={canvasDimension.w}
        ></canvas>
      </div>

      <video ref={videoRef} muted className="video-hide"></video>

      <div className="hide">
        <canvas
          ref={recorderCanvasRef}
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
