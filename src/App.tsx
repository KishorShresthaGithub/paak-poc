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

  return (
    <>
      <div className="route-link-list">
        <button onClick={changeScreen("frame")}>Frame</button>
        <button onClick={changeScreen("scanner")}>Scanner</button>
      </div>

      {routes[screen]}
    </>
  );
};

export default App;
