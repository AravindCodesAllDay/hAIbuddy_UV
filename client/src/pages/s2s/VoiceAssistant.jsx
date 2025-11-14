import { useState, useRef, useEffect, useCallback } from "react";
import useVAD from "./hooks/useVAD";
import AudioOrb from "./AudioOrb";
import CONFIG from "./config";
import blobToBase64 from "./utils/blobToBase64";
import useWebSocket from "./hooks/useWebSocket";
import useAudioPlayback from "./hooks/useAudioPlayback";
import useIdleTimer from "./hooks/useIdleTimer";
import useCountdownTimer from "./hooks/useCountdownTimer";

export default function VoiceAssistant() {
  const sessionId = new URLSearchParams(window.location.search).get(
    "session_id"
  );

  const [status, setStatus] = useState("⚡ Connecting...");
  const [userText, setUserText] = useState("");
  const [assistantResponse, setAssistantResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  const isProcessingRef = useRef(isProcessing);
  const userIsSpeakingRef = useRef(false);
  const ttsRequestIndexRef = useRef(0);
  const unprocessedTtsTextRef = useRef("");
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const [remainingTime, setRemainingTime] = useCountdownTimer();

  const handleIdleTimeout = useCallback(() => {
    console.log(`User idle for ${CONFIG.IDLE_TIMEOUT}ms. Sending nudge.`);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "user_idle" }));
      setStatus("🤔 Thinking...");
      setIsProcessing(true);
    }
  }, []);

  const idleTimer = useIdleTimer(handleIdleTimeout);

  const processAudioQueue = useCallback(() => {
    while (pendingAudioRef.current[nextAudioIndexRef.current]) {
      const audioData = pendingAudioRef.current[nextAudioIndexRef.current];
      delete pendingAudioRef.current[nextAudioIndexRef.current];
      audioQueueRef.current.push(audioData);
      nextAudioIndexRef.current++;
    }

    if (
      !isPlayingRef.current &&
      (audioQueueRef.current.length > 0 || interruptedAudioRef.current)
    ) {
      playNextAudioRef.current?.();
    } else if (
      !isPlayingRef.current &&
      audioQueueRef.current.length === 0 &&
      !interruptedAudioRef.current
    ) {
      if (!userIsSpeakingRef.current && !isProcessingRef.current) {
        setStatus("👂 Listening...");
        idleTimer.start();
      }
    }
  }, [idleTimer]);

  const {
    isPlayingRef,
    isAssistantSpeaking,
    audioQueueRef,
    pendingAudioRef,
    nextAudioIndexRef,
    interruptedAudioRef,
    stopCurrentAudio,
    playNextAudio,
    clearQueues,
  } = useAudioPlayback(idleTimer.clear, processAudioQueue);

  const sendWsJson = (data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  const onSpeechStart = useCallback(() => {
    idleTimer.clear();
    userIsSpeakingRef.current = true;
    setIsUserSpeaking(true);
    setStatus("🎙️ Speaking...");

    // Stop any playing audio
    if (isPlayingRef.current) {
      console.log("User interrupted assistant.");
      stopCurrentAudio();
    } else {
      interruptedAudioRef.current = null;
    }

    // Clear any pending TTS and old content
    clearQueues();
    unprocessedTtsTextRef.current = "";
    ttsRequestIndexRef.current = 0; // CRITICAL: Reset TTS index for new turn
    setAssistantResponse("");
    setUserText("");

    sendWsJson({ type: "start_speech_stream" });

    // Start recording
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;

      recorder.addEventListener("dataavailable", async (event) => {
        if (event.data.size > 0) {
          const base64Audio = await blobToBase64(event.data);
          sendWsJson({ type: "audio_chunk", audio: base64Audio });
        }
      });

      // Send data in 500ms chunks
      recorder.start(500);
    });
  }, [
    idleTimer,
    isPlayingRef,
    stopCurrentAudio,
    interruptedAudioRef,
    clearQueues,
  ]);

  const onSpeechEnd = useCallback(async () => {
    idleTimer.clear();
    userIsSpeakingRef.current = false;
    setIsUserSpeaking(false);

    if (isProcessingRef.current) return;

    // Stop recording
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    sendWsJson({ type: "end_speech_stream" });

    // Stop the mic tracks
    mediaRecorderRef.current?.stream
      .getTracks()
      .forEach((track) => track.stop());
    mediaRecorderRef.current = null;

    setStatus("🤔 Thinking...");
    setIsProcessing(true);
  }, [idleTimer, isProcessingRef]);

  const onVadIdle = useCallback(() => {
    if (
      !isProcessingRef.current &&
      !isPlayingRef.current &&
      !userIsSpeakingRef.current
    ) {
      setStatus("👂 Listening...");
    }
  }, [isPlayingRef]);

  const { start, stop } = useVAD(onSpeechStart, onSpeechEnd, onVadIdle);

  const playNextAudioRef = useRef(playNextAudio);
  useEffect(() => {
    playNextAudioRef.current = playNextAudio;
  }, [playNextAudio]);

  const handleWebSocketMessage = useCallback(
    (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "timer_update":
          setRemainingTime(data.remaining_seconds);
          break;

        case "timer_warning":
          console.warn(data.message);
          setStatus("⚠️ " + data.message);
          break;

        case "session_complete":
          setStatus("✅ Session Complete");
          alert(data.message);
          stop();
          idleTimer.clear();
          setRemainingTime(null);
          break;

        case "partial_transcription":
          setUserText(data.user_text);
          break;

        case "transcription":
          setUserText(data.user_text);
          break;

        case "llm_token": {
          idleTimer.clear();
          setStatus("💭 Generating response...");
          setIsProcessing(true);

          const token = data.token;
          setAssistantResponse((prev) => prev + token);
          unprocessedTtsTextRef.current += token;

          const sentences = unprocessedTtsTextRef.current.split(
            CONFIG.SENTENCE_SPLIT_REGEX
          );
          const lastItem = sentences.pop() || "";

          for (const sentence of sentences) {
            const text = sentence.trim();
            if (
              text &&
              /[a-zA-Z0-9]/.test(text) &&
              wsRef.current?.readyState === WebSocket.OPEN
            ) {
              wsRef.current.send(
                JSON.stringify({
                  type: "tts_request",
                  sentence: text,
                  index: ttsRequestIndexRef.current,
                })
              );
              ttsRequestIndexRef.current++;
            }
          }
          unprocessedTtsTextRef.current = lastItem.trimStart();
          break;
        }

        case "llm_end": {
          setIsProcessing(false);

          const remainder = unprocessedTtsTextRef.current.trim();
          if (
            remainder &&
            /[a-zA-Z0-9]/.test(remainder) &&
            wsRef.current?.readyState === WebSocket.OPEN
          ) {
            wsRef.current.send(
              JSON.stringify({
                type: "tts_request",
                sentence: remainder,
                index: ttsRequestIndexRef.current,
              })
            );
            ttsRequestIndexRef.current++;
          }
          unprocessedTtsTextRef.current = "";

          if (
            !isPlayingRef.current &&
            audioQueueRef.current.length === 0 &&
            !interruptedAudioRef.current
          ) {
            setStatus("👂 Listening...");
            idleTimer.start();
          }
          break;
        }

        case "tts_audio_chunk":
          // Removed redundant userIsSpeakingRef check - audio is already cancelled on speech start
          pendingAudioRef.current[data.index] = data.audio;
          processAudioQueue();
          break;

        case "error":
          setStatus(`Error: ${data.message}`);
          setIsProcessing(false);
          idleTimer.clear();
          break;

        case "cancelled":
          setIsProcessing(false);
          setStatus("👂 Listening...");
          unprocessedTtsTextRef.current = "";
          idleTimer.clear();
          idleTimer.start();
          break;

        default:
          console.log("Unknown message type:", data.type);
      }
    },
    [
      setRemainingTime,
      stop,
      idleTimer,
      processAudioQueue,
      isPlayingRef,
      audioQueueRef,
      interruptedAudioRef,
      pendingAudioRef,
    ]
  );

  const wsRef = useWebSocket(sessionId, {
    onOpen: () => {
      console.log("WebSocket connected. Starting VAD.");
      setStatus("👂 Listening...");
      start();
    },
    onMessage: handleWebSocketMessage,
    onClose: () => {
      stop();
      idleTimer.clear();
      setStatus("🔌 Disconnected. Reconnecting...");
    },
    onError: () => {
      stop();
      idleTimer.clear();
      setStatus("Error. Check console. Reconnecting...");
    },
    onCleanup: () => {
      stop();
      idleTimer.clear();
    },
  });

  const formatTime = (seconds) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="font-sans w-full min-h-screen flex flex-col justify-center items-center text-white p-6">
      <AudioOrb
        status={status}
        isUserSpeaking={isUserSpeaking}
        isAssistantSpeaking={isAssistantSpeaking}
        audioLevel={isUserSpeaking ? 0.7 : isAssistantSpeaking ? 0.5 : 0}
      />

      {remainingTime !== null && (
        <div className="mb-4 text-center">
          <p className="text-2xl font-bold text-blue-400">
            {formatTime(remainingTime)}
          </p>
          <p className="text-sm text-gray-400">Time Remaining</p>
        </div>
      )}

      <p className="text-center text-xl text-gray-400 mb-8">{status}</p>

      <div className="w-full max-w-2xl space-y-4">
        <div className="p-4 border border-green-700 rounded-lg bg-white/10 shadow-lg min-h-24 transition-all duration-300">
          <h2 className="text-lg font-semibold mb-1 text-green-300">
            You Said:
          </h2>
          <p className="text-lg text-gray-100 mt-1">{userText || "..."}</p>
        </div>

        <div className="p-4 border border-purple-700 rounded-lg bg-white/10 shadow-lg min-h-24 transition-all duration-300">
          <h2 className="text-lg font-semibold mb-1 text-purple-300">
            Assistant:
          </h2>
          <p className="text-lg text-gray-100 mt-1">
            {assistantResponse || "..."}
          </p>
        </div>
      </div>
    </div>
  );
}
