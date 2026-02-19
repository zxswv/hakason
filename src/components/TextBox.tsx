"use client";

import { useEffect } from "react";
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
import { Mic, MicOff, SendHorizontalIcon, X } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { useVoice } from "@/hooks/useVoice";

interface Props {
  /** TextBox を閉じるコールバック */
  onClose: () => void;
  /** 送信ボタンを押したときのコールバック（認識テキストを渡す） */
  onSubmit: (text: string) => void;
}

export default function TextBox({ onClose, onSubmit }: Props) {
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    isMounted,
    error,
    toggleListening,
    clearTranscript,
    setTranscript,
  } = useVoice();

  // マウント時に自動で録音開始
  useEffect(() => {
    if (isMounted && isSupported) {
      // 少し遅らせてマイク許可ダイアログとの競合を避ける
      const timer = setTimeout(() => {
        toggleListening();
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, isSupported]);

  // 閉じるときに録音を止める
  const handleClose = () => {
    if (isListening) toggleListening();
    clearTranscript();
    onClose();
  };

  // 送信
  const handleSubmit = () => {
    const text = (transcript + interimTranscript).trim();
    if (!text) return;
    if (isListening) toggleListening(); // 録音停止
    onSubmit(text);
    clearTranscript();
  };

  // テキストエリアで直接編集もできるよう setTranscript を使用
  const displayText = transcript;
  const placeholderText = isListening
    ? "🎤 聞いています…話しかけてください"
    : "音声入力または直接入力してください";

  if (!isMounted) return null;

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
          {isListening && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-sm text-teal-700 w-fit">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              録音中…
              {interimTranscript && (
                <span className="text-blue-500 italic">{interimTranscript}</span>
              )}
            </div>
          )}

          {/* テキストボックス本体 */}
          <InputGroup className="bg-background shadow-2xl rounded-3xl border-2 overflow-hidden items-end flex pr-2">

            <TextareaAutosize
              minRows={1}
              maxRows={5}
              value={displayText}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={placeholderText}
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
                    onClick={toggleListening}
                    disabled={!isSupported}
                    className={`p-2 rounded-full transition-colors ${
                      isListening
                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {isListening
                      ? <MicOff className="h-5 w-5" />
                      : <Mic className="h-5 w-5" />
                    }
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {isListening ? "録音停止" : "録音開始"}
                </TooltipContent>
              </Tooltip>

              {/* 送信ボタン */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    onClick={handleSubmit}
                    disabled={!displayText.trim() && !interimTranscript.trim()}
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
