"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // isListeningの最新の値を参照するためのref
  const isListeningRef = useRef(isListening);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    setIsMounted(true);

    // ブラウザ環境の確認
    if (typeof window === "undefined") return;

    // Web Speech APIのサポート確認
    const hasWebSpeech = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
    
    // MediaDevicesのサポート確認
    const hasMediaDevices = navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

    if (!hasWebSpeech) {
      setError("お使いのブラウザは音声認識に対応していません。Chrome、Edge、Safariをお試しください。");
      return;
    }

    if (!hasMediaDevices) {
      setError("お使いのブラウザはマイクアクセスに対応していません。または、HTTPSでアクセスする必要があります。");
      return;
    }

    setIsSupported(true);

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = "ja-JP";

    recognitionInstance.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcriptPart;
        } else {
          interim += transcriptPart;
        }
      }

      if (final) {
        setTranscript((prev) => prev + final + " ");
      }
      setInterimTranscript(interim);
      setError("");
    };

    recognitionInstance.onerror = (event: any) => {
      console.error("音声認識エラー:", event.error);
      
      switch (event.error) {
        case "aborted":
          // abortedエラーは通常の停止処理なので、エラー表示しない
          console.log("音声認識が中断されました");
          break;
        case "not-allowed":
          setError("❌ マイクのアクセスが拒否されました。ブラウザの設定でマイクを許可してください。");
          setIsListening(false);
          break;
        case "no-speech":
          setError("⚠️ 音声が検出されませんでした。");
          setTimeout(() => setError(""), 3000);
          break;
        case "audio-capture":
          setError("❌ マイクが見つかりません。マイクが接続されているか確認してください。");
          setIsListening(false);
          break;
        case "network":
          setError("❌ ネットワークエラーが発生しました。");
          setIsListening(false);
          break;
        default:
          setError(`❌ エラー: ${event.error}`);
          setIsListening(false);
      }
    };

    recognitionInstance.onend = () => {
      console.log("音声認識が終了しました");
      // refを使って最新のisListening状態を参照
      if (isListeningRef.current) {
        try {
          console.log("音声認識を再起動します");
          recognitionInstance.start();
        } catch (e: any) {
          console.error("再起動エラー:", e);
          // 既に起動中の場合は無視
          if (e.message && !e.message.includes("already started")) {
            setIsListening(false);
            setError("音声認識の再起動に失敗しました");
          }
        }
      }
    };

    setRecognition(recognitionInstance);

    // クリーンアップ
    return () => {
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch (e) {
          console.error("クリーンアップエラー:", e);
        }
      }
    };
  }, []); // 依存配列を空に

  const toggleListening = async () => {
    if (!isMounted) return;

    if (!recognition) {
      setError("音声認識が初期化されていません。ページをリロードしてください。");
      return;
    }

    if (isListening) {
      try {
        recognition.stop();
        setIsListening(false);
        setInterimTranscript("");
      } catch (e) {
        console.error("停止エラー:", e);
        setIsListening(false);
      }
    } else {
      try {
        // マイクアクセスの確認
        if (!navigator?.mediaDevices?.getUserMedia) {
          setError("❌ このブラウザまたは環境ではマイクアクセスがサポートされていません。HTTPSでアクセスしてください。");
          return;
        }

        // マイク許可を要求
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // 音声認識開始
        recognition.start();
        setIsListening(true);
        setError("");
      } catch (err: any) {
        console.error("マイクアクセスエラー:", err);
        
        // 既に起動中の場合
        if (err.message && err.message.includes("already started")) {
          console.log("音声認識は既に起動しています");
          setIsListening(true);
          return;
        }
        
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError("❌ マイクのアクセスが拒否されました。ブラウザのアドレスバー左側のアイコンから「マイク」を許可してください。");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setError("❌ マイクが見つかりません。マイクが接続されているか確認してください。");
        } else if (err.name === "NotSupportedError") {
          setError("❌ このブラウザではマイクアクセスがサポートされていません。HTTPS環境でアクセスしてください。");
        } else {
          setError(`❌ エラー: ${err.message || err.name}`);
        }
      }
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setInterimTranscript("");
    setError("");
  };

  const downloadTranscript = () => {
    if (!transcript) return;
    
    const element = document.createElement("a");
    const file = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `文字起こし_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // サーバーサイドレンダリング時は何も表示しない
  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-zinc-600 dark:text-zinc-400">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left w-full">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            リアルタイム文字起こし
          </h1>

          {/* システム情報 */}
          <div className="w-full p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>使用API:</strong> Web Speech API (ブラウザ標準・完全無料)
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
              <strong>対応状況:</strong> {isSupported ? "✅ 対応" : "❌ 非対応"}
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
              <strong>認識言語:</strong> 日本語
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
              <strong>現在のURL:</strong> {typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}` : ""}
            </p>
          </div>
          
          {/* エラー表示 */}
          {error && (
            <div className="w-full p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200 whitespace-pre-line">{error}</p>
              {error.includes("HTTPS") && (
                <div className="mt-3 text-xs text-red-700 dark:text-red-300">
                  <p className="font-semibold mb-1">💡 HTTPSで実行する方法:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Vercelなどにデプロイする（自動的にHTTPS）</li>
                    <li>または、localhostで実行する（Chromeではlocalhostが例外扱い）</li>
                  </ol>
                </div>
              )}
              {error.includes("not-allowed") && (
                <div className="mt-3 text-xs text-red-700 dark:text-red-300">
                  <p className="font-semibold mb-1">💡 解決方法:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>アドレスバー左側のアイコンをクリック</li>
                    <li>「マイク」を「許可」に変更</li>
                    <li>ページをリロード</li>
                  </ol>
                </div>
              )}
            </div>
          )}
          
          {/* 文字起こしコントロール */}
          <div className="w-full flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={toggleListening}
                disabled={!isSupported}
                className={`flex h-12 items-center justify-center gap-2 rounded-full px-6 font-medium transition-colors ${
                  !isSupported
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : isListening
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isListening ? "⏹ 停止" : "🎤 録音開始"}
              </button>
              
              <button
                onClick={clearTranscript}
                className="flex h-12 items-center justify-center gap-2 rounded-full border border-solid border-black/[.08] px-6 font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
              >
                🗑 クリア
              </button>

              <button
                onClick={downloadTranscript}
                disabled={!transcript}
                className="flex h-12 items-center justify-center gap-2 rounded-full border border-solid border-black/[.08] px-6 font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💾 ダウンロード
              </button>
            </div>

            {/* 認識状態表示 */}
            {isListening && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <span className="animate-pulse">●</span>
                録音中... リアルタイムで文字起こしされます
              </div>
            )}

            {/* 文字数カウント */}
            {transcript && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                文字数: {transcript.length}文字
              </div>
            )}

            {/* 文字起こし結果表示 */}
            <div className="w-full min-h-[200px] max-h-[400px] overflow-y-auto p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <p className="text-base leading-7 text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">
                {transcript}
                <span className="text-blue-500 dark:text-blue-400">
                  {interimTranscript}
                </span>
              </p>
              {!transcript && !interimTranscript && (
                <p className="text-zinc-400 dark:text-zinc-600">
                  録音ボタンを押して話してください。リアルタイムで文字起こしされます。
                </p>
              )}
            </div>
          </div>
          
          <div className="w-full p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-800 dark:text-green-200">
              ✅ <strong>完全無料:</strong> APIキー不要、設定不要で即座に使えます
            </p>
            <p className="text-xs text-green-800 dark:text-green-200 mt-1">
              ✅ <strong>リアルタイム:</strong> 話しながら即座に文字化されます
            </p>
            <p className="text-xs text-green-800 dark:text-green-200 mt-1">
              ✅ <strong>対応ブラウザ:</strong> Chrome、Edge、Safari (HTTPS環境推奨)
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-6 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}