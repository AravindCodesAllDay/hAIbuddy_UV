import { useState, useRef, useEffect, useCallback } from "react";
import useVAD from "./hooks/useVAD";
import AudioOrb from "./AudioOrb";
import CONFIG from "./config";
import audioBufferToBase64 from "./utils/audioBufferToBase64";

// Custom hooks from previous refactor
function useAudioPlayback(clearIdleTimer, processAudioQueue) {
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef({ node: null, startTime: 0, buffer: null });
  const interruptedAudioRef = useRef(null);
  const isPlayingRef = useRef(false);
  const audioQueueRef = useRef([]);
  const pendingAudioRef = useRef({});
  const nextAudioIndexRef = useRef(0);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);

  const stopCurrentAudio = useCallback(() => {
    if (audioSourceRef.current.node) {
      const playbackTime =
        audioContextRef.current.currentTime - audioSourceRef.current.startTime;
      if (
        playbackTime > 0 &&
        playbackTime < audioSourceRef.current.buffer.duration
      ) {
        interruptedAudioRef.current = {
          buffer: audioSourceRef.current.buffer,
          offset: playbackTime,
        };
      }
      audioSourceRef.current.node.stop();
      audioSourceRef.current.node.disconnect();
      audioSourceRef.current.node = null;
      isPlayingRef.current = false;
      setIsAssistantSpeaking(false);
    }
  }, []);

  const playAudio = useCallback(
    async (buffer, offset = 0) => {
      isPlayingRef.current = true;
      setIsAssistantSpeaking(true);
      clearIdleTimer();

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)({
          sampleRate: CONFIG.AUDIO_SETTINGS.sampleRate,
        });
      }

      if (audioSourceRef.current.node) {
        audioSourceRef.current.node.disconnect();
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start(0, offset);

      audioSourceRef.current = {
        node: source,
        startTime: audioContextRef.current.currentTime - offset,
        buffer: buffer,
      };

      return new Promise((resolve) => {
        source.onended = () => {
          if (!isPlayingRef.current) return;
          isPlayingRef.current = false;
          resolve();
        };
      });
    },
    [clearIdleTimer]
  );

  const playNextAudio = useCallback(async () => {
    if (interruptedAudioRef.current) {
      const { buffer, offset } = interruptedAudioRef.current;
      interruptedAudioRef.current = null;
      if (offset < buffer.duration) {
        try {
          await playAudio(buffer, offset);
          audioQueueRef.current.shift();
          processAudioQueue();
        } catch (error) {
          console.error("Audio resume error:", error);
          setIsAssistantSpeaking(false);
          processAudioQueue();
        }
      }
      return;
    }

    if (audioQueueRef.current.length === 0 || isPlayingRef.current) return;

    const base64Wav = audioQueueRef.current[0];
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)({
          sampleRate: CONFIG.AUDIO_SETTINGS.sampleRate,
        });
      }
      const audioData = atob(base64Wav.split(",")[1]);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      const audioBuffer = await audioContextRef.current.decodeAudioData(
        arrayBuffer
      );
      await playAudio(audioBuffer, 0);
      audioQueueRef.current.shift();
      processAudioQueue();
    } catch (error) {
      console.error("Audio playback error:", error);
      isPlayingRef.current = false;
      setIsAssistantSpeaking(false);
      audioQueueRef.current.shift();
      processAudioQueue();
    }
  }, [playAudio, processAudioQueue]);

  const clearQueues = useCallback(() => {
    interruptedAudioRef.current = null;
    audioQueueRef.current = [];
    pendingAudioRef.current = {};
    nextAudioIndexRef.current = 0;
  }, []);

  return {
    isPlayingRef,
    isAssistantSpeaking,
    audioQueueRef,
    pendingAudioRef,
    nextAudioIndexRef,
    interruptedAudioRef,
    stopCurrentAudio,
    playNextAudio,
    clearQueues,
  };
}

function useIdleTimer(onIdle, timeout = CONFIG.IDLE_TIMEOUT) {
  const timerRef = useRef(null);
  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  const start = useCallback(() => {
    clear();
    timerRef.current = setTimeout(onIdle, timeout);
  }, [clear, onIdle, timeout]);
  useEffect(() => clear, [clear]);
  return { start, clear };
}

