"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type VoiceState = "idle" | "listening" | "processing" | "error";

interface UseVoiceRecognitionReturn {
  state: VoiceState;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  error: string;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export function useVoiceRecognition(): UseVoiceRecognitionReturn {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState("");

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasWebSpeech =
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
    const hasMedia =
      navigator?.mediaDevices?.getUserMedia !== undefined;
    setIsSupported(hasWebSpeech && hasMedia);

    if (!hasWebSpeech) return;

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "ja-JP";

    rec.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const part = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += part;
        else interim += part;
      }
      if (final) setTranscript((prev) => prev + final);
      setInterimTranscript(interim);
      setError("");
    };

    rec.onerror = (event: any) => {
      if (event.error === "aborted") return;
      if (event.error === "no-speech") {
        setError("音声が検出されませんでした。もう一度お試しください。");
        setTimeout(() => setError(""), 3000);
        return;
      }
      const msgs: Record<string, string> = {
        "not-allowed": "マイクへのアクセスが拒否されました。ブラウザの設定で許可してください。",
        "audio-capture": "マイクが見つかりません。接続を確認してください。",
        network: "ネットワークエラーが発生しました。",
      };
      setError(msgs[event.error] ?? `音声認識エラー: ${event.error}`);
      setState("error");
      isListeningRef.current = false;
    };

    rec.onend = () => {
      if (isListeningRef.current) {
        try { rec.start(); } catch (_) {}
      } else {
        setState("idle");
      }
    };

    recognitionRef.current = rec;
    return () => {
      try { rec.stop(); } catch (_) {}
    };
  }, []);

  const start = useCallback(async () => {
    if (!recognitionRef.current) return;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setTranscript("");
      setInterimTranscript("");
      setError("");
      isListeningRef.current = true;
      setState("listening");
      recognitionRef.current.start();
    } catch (err: any) {
      const msgs: Record<string, string> = {
        NotAllowedError: "マイクの許可が必要です。ブラウザのアドレスバーで許可してください。",
        NotFoundError: "マイクが見つかりません。",
        NotSupportedError: "HTTPS 環境でのみ利用可能です。",
      };
      setError(msgs[err.name] ?? `エラー: ${err.message}`);
      setState("error");
    }
  }, []);

  const stop = useCallback(() => {
    isListeningRef.current = false;
    try { recognitionRef.current?.stop(); } catch (_) {}
    setState("idle");
    setInterimTranscript("");
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript("");
    setInterimTranscript("");
    setError("");
    setState("idle");
  }, [stop]);

  return { state, transcript, interimTranscript, isSupported, error, start, stop, reset };
}
