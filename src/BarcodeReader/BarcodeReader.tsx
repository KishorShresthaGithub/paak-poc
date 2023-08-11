import { BrowserMultiFormatReader } from "@zxing/browser";
import * as ZXing from "@zxing/library";
import style from "./BarcodeReader.module.scss";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const onScanFail = (error: any) => {
    console.log(error.message);
    // console.log(error.message);
    // setResult({ ...error });
    // controls.stop();
  };

  const readBarcode = useCallback(async () => {
    const previewElement = videoRef.current;
    if (!previewElement) return;

    const hints = new Map();
    const formats = Object.values(ZXing.BarcodeFormat);

    hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);

    const reader = new BrowserMultiFormatReader(hints);

    await reader.decodeFromConstraints(
      { video: { facingMode: "environment" } },
      previewElement,
      (success, error) => {
        if (error) {
          onScanFail(error);
          return;
        }
        if (success) onScanSuccess(success);
      }
    );
  }, []);

  useEffect(() => {
    readBarcode();
  }, [readBarcode]);

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
