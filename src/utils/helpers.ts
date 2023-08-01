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

// Function to apply the grayscale and contrast filter
export async function applyGrayscaleAndContrastFilter(
  canvas: HTMLCanvasElement
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Calculate average grayscale value to adjust contrast
  let totalGrayscale = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const grayscale = (r + g + b) / 3;
    totalGrayscale += grayscale;
  }
  const averageGrayscale = totalGrayscale / (data.length / 4);

  // Adjust contrast based on average grayscale value
  const contrastFactor = 2; // You can adjust this value to control the contrast

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Calculate grayscale value
    const grayscale = (r + g + b) / 3;

    // Adjust contrast by using the average grayscale value as the reference
    const contrastValue =
      contrastFactor * (grayscale - averageGrayscale) + averageGrayscale;

    // Apply the contrast value to each RGB channel
    data[i] = contrastValue; // Red channel
    data[i + 1] = contrastValue; // Green channel
    data[i + 2] = contrastValue; // Blue channel
  }

  // Put the modified pixel data back onto the canvas
  ctx.putImageData(imageData, 0, 0);
  return Promise.resolve(1);
}
