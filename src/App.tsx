import { useState } from "react";
import VideoCapture from "./VideoCapture";
import BarcodeReader from "./BarcodeReader";
const routes = {
  scanner: <BarcodeReader />,
  frame: <VideoCapture />,
};
type Keys = keyof typeof routes;

const App = () => {
  const [screen, setScreen] = useState<Keys>("scanner");

  const changeScreen = (key: Keys) => () => setScreen(key);

  const isActive = (input: Keys) => screen === input;
  return (
    <>
      <div className="route-link-list">
        <button
          className={`${isActive("frame") && "active"}`}
          onClick={changeScreen("frame")}
        >
          Frame (フォートフレーム)
        </button>
        <button
          className={`${isActive("scanner") && "active"}`}
          onClick={changeScreen("scanner")}
        >
          Scanner (バーコードリーダー)
        </button>
      </div>

      {routes[screen]}
    </>
  );
};

export default App;
