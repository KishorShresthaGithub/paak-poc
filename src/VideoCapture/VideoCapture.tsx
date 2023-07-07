import { useCallback, useEffect, useRef, useState } from "react";
import "./VideoCapture.scss";
import { usePosition } from "../utils/hooks";

const imageList = {
  aqua: "/assets/aqua.png",
  rem: "/assets/rem.png",
};

function startRecording(stream: MediaStream, lengthInMS = 10 * 1000) {
  const recorder = new MediaRecorder(stream);
  const data: any = [];

  function wait(delayInMS: number) {
    return new Promise((resolve) => setTimeout(resolve, delayInMS));
  }

  recorder.ondataavailable = (event) => data.push(event.data);
  recorder.start();
  console.log(`${recorder.state} for ${lengthInMS / 1000} seconds…`);

  const stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = (event: any) => reject(event.name);
  });

  const recorded = wait(lengthInMS).then(() => {
    if (recorder.state === "recording") {
      recorder.stop();
    }
  });

  return Promise.all([stopped, recorded]).then(() => data);
}

function stop(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop());
}

const VideoCapture = () => {
  // camera for video and canvas dimension
  const [cameraDimension, setCameraDimensions] = useState({ w: 1080, h: 720 });
  // start recording
  const [recordStart, setRecordStart] = useState(false);

  //image position
  const { imageX, imageY, moveHorizontal, moveVertical } = usePosition();
  const [selectedImage, setSelectedImage] = useState("aqua");
  const [imageScale, setImageScale] = useState(0.4);

  const scaleDelta = 0.1;

  // reference for canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // drawing illustration to canvas
  const drawIllust = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const image = new Image();
      //   image.onload = () => {
      //     console.log("loaded");
      //   };

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

  // play video on canvas
  const playStream = useCallback(
    (stream: MediaStream) => {
      const video = document.createElement("video");

      video.addEventListener("loadedmetadata", () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.globalCompositeOperation = "destination-over";

        const drawFrame = () => {
          ctx.clearRect(0, 0, cameraDimension.w, cameraDimension.h);
          drawIllust(ctx);

          ctx.drawImage(video, 0, 0);

          requestAnimationFrame(drawFrame);
        };
        drawFrame();
      });
      video.autoplay = true;
      video.srcObject = stream;
    },
    [cameraDimension, drawIllust]
  );

  // play the video
  const playVideo = useCallback(() => {
    const devices = navigator.mediaDevices;
    if (!devices) throw new Error("Input devices not available");

    devices
      .getUserMedia({
        video: { width: cameraDimension.w, height: cameraDimension.h },
      })
      .then(playStream);
  }, [cameraDimension.h, cameraDimension.w, playStream]);

  useEffect(() => {
    playVideo();
    // const ctx = canvasRef.current?.getContext("2d");

    // ctx && drawIllust(ctx);
  }, [playVideo]);

  // change illustration
  const onChangeIllust = (e: any) => {
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
  const chunksRef = useRef<any[]>([]);

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

  return (
    <main className="container">
      <h1>Video Capture</h1>

      {/* <video
        className="hide"
        height={cameraDimension.h}
        width={cameraDimension.w}
      ></video> */}

      <div className="frame-container">
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

      <button className="white" onClick={onCaptureImage}>
        <img src="/assets/camera.png" alt="" />
      </button>

      <div>
        <button onClick={() => setImageScale((s) => (s -= scaleDelta))}>
          -
        </button>
        <span style={{ color: "#fff" }}>Zoom</span>
        <button onClick={() => setImageScale((s) => (s += scaleDelta))}>
          +
        </button>
      </div>

      <div>
        <button onClick={onRecord}>
          {recordStart ? "Recording..." : "Record"}
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
  );
};
export default VideoCapture;
