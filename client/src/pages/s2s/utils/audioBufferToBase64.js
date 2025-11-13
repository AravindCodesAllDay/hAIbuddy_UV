import CONFIG from "../config";

// --- Utility: Convert Float32Array to base64 WAV  ---
export default function audioBufferToBase64(audioData) {
  const float32Array = new Float32Array(audioData);
  const numSamples = float32Array.length;
  const sampleRate = CONFIG.AUDIO_SETTINGS.sampleRate;

  // 1. WAV Header setup
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false);
  // RIFF chunk size
  view.setUint32(4, 36 + numSamples * 2, true);
  // WAVE identifier
  view.setUint32(8, 0x57415645, false);
  // fmt chunk identifier
  view.setUint32(12, 0x666d7420, false);
  // fmt chunk size
  view.setUint32(16, 16, true);
  // Audio format (1 for PCM)
  view.setUint16(20, 1, true);
  // Number of channels
  view.setUint16(22, 1, true);
  // Sample rate
  view.setUint32(24, sampleRate, true);
  // Byte rate (SampleRate * Channels * 2)
  view.setUint32(28, sampleRate * 2, true);
  // Block align (Channels * 2)
  view.setUint16(32, 2, true);
  // Bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  view.setUint32(36, 0x64617461, false);
  // data chunk size
  view.setUint32(40, numSamples * 2, true);

  // 2. Write PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++, offset += 2) {
    // Convert Float32 to Int16
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  // 3. Convert ArrayBuffer to Base64
  return btoa(
    new Uint8Array(buffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    )
  );
}
