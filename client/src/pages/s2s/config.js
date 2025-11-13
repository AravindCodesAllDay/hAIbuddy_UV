// src/config.js

const CONFIG = {
  // --- Server & WebSocket ---
  WEBSOCKET_URL: "ws://localhost:8000/interview",
  RECONNECTION_ATTEMPT_INTERVAL: 3000, // in milliseconds
  IDLE_TIMEOUT: 12000, // in milliseconds

  // --- Audio Settings ---
  AUDIO_SETTINGS: {
    sampleRate: 16000,
  },

  // --- VAD Settings (Voice Activity Detection) ---
  VAD_SETTINGS: {
    threshold: 0.8, // How sensitive VAD is to speech.
    minSpeechDuration: 0.5, // Minimum duration of speech to be considered.
    minSilenceDuration: 0.8, // Silence duration after speech to trigger onSpeechEnd.
  },

  // --- TTS Sentence Parsing ---
  SENTENCE_SPLIT_REGEX: /(?<=[.!?])\s*/,
};

export default CONFIG;
