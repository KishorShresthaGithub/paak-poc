import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import * as ZXing from "@zxing/library";

import { useRef, useEffect, useState } from "react";

const BarcodeReader = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlRef = useRef<IScannerControls>();

  const [results, setResult] = useState<string>();

  const onScanSuccess = (results: any) => {
    const controls = controlRef.current;

    if (results) {
      setResult(`The payload is : ${results.text}`);
    }
  };
  const onScanFail = (error: any) => {
    // console.log(error);
    // setResult({ ...error });
    // controls.stop();
  };

  useEffect(() => {
    // load zxing
    (async () => {
      const hints = new Map();
      const formats = Object.values(ZXing.BarcodeFormat);

      hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);

      const reader = new BrowserMultiFormatReader(hints);
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      const selectedDeviceId = devices[0].deviceId;

      const previewElement = videoRef.current;

      if (!previewElement) return;

      const control = await reader
        .decodeFromVideoDevice(
          undefined,
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

  /*   const playVideo = () => {
    const devices = navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    if (!devices) return;
    devices.then((stream) => {
      if (!videoRef.current) return;

      const settings = stream.getVideoTracks()[0]?.getSettings();
      const { height, width } = settings;

      videoRef.current.height = height || 100;
      videoRef.current.width = width || 100;

      videoRef.current.srcObject = stream;
    });
  };

  useEffect(() => {
    playVideo();
  }, []); */

  return (
    <main className="container ">
      <h1>Bar Code / QR code Scanner</h1>

      <div className="frame-container">
        <video playsInline ref={videoRef}></video>
      </div>

      <div style={{ overflow: "scroll", maxHeight: "200px" }}>
        <pre>{results}</pre>
      </div>
    </main>
  );
};

export default BarcodeReader;
