import { BrowserMultiFormatReader } from "@zxing/browser";
import * as ZXing from "@zxing/library";
import style from "./BarcodeReader.module.scss";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMaxCameraResolution, getOrientation } from "../utils/helpers";

const BarcodeReader = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
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

  const readBarcode = useCallback(async (stream: MediaStream) => {
    const previewElement = videoRef.current;
    if (!previewElement) return;

    const hints = new Map();
    const formats = Object.values(ZXing.BarcodeFormat);

    hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);

    const reader = new BrowserMultiFormatReader(hints);

    await reader.decodeFromStream(stream, undefined, (success, error) => {
      if (error) {
        onScanFail(error);
        return;
      }
      onScanSuccess(success);
    });
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

  const playVideo = useCallback(async () => {
    const { stream } = await getStream();
    // video ref
    const preview = videoRef.current;
    if (!(preview && stream)) return;

    preview.srcObject = stream;
    return stream;
  }, []);

  useEffect(() => {
    playVideo().then((stream) => stream && readBarcode(stream));
  }, [playVideo, readBarcode]);

  return (
    <main className={style.container}>
      <h1>Bar Code / QR code Scanner</h1>

      <div
        ref={frameContainerRef}
        className={`${style["frame-container"]} ${style.flex}`}
      >
        <video playsInline ref={videoRef} autoPlay></video>
      </div>

      <div className={style.results}>
        <div>
          <pre>{results}</pre>

          <br />
          <br />
          <br />
          {jsonResult && <span>JSON Data:</span>}
          <pre>{JSON.stringify(jsonResult, null, 2)}</pre>
        </div>
      </div>
    </main>
  );
};

export default BarcodeReader;
