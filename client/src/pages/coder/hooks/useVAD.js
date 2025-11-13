import { useRef } from "react";
import { MicVAD } from "@ricky0123/vad-web";
import CONFIG from "../config";

export default function useVAD(onSpeechStart, onSpeechEnd, onVadIdle) {
  const vadRef = useRef(null);
  const streamRef = useRef(null);
  const isActiveRef = useRef(false);

  const start = async () => {
    if (isActiveRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: CONFIG.AUDIO_SETTINGS,
    });
    streamRef.current = stream;

    const vad = await MicVAD.new({
      stream,
      onSpeechStart,
      onSpeechEnd,
      onVADStopped: onVadIdle,
      ...CONFIG.VAD_SETTINGS,
      sampleRate: CONFIG.AUDIO_SETTINGS.sampleRate,
    });

    vadRef.current = vad;
    vad.start();
    isActiveRef.current = true;
  };

  const stop = () => {
    if (!isActiveRef.current) return;
    vadRef.current?.destroy();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    vadRef.current = null;
    streamRef.current = null;
    isActiveRef.current = false;
  };

  return { start, stop, vadRef, streamRef, isActiveRef };
}
