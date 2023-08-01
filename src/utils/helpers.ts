export const getMaxCameraResolution = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
  });
  const [tracks] = stream.getVideoTracks();

  const capabilities = tracks?.getCapabilities();
  const settings = tracks?.getSettings();

  tracks.stop();

  return {
    height: capabilities?.height?.max || 0,
    width: capabilities?.width?.max || 0,
    aspectRatio: settings?.aspectRatio || 1,
  };
};

export const getOrientation = () => {
  return window.matchMedia("(orientation:portrait)").matches;
};
