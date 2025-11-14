export default function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result.split(",")[1];
      resolve(base64Audio);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
