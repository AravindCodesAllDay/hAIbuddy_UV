import { useCallback, useRef, useState } from "react";
import CONFIG from "../config";

export default function useAudioPlayback(clearIdleTimer, processAudioQueue) {
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
          if (!isPlayingRef.current) {
            console.log("Audio was interrupted");
            return;
          }
          isPlayingRef.current = false;
          resolve();
        };
      });
    },
    [clearIdleTimer]
  );

  const playNextAudio = useCallback(async () => {
    // Resume interrupted audio first
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

    // Play next queued audio
    if (audioQueueRef.current.length === 0 || isPlayingRef.current) {
      return;
    }

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
