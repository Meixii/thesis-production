// Utility to crop an image using canvas, for use with react-easy-crop
// Returns a Promise<Blob>
export default function getCroppedImg(imageSrc: string, croppedAreaPixels: any): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Failed to get canvas context'));
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas is empty'));
      }, 'image/jpeg');
    };
    image.onerror = (err) => reject(err);
  });
} 