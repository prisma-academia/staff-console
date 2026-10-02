// Crop, rotate and resize an image in the browser, returning a JPEG data URL.
// Kept dependency-free so the staff console can carry an identical copy.

export const PHOTO_SIZE = 600;
const MAX_BYTES = 300 * 1024;

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The image could not be loaded"));
    image.src = src;
  });

const radians = (degrees) => (degrees * Math.PI) / 180;

// Bounding box of a width x height rectangle rotated by `rotation` degrees.
const rotatedSize = (width, height, rotation) => {
  const rad = radians(rotation);
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
};

// Approximate decoded size of a base64 data URL.
export const dataUrlBytes = (dataUrl) => Math.round(((dataUrl.length - dataUrl.indexOf(",") - 1) * 3) / 4);

/**
 * @param {string} src       object URL or data URL of the source image
 * @param {{x,y,width,height}} pixelCrop  area from react-easy-crop's onCropComplete
 * @param {number} rotation  degrees, as passed to <Cropper rotation>
 * @returns {Promise<string>} square JPEG data URL, PHOTO_SIZE px, at most ~300 KB
 */
export async function getCroppedImage(src, pixelCrop, rotation = 0, { size = PHOTO_SIZE } = {}) {
  const image = await loadImage(src);

  // Draw the whole image rotated about its centre, matching react-easy-crop's model.
  const box = rotatedSize(image.width, image.height, rotation);
  const rotated = document.createElement("canvas");
  rotated.width = box.width;
  rotated.height = box.height;
  const rctx = rotated.getContext("2d");
  rctx.translate(box.width / 2, box.height / 2);
  rctx.rotate(radians(rotation));
  rctx.drawImage(image, -image.width / 2, -image.height / 2);

  // Cut the crop out of the rotated image straight into the output size.
  const out = document.createElement("canvas");
  out.width = size;
  out.height = size;
  const ctx = out.getContext("2d");
  ctx.fillStyle = "#ffffff"; // transparent PNG areas would turn black in JPEG
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(rotated, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, size, size);

  let quality = 0.9;
  let dataUrl = out.toDataURL("image/jpeg", quality);
  while (dataUrlBytes(dataUrl) > MAX_BYTES && quality > 0.5) {
    quality -= 0.1;
    dataUrl = out.toDataURL("image/jpeg", quality);
  }
  return dataUrl;
}

// Grab the current frame of a playing <video> as a JPEG data URL (mirrored like a selfie preview).
export function captureVideoFrame(video, { mirror = true } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (mirror) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.95);
}
