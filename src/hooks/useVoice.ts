"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface UseVoiceReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  isMounted: boolean;
  error: string;
  toggleListening: () => Promise<void>;
  clearTranscript: () => void;
  setTranscript: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * voice.tsx のロジックをそのままカスタムフックに抽出。
 * Web Speech API (webkitSpeechRecognition / SpeechRecognition) を使用。
 */
export function useVoice(): UseVoiceReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // isListening の最新値を参照するための ref（voice.tsx と同一パターン）
  const isListeningRef = useRef(isListening);
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === "undefined") return;

    const hasWebSpeech =
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
    const hasMediaDevices =
      navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

    if (!hasWebSpeech) {
      setError("お使いのブラウザは音声認識に対応していません。Chrome / Edge / Safari をお試しください。");
      return;
    }
    if (!hasMediaDevices) {
      setError("マイクアクセスに対応していません。HTTPS 環境でアクセスしてください。");
      return;
    }

    setIsSupported(true);

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.lang            = "ja-JP";

    rec.onresult = (event: any) => {
      let interim = "";
      let final   = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const part = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += part;
        else interim += part;
      }
      if (final) setTranscript((prev) => prev + final + " ");
      setInterimTranscript(interim);
      setError("");
    };

    rec.onerror = (event: any) => {
      if (event.error === "aborted") return;
      const msgs: Record<string, string> = {
        "not-allowed":   "❌ マイクのアクセスが拒否されました。ブラウザの設定でマイクを許可してください。",
        "no-speech":     "⚠️ 音声が検出されませんでした。",
        "audio-capture": "❌ マイクが見つかりません。接続を確認してください。",
        "network":       "❌ ネットワークエラーが発生しました。",
      };
      setError(msgs[event.error] ?? `❌ エラー: ${event.error}`);
      if (event.error === "no-speech") {
        setTimeout(() => setError(""), 3000);
      } else {
        setIsListening(false);
      }
    };

    rec.onend = () => {
      // isListeningRef で最新状態を確認し、true なら自動再起動（voice.tsx と同一）
      if (isListeningRef.current) {
        try { rec.start(); } catch (e: any) {
          if (!e.message?.includes("already started")) {
            setIsListening(false);
            setError("音声認識の再起動に失敗しました");
          }
        }
      }
    };

    setRecognition(rec);
    return () => { try { rec.stop(); } catch (_) {} };
  }, []);

  const toggleListening = useCallback(async () => {
    if (!recognition) {
      setError("音声認識が初期化されていません。ページをリロードしてください。");
      return;
    }

    if (isListening) {
      // ── 停止
      try { recognition.stop(); } catch (_) {}
      setIsListening(false);
      setInterimTranscript("");
    } else {
      // ── 開始
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          setError("❌ HTTPS 環境でのみマイクが利用できます。");
          return;
        }
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognition.start();
        setIsListening(true);
        setError("");
      } catch (err: any) {
        if (err.message?.includes("already started")) {
          setIsListening(true);
          return;
        }
        const msgs: Record<string, string> = {
          NotAllowedError:     "❌ マイクのアクセスが拒否されました。ブラウザのアドレスバー左側から「マイク」を許可してください。",
          NotFoundError:       "❌ マイクが見つかりません。接続を確認してください。",
          NotSupportedError:   "❌ HTTPS 環境でのみ利用可能です。",
        };
        setError(msgs[err.name] ?? `❌ エラー: ${err.message ?? err.name}`);
      }
    }
  }, [recognition, isListening]);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError("");
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    isMounted,
    error,
    toggleListening,
    clearTranscript,
    setTranscript,
  };
}
