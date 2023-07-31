import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import * as ZXing from "@zxing/library";

import { useEffect, useRef, useState } from "react";

const VIDEO_HEIGHT = 500;

const BarcodeReader = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlRef = useRef<IScannerControls>();

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

      await reader
        .decodeFromConstraints(
          constraints,
          previewElement,
          (results, error, controls) => {
            controlRef.current = controlRef.current || controls;

            if (error) {
              onScanFail(error);
              return;
            }
            onScanSuccess(results);
          }
        )
        .catch(console.log);
    })().catch(console.log);
  }, []);

  const playVideo = () => {
    const devices = navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    if (!devices) return;
    devices.then((stream) => {
      if (!videoRef.current) return;

      const [_settings] = stream.getVideoTracks();
      const settings = _settings?.getSettings();

      console.log(settings);
    });
  };

  useEffect(() => {
    playVideo();
  }, []);

  return (
    <main className="container ">
      <h1>Bar Code / QR code Scanner</h1>

      <div className="frame-container flex" style={{ height: VIDEO_HEIGHT }}>
        <video playsInline ref={videoRef}></video>
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
