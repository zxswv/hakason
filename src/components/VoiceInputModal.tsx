"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Mic, MicOff, Loader2, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { parseVoiceInput, ParsedVoiceEvent } from "@/lib/parseVoiceInput";
import { CalendarEvent } from "@/lib/types";
import { CALENDARS, COLOR_OPTIONS } from "@/lib/events";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddEvent: (event: CalendarEvent) => void;
}

type Step = "record" | "confirm";

export default function VoiceInputModal({ open, onOpenChange, onAddEvent }: Props) {
  const [step, setStep] = useState<Step>("record");
  const [parsed, setParsed] = useState<ParsedVoiceEvent | null>(null);
  // 編集可能フィールド
  const [title, setTitle]         = useState("");
  const [isAllDay, setIsAllDay]   = useState(true);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime]     = useState("11:00");
  const [color, setColor]         = useState(COLOR_OPTIONS[0]);
  const [calendarId, setCalendarId] = useState("personal");

  const voice = useVoiceRecognition();

  // ダイアログが開くたびにリセット
  useEffect(() => {
    if (open) {
      setStep("record");
      setParsed(null);
      voice.reset();
    } else {
      voice.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 音声テキストが確定したらパース
  const handleParse = () => {
    const fullText = voice.transcript + voice.interimTranscript;
    if (!fullText.trim()) return;
    voice.stop();
    const result = parseVoiceInput(fullText);
    setParsed(result);
    setTitle(result.title);
    setIsAllDay(result.isAllDay);
    setStartTime(result.startTime ?? "10:00");
    setEndTime(result.endTime ?? "11:00");
    setColor(result.color);
    setCalendarId(result.calendarId);
    setStep("confirm");
  };

  const handleSave = () => {
    if (!title.trim() || !parsed) return;
    onAddEvent({
      id: String(Date.now()),
      title: title.trim(),
      date: parsed.date,
      isAllDay,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      color,
      calendarId,
    });
    onOpenChange(false);
  };

  const handleRetry = () => {
    voice.reset();
    setStep("record");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Mic className="w-4 h-4 text-teal-500" />
            音声で予定を追加
          </DialogTitle>
        </DialogHeader>

        {step === "record" && (
          <RecordStep
            voice={voice}
            onParse={handleParse}
            onClose={() => onOpenChange(false)}
          />
        )}

        {step === "confirm" && parsed && (
          <ConfirmStep
            parsed={parsed}
            title={title}           setTitle={setTitle}
            isAllDay={isAllDay}     setIsAllDay={setIsAllDay}
            startTime={startTime}   setStartTime={setStartTime}
            endTime={endTime}       setEndTime={setEndTime}
            color={color}           setColor={setColor}
            calendarId={calendarId} setCalendarId={setCalendarId}
            rawText={voice.transcript}
            onSave={handleSave}
            onRetry={handleRetry}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Step 1: 録音画面
// ─────────────────────────────────────────────────────────────────
function RecordStep({
  voice,
  onParse,
  onClose,
}: {
  voice: ReturnType<typeof useVoiceRecognition>;
  onParse: () => void;
  onClose: () => void;
}) {
  const isListening = voice.state === "listening";
  const hasText = !!(voice.transcript || voice.interimTranscript);

  return (
    <div className="space-y-5">
      {/* 非対応エラー */}
      {!voice.isSupported && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>このブラウザは音声認識に対応していません。Chrome / Edge / Safariをお使いください。</span>
        </div>
      )}

      {/* エラー表示 */}
      {voice.error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{voice.error}</span>
        </div>
      )}

      {/* ガイドテキスト */}
      <div className="p-3 rounded-lg bg-teal-50 border border-teal-100 text-sm text-teal-800 space-y-1">
        <p className="font-medium">💡 話す例：</p>
        <p>「明日の午後3時に会議」</p>
        <p>「3月15日 ハッカソン」</p>
        <p>「来週月曜 午前10時から2時間 打ち合わせ」</p>
      </div>

      {/* マイクボタン */}
      <div className="flex flex-col items-center gap-3 py-2">
        <button
          disabled={!voice.isSupported}
          onClick={isListening ? voice.stop : voice.start}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
            isListening
              ? "bg-red-500 hover:bg-red-600 animate-pulse"
              : "bg-teal-500 hover:bg-teal-600"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {isListening
            ? <MicOff className="w-8 h-8 text-white" />
            : <Mic className="w-8 h-8 text-white" />
          }
        </button>
        <p className={`text-sm font-medium ${isListening ? "text-red-500" : "text-gray-500"}`}>
          {isListening ? "● 録音中…話しかけてください" : "タップして録音開始"}
        </p>
      </div>

      {/* 認識テキスト */}
      <div className="min-h-[72px] p-3 rounded-lg border border-gray-200 bg-gray-50 text-sm leading-relaxed">
        {hasText ? (
          <>
            <span className="text-gray-800">{voice.transcript}</span>
            <span className="text-blue-400">{voice.interimTranscript}</span>
          </>
        ) : (
          <span className="text-gray-400">認識したテキストがここに表示されます…</span>
        )}
      </div>

      {/* 操作ボタン */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onClose}>キャンセル</Button>
        <Button
          size="sm"
          onClick={onParse}
          disabled={!hasText}
          className="bg-teal-500 hover:bg-teal-600 text-white"
        >
          <CheckCircle2 className="w-4 h-4 mr-1" />
          予定を確認する
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Step 2: 確認・編集画面
// ─────────────────────────────────────────────────────────────────
function ConfirmStep({
  parsed, rawText,
  title, setTitle,
  isAllDay, setIsAllDay,
  startTime, setStartTime,
  endTime, setEndTime,
  color, setColor,
  calendarId, setCalendarId,
  onSave, onRetry, onClose,
}: {
  parsed: ParsedVoiceEvent;
  rawText: string;
  title: string;           setTitle: (v: string) => void;
  isAllDay: boolean;       setIsAllDay: (v: boolean) => void;
  startTime: string;       setStartTime: (v: string) => void;
  endTime: string;         setEndTime: (v: string) => void;
  color: string;           setColor: (v: string) => void;
  calendarId: string;      setCalendarId: (v: string) => void;
  onSave: () => void;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* 認識テキスト（読み取り専用） */}
      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-600">
        <span className="text-xs font-medium text-gray-400 block mb-0.5">認識テキスト</span>
        「{rawText}」
      </div>

      {/* 日付（読み取り専用で表示） */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400 text-xs w-14">日付</span>
        <span className="font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
          {format(parsed.date, "yyyy年M月d日(E)", { locale: ja })}
        </span>
      </div>

      {/* タイトル */}
      <div className="space-y-1">
        <Label htmlFor="v-title">タイトル</Label>
        <Input
          id="v-title" value={title} autoFocus
          onChange={(e) => setTitle(e.target.value)}
          placeholder="予定のタイトル"
        />
      </div>

      {/* カレンダー */}
      <div className="space-y-1">
        <Label>カレンダー</Label>
        <Select value={calendarId} onValueChange={setCalendarId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CALENDARS.map((cal) => (
              <SelectItem key={cal.id} value={cal.id}>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cal.color }} />
                  {cal.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 終日 / 時間 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox" checked={isAllDay}
            onChange={(e) => setIsAllDay(e.target.checked)}
            className="w-4 h-4 accent-teal-500"
          />
          <span className="text-sm">終日</span>
        </label>
        {!isAllDay && (
          <div className="flex items-center gap-2">
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="flex-1" />
            <span className="text-gray-400 text-sm">〜</span>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="flex-1" />
          </div>
        )}
      </div>

      {/* カラー */}
      <div className="space-y-1">
        <Label>カラー</Label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full transition-transform ${
                color === c ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : ""
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* ボタン */}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onRetry}>
          <Mic className="w-4 h-4 mr-1" />
          録音し直す
        </Button>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={onClose}>キャンセル</Button>
          <Button
            size="sm" onClick={onSave} disabled={!title.trim()}
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            カレンダーに追加
          </Button>
        </div>
      </div>
    </div>
  );
}
