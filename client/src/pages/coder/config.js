// config.js - Updated configuration for voice interview with code editor

const CONFIG = {
  // WebSocket Configuration
  WEBSOCKET_URL: "ws://localhost:8000/code_interview",

  // Audio Settings
  AUDIO_SETTINGS: {
    sampleRate: 16000,
    channels: 1,
  },

  // Voice Activity Detection
  VAD_CONFIG: {
    positiveSpeechThreshold: 0.8,
    negativeSpeechThreshold: 0.5,
    preSpeechPadFrames: 10,
    redemptionFrames: 8,
    frameSamples: 512,
    minSpeechFrames: 3,
  },

  // Session Settings
  SESSION_DURATION: 1800, // 30 minutes in seconds
  IDLE_TIMEOUT: 15000, // 15 seconds in milliseconds
  MIN_SPEECH_DURATION_MS: 250, // Minimum speech duration to process

  // Text Processing
  SENTENCE_SPLIT_REGEX: /(?<=[.!?])\s+(?=[A-Z])/,

  // Code Editor Settings
  CODE_EDITOR: {
    defaultLanguage: "python",
    supportedLanguages: ["python", "c"],
    theme: "vs-dark",
    fontSize: 14,
    tabSize: 4,
    autoSave: true,
    autoSaveDelay: 1000, // ms
  },

  // Code Execution
  CODE_EXECUTION: {
    timeout: 10000, // 10 seconds
    maxOutputLength: 5000, // characters
  },

  // UI Settings
  UI: {
    animationDuration: 300, // ms
    orbPulseSpeed: 1.5,
    maxTranscriptHeight: 300, // px
    codeEditorMinHeight: 400, // px
  },
};

export default CONFIG;