function useCountdownTimer() {
  const [remainingTime, setRemainingTime] = useState(null);
  const intervalRef = useRef(null);
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (remainingTime !== null && remainingTime > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [remainingTime]);
  return [remainingTime, setRemainingTime];
}

// Simple Monaco-like Code Editor Component
function CodeEditor({ language, value, onChange }) {
  const [code, setCode] = useState(value || "");

  useEffect(() => {
    setCode(value || "");
  }, [value]);

  const handleChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    if (onChange) onChange(newCode);
  };

  return (
    <div className="w-full h-full bg-neutral-900 rounded-lg overflow-hidden">
      <div className="bg-neutral-800 px-4 py-2 text-sm text-gray-400 border-b border-neutral-700">
        {language === "python" ? "Python 3" : "C (GCC)"}
      </div>
      <textarea
        value={code}
        onChange={handleChange}
        className="w-full h-full bg-neutral-900 text-gray-100 p-4 font-mono text-sm resize-none focus:outline-none"
        spellCheck="false"
        placeholder={`// Write your ${language} code here...`}
      />
    </div>
  );
}

export default function VoiceInterviewWithCodeEditor() {
  const sessionId = new URLSearchParams(window.location.search).get(
    "session_id"
  );

  const [status, setStatus] = useState("⚡ Connecting...");
  const [userText, setUserText] = useState("");
  const [assistantResponse, setAssistantResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  // Code editor state
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [codeOutput, setCodeOutput] = useState("");
  const [isRunningCode, setIsRunningCode] = useState(false);

  const isProcessingRef = useRef(isProcessing);
  const userIsSpeakingRef = useRef(false);
  const ttsRequestIndexRef = useRef(0);
  const unprocessedTtsTextRef = useRef("");
  const wsRef = useRef(null);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const [remainingTime, setRemainingTime] = useCountdownTimer();

  const handleIdleTimeout = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
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

  const onSpeechStart = useCallback(() => {
    idleTimer.clear();
    userIsSpeakingRef.current = true;
    setIsUserSpeaking(true);
    setStatus("🎙️ Speaking...");
    if (isPlayingRef.current) {
      stopCurrentAudio();
    } else {
      interruptedAudioRef.current = null;
    }
  }, [idleTimer, isPlayingRef, stopCurrentAudio, interruptedAudioRef]);

  const onSpeechEnd = useCallback(
    async (audio) => {
      const audioDurationMs =
        (audio.length / CONFIG.AUDIO_SETTINGS.sampleRate) * 1000;
      idleTimer.clear();
      userIsSpeakingRef.current = false;
      setIsUserSpeaking(false);
      if (isProcessingRef.current) return;

      if (audioDurationMs < (CONFIG.MIN_SPEECH_DURATION_MS || 250)) {
        processAudioQueue();
        if (
          !interruptedAudioRef.current &&
          audioQueueRef.current.length === 0
        ) {
          setStatus("👂 Listening...");
          idleTimer.start();
        }
        return;
      }

      clearQueues();
      unprocessedTtsTextRef.current = "";
      setStatus("⏳ Sending to server...");
      setIsProcessing(true);
      setUserText("...");
      setAssistantResponse("");
      ttsRequestIndexRef.current = 0;

      const base64Audio = audioBufferToBase64(audio);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ type: "user_audio", audio: base64Audio })
        );
      }
    },
    [
      idleTimer,
      processAudioQueue,
      clearQueues,
      interruptedAudioRef,
      audioQueueRef,
    ]
  );

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

  // Code execution handler
  const handleRunCode = async () => {
    setIsRunningCode(true);
    setCodeOutput("Running code...");

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "code_execution",
          language,
          code,
        })
      );
    }
  };

  const handleSubmitCode = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "code_submission",
          language,
          code,
        })
      );
      setStatus("📝 Code submitted for review");
    }
  };

  const handleWebSocketMessage = useCallback(
    (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "timer_update":
          setRemainingTime(data.remaining_seconds);
          break;

        case "timer_warning":
          setStatus("⚠️ " + data.message);
          break;

        case "session_complete":
          setStatus("✅ Session Complete");
          alert(data.message);
          stop();
          idleTimer.clear();
          setRemainingTime(null);
          break;

        case "transcription":
          setUserText(data.user_text);
          break;

        case "code_challenge":
          setShowCodeEditor(true);
          setLanguage(data.language || "python");
          setCode(data.starter_code || "");
          setAssistantResponse(data.problem_statement || "");
          break;

        case "code_output":
          setCodeOutput(data.output || "");
          setIsRunningCode(false);
          break;

        case "code_feedback":
          setAssistantResponse(data.feedback || "");
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
          if (userIsSpeakingRef.current) break;
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Authentication token not found");
      return;
    }

    wsRef.current = new WebSocket(
      `${CONFIG.WEBSOCKET_URL}/${sessionId}/message/${token}`
    );

    wsRef.current.onopen = () => {
      setStatus("👂 Listening...");
      start();
    };

    wsRef.current.onmessage = handleWebSocketMessage;

    wsRef.current.onclose = () => {
      stop();
      idleTimer.clear();
      setStatus("🔌 Disconnected. Reconnecting...");
      setTimeout(() => window.location.reload(), 3000);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      stop();
      idleTimer.clear();
    };
  }, [sessionId, handleWebSocketMessage, start, stop, idleTimer]);

  const formatTime = (seconds) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="font-sans w-full min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 gap-4">
      {/* Left Panel - Voice Interface */}
      <div className="flex-1 flex flex-col justify-center items-center p-6">
        <AudioOrb
          status={status}
          isUserSpeaking={isUserSpeaking}
          isAssistantSpeaking={isAssistantSpeaking}
          audioLevel={isUserSpeaking ? 0.7 : isAssistantSpeaking ? 0.5 : 0}
        />

        {remainingTime !== null && (
          <div className="mb-4 text-center">
            <p className="text-3xl font-bold text-blue-400">
              {formatTime(remainingTime)}
            </p>
            <p className="text-sm text-gray-400">Time Remaining</p>
          </div>
        )}

        <p className="text-center text-xl text-gray-300 mb-8">{status}</p>

        <div className="w-full max-w-xl space-y-4">
          <div className="p-4 border border-green-600/50 rounded-xl bg-green-900/20 backdrop-blur-sm shadow-lg min-h-[4rem]">
            <h2 className="text-sm font-semibold mb-2 text-green-300">
              You Said:
            </h2>
            <p className="text-base text-gray-100">{userText || "..."}</p>
          </div>

          <div className="p-4 border border-purple-600/50 rounded-xl bg-purple-900/20 backdrop-blur-sm shadow-lg min-h-[6rem] max-h-[300px] overflow-y-auto">
            <h2 className="text-sm font-semibold mb-2 text-purple-300">
              Assistant:
            </h2>
            <p className="text-base text-gray-100 whitespace-pre-wrap">
              {assistantResponse || "..."}
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Code Editor */}
      {showCodeEditor && (
        <div className="flex-1 flex flex-col p-4 bg-neutral-900/50 backdrop-blur-sm rounded-2xl border border-neutral-700 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-blue-400">Code Challenge</h2>
            <div className="flex gap-2 items-center">
              <select
                className="bg-neutral-800 text-white rounded-lg px-3 py-2 border border-neutral-600 focus:border-blue-500 focus:outline-none"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="python">Python</option>
                <option value="c">C</option>
              </select>
              <button
                className="px-4 py-2 rounded-lg border border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50"
                onClick={handleRunCode}
                disabled={isRunningCode}
              >
                {isRunningCode ? "Running..." : "▶ Run"}
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors font-medium"
                onClick={handleSubmitCode}
              >
                Submit
              </button>
            </div>
          </div>

          <div className="flex-1 mb-4">
            <CodeEditor language={language} value={code} onChange={setCode} />
          </div>

          {codeOutput && (
            <div className="bg-neutral-950 border border-neutral-700 rounded-lg p-4 max-h-[200px] overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">
                Output:
              </h3>
              <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                {codeOutput}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
