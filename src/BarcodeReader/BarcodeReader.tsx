import { BrowserMultiFormatReader } from "@zxing/browser";
import * as ZXing from "@zxing/library";
import style from "./BarcodeReader.module.scss";

import { useEffect, useRef, useState, useCallback } from "react";
import { getMaxCameraResolution, getOrientation } from "../utils/helpers";

const MAX_WIDTH = 700;

const BarcodeReader = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameContainerRef = useRef<HTMLDivElement>(null);

  const [results, setResult] = useState<string>();
  const [jsonResult, setJSONResult] = useState<string>();

  const onScanSuccess = (results: any) => {
    // const controls = controlRef.current;

    if (results) {
      setJSONResult(results);
      setResult(`The payload is : ${results.text}`);
    }
  };
  const onScanFail = (error: unknown) => {
    // console.log(error.message);
    // setResult({ ...error });
    // controls.stop();
  };

  useEffect(() => {
    // load zxing
    (async () => {
      const hints = new Map();
      const formats = Object.values(ZXing.BarcodeFormat);

      const { height: VIDEO_HEIGHT } = await getMaxCameraResolution();

      hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);

      const previewElement = videoRef.current;

      const constraints = {
        video: {
          height: { ideal: VIDEO_HEIGHT },
          facingMode: "environment",
          aspectRatio: 9 / 16,
        },
      };

      const reader = new BrowserMultiFormatReader(hints);

      if (!previewElement) return;
    })().catch(console.log);
  }, []);

  const getStream = async () => {
    // get basic stream
    const { height: _height, aspectRatio } = await getMaxCameraResolution();
    // get orientation
    const portrait = getOrientation();

    // new video stream
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        height: { ideal: _height },
        aspectRatio: portrait ? 1 / aspectRatio : aspectRatio,
      },
    });
    return { stream, aspectRatio };
  };

  const getContainerDimensions = (element: HTMLElement | null) => {
    return element?.getBoundingClientRect();
  };

  const playVideo = useCallback(async () => {
    const { stream, aspectRatio } = await getStream();
    // video ref
    const preview = videoRef.current;
    if (!(preview && stream)) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!ctx || !canvas) return;

    const containerDimensions = getContainerDimensions(
      frameContainerRef.current
    );
    const containerWidth = Math.min(
      (containerDimensions?.width || 0) - 20,
      MAX_WIDTH
    );

    const responsiveWidth = [containerWidth / aspectRatio, containerWidth];

    const [ch, cw] = responsiveWidth;

    [preview.height, preview.width] = responsiveWidth;
    [canvas.height, canvas.width] = responsiveWidth;

    preview.addEventListener("loadedmetadata", () => {
      const drawImage = () => {
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(preview, 0, 0, cw, ch);
        requestAnimationFrame(drawImage);
      };

      drawImage();
    });

    preview.srcObject = stream;

    const [track] = stream.getVideoTracks();
    console.log(track.getSettings());
  }, []);

  useEffect(() => {
    playVideo();
  }, [playVideo]);

  return (
    <main className={style.container}>
      <h1>Bar Code / QR code Scanner</h1>

      <div
        ref={frameContainerRef}
        className={`${style["frame-container"]} ${style.flex}`}
      >
        <video playsInline ref={videoRef} autoPlay></video>

        <canvas ref={canvasRef}></canvas>
      </div>

      <div
        style={{ overflow: "auto", maxHeight: "500px", marginBottom: "2rem" }}
      >
        <pre>{results}</pre>

        <br />
        <br />
        <br />
        {jsonResult && <span>JSON Data:</span>}
        <pre>{JSON.stringify(jsonResult, null, 2)}</pre>
      </div>
    </main>
  );
};

export default BarcodeReader;
