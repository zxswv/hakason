"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
} from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Mic, MicOff, SendHorizontalIcon, X, Loader2 } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";

interface Props {
  /** TextBox を閉じるコールバック */
  onClose: () => void;
  /** 送信ボタンを押したときのコールバック（認識テキストを渡す） */
  onSubmit: (text: string) => void;
}

type RecordingState = "idle" | "recording" | "processing";

export default function TextBox({ onClose, onSubmit }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // マウント後に自動録音開始
  useEffect(() => {
    if (isMounted) {
      // 少し遅らせてUIが描画されてから開始
      const timer = setTimeout(() => {
        startRecording();
      }, 400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  // アンマウント時にストリームを解放
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  /** 録音開始 */
  const startRecording = useCallback(async () => {
    try {
      setError("");
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // WEBM_OPUSで録音（route.tsのAPIに合わせる）
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg;codecs=opus";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100); // 100msごとにデータを収集
      setRecordingState("recording");
    } catch (err: any) {
      const msgs: Record<string, string> = {
        NotAllowedError: "❌ マイクのアクセスが拒否されました。ブラウザの設定でマイクを許可してください。",
        NotFoundError: "❌ マイクが見つかりません。接続を確認してください。",
        NotSupportedError: "❌ この環境ではマイクが利用できません。",
      };
      setError(msgs[err.name] ?? `❌ エラー: ${err.message ?? err.name}`);
      setRecordingState("idle");
    }
  }, []);

  /** 録音停止 → Google Cloud Speech-to-Text APIへ送信 */
  const stopRecordingAndTranscribe = useCallback(async () => {
    if (!mediaRecorderRef.current || recordingState !== "recording") return;

    setRecordingState("processing");

    // 録音停止してデータを収集
    await new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current!;
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    stopStream();

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm;codecs=opus" });

      // BlobをBase64に変換
      const base64Audio = await blobToBase64(audioBlob);

      // route.ts へ送信
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64Audio }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "音声認識に失敗しました");
      }

      // Google Speech APIのレスポンスから文字起こし結果を取得
      const results = data.results as any[] | undefined;
      if (results && results.length > 0) {
        const text = results
          .map((r: any) => r.alternatives?.[0]?.transcript ?? "")
          .join("");
        setTranscript(text);
        setError("");
      } else {
        setError("⚠️ 音声が認識されませんでした。もう一度お試しください。");
      }
    } catch (err: any) {
      setError(`❌ 音声認識エラー: ${err.message}`);
    } finally {
      setRecordingState("idle");
    }
  }, [recordingState]);

  /** マイクボタンのトグル */
  const toggleMic = useCallback(() => {
    if (recordingState === "recording") {
      stopRecordingAndTranscribe();
    } else if (recordingState === "idle") {
      startRecording();
    }
    // processing中はボタン無効
  }, [recordingState, startRecording, stopRecordingAndTranscribe]);

  /** 閉じる */
  const handleClose = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.stop();
    }
    stopStream();
    onClose();
  };

  /** 送信 */
  const handleSubmit = () => {
    const text = transcript.trim();
    if (!text) return;
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.stop();
    }
    stopStream();
    onSubmit(text);
  };

  if (!isMounted) return null;

  const isRecording = recordingState === "recording";
  const isProcessing = recordingState === "processing";

  return (
    <div className="fixed bottom-28 left-1/2 w-full max-w-2xl -translate-x-1/2 px-4 z-50 animate-in slide-in-from-bottom-4 duration-200">
      <TooltipProvider>
        <div className="flex flex-col gap-2">

          {/* エラー表示 */}
          {error && (
            <div className="px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* 録音中インジケーター */}
          {isRecording && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-sm text-teal-700 w-fit">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              録音中… マイクボタンで停止
            </div>
          )}

          {/* 処理中インジケーター */}
          {isProcessing && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700 w-fit">
              <Loader2 className="w-4 h-4 animate-spin" />
              音声を認識中…
            </div>
          )}

          {/* テキストボックス本体 */}
          <InputGroup className="bg-background shadow-2xl rounded-3xl border-2 overflow-hidden items-end flex pr-2">

            <TextareaAutosize
              minRows={1}
              maxRows={5}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={
                isRecording
                  ? "🎤 録音中… マイクボタンを押して停止"
                  : isProcessing
                  ? "⏳ 音声を認識中…"
                  : "音声入力または直接入力してください"
              }
              className="flex-1 !text-base border-none focus:ring-0 resize-none py-4 px-4 bg-transparent outline-none leading-tight"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />

            {/* 右側アクション */}
            <div className="flex items-center gap-1 mb-2">

              {/* マイク ON/OFF ボタン */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleMic}
                    disabled={isProcessing}
                    className={`p-2 rounded-full transition-colors ${
                      isRecording
                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                        : isProcessing
                        ? "bg-blue-100 text-blue-600 cursor-wait"
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {isProcessing ? "認識中…" : isRecording ? "録音停止（APIへ送信）" : "録音開始"}
                </TooltipContent>
              </Tooltip>

              {/* 送信ボタン */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    onClick={handleSubmit}
                    disabled={!transcript.trim() || isProcessing}
                    className="h-10 w-10 shrink-0 rounded-full bg-teal-500 hover:bg-teal-600 text-white disabled:opacity-40"
                  >
                    <SendHorizontalIcon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>予定として送信</TooltipContent>
              </Tooltip>

              {/* 閉じるボタン */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>閉じる</TooltipContent>
              </Tooltip>

            </div>
          </InputGroup>

        </div>
      </TooltipProvider>
    </div>
  );
}

/** Blob → Base64文字列（先頭のdata:...部分を除去） */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // "data:audio/webm;base64,XXXX" → "XXXX" だけ返す
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
