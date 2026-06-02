"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mic, MicOff, CheckCircle2, RotateCcw, Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarEvent } from "@/lib/types";
import { CALENDARS, COLOR_OPTIONS } from "@/lib/events";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddEvent: (event: CalendarEvent) => void;
}

// ── 音声テキストから日時・タイトルを解析する関数 ──────────────────

function resolveDate(text: string): Date {
  const base = new Date();
  base.setHours(0, 0, 0, 0);

  // 「X月Y日」
  const md = text.match(/(\d{1,2})月(\d{1,2})日/);
  if (md) {
    const d = new Date(base);
    d.setMonth(parseInt(md[1]) - 1);
    d.setDate(parseInt(md[2]));
    return d;
  }
  if (/明後日|あさって/.test(text)) {
    const d = new Date(base); d.setDate(d.getDate() + 2); return d;
  }
  if (/明日|あした/.test(text)) {
    const d = new Date(base); d.setDate(d.getDate() + 1); return d;
  }
  if (/今日|本日/.test(text)) return new Date(base);

  // 「X日後」
  const dl = text.match(/(\d+)日後/);
  if (dl) { const d = new Date(base); d.setDate(d.getDate() + parseInt(dl[1])); return d; }

  // 曜日「(来週の?)月曜」など
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const wd = text.match(/(?:来週の?|次の?)?([月火水木金土日])曜/);
  if (wd) {
    const target = weekdays.indexOf(wd[1]);
    if (target !== -1) {
      const d = new Date(base);
      const diff = (target - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      return d;
    }
  }
  return new Date(base);
}

function resolveTime(text: string): string | undefined {
  const pm = text.match(/午後\s*(\d{1,2})時(?:\s*(\d{1,2})分)?/);
  if (pm) {
    let h = parseInt(pm[1]); if (h !== 12) h += 12;
    return `${String(h).padStart(2, "0")}:${String(pm[2] ? parseInt(pm[2]) : 0).padStart(2, "0")}`;
  }
  const am = text.match(/午前\s*(\d{1,2})時(?:\s*(\d{1,2})分)?/);
  if (am) {
    let h = parseInt(am[1]); if (h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(am[2] ? parseInt(am[2]) : 0).padStart(2, "0")}`;
  }
  const plain = text.match(/(\d{1,2})時(?:(\d{1,2})分)?/);
  if (plain) {
    return `${String(parseInt(plain[1])).padStart(2, "0")}:${String(plain[2] ? parseInt(plain[2]) : 0).padStart(2, "0")}`;
  }
  const colon = text.match(/(\d{1,2}):(\d{2})/);
  if (colon) return `${String(parseInt(colon[1])).padStart(2, "0")}:${colon[2]}`;
  return undefined;
}

function inferCalendarId(text: string): string {
  if (/仕事|会議|ミーティング|打ち合わせ|出張|業務|締め切り|デッドライン|プレゼン/.test(text)) return "work";
  if (/家族|子供|親|誕生日|記念日|夫|妻|父|母/.test(text)) return "family";
  if (/病院|診察|健診|クリニック|歯医者/.test(text)) return "personal";
  if (/ハッカソン|イベント|勉強会|セミナー|コンサート|試合|大会/.test(text)) return "event";
  return "personal";
}

function extractTitle(text: string): string {
  let t = text;
  t = t.replace(/(\d{1,2})月(\d{1,2})日/g, "");
  t = t.replace(/今日|明日|明後日|本日/g, "");
  t = t.replace(/(\d+)日後/g, "");
  t = t.replace(/(?:来週の?|次の?)?[月火水木金土日]曜/g, "");
  t = t.replace(/午前|午後/g, "");
  t = t.replace(/(\d{1,2})時(\d{1,2})?分?/g, "");
  t = t.replace(/(\d{1,2}):(\d{2})/g, "");
  t = t.replace(/予定|スケジュール|追加|登録|入れて/g, "");
  return t.replace(/\s+/g, " ").trim() || "新しい予定";
}

// ── ステップ型 ──────────────────────────────────────────────────
type Step = "record" | "confirm";

export default function VoiceModal({ open, onOpenChange, onAddEvent }: Props) {
  // ── voice.tsx と同じ音声認識ステート ──
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isListeningRef = useRef(isListening);

  // ── 確認ステップ用ステート ──
  const [step, setStep] = useState<Step>("record");
  const [parsedDate, setParsedDate] = useState<Date>(new Date());
  const [title, setTitle] = useState("");
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [calendarId, setCalendarId] = useState("personal");

  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

  // ── 音声認識の初期化（voice.tsx のロジックをそのままコピー）──
  useEffect(() => {
    setIsMounted(true);
    if (typeof window === "undefined") return;

    const hasWebSpeech = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
    const hasMediaDevices = navigator?.mediaDevices?.getUserMedia;
    if (!hasWebSpeech) { setError("このブラウザは音声認識に対応していません。Chrome / Edge / Safari をお使いください。"); return; }
    if (!hasMediaDevices) { setError("HTTPSでアクセスする必要があります。"); return; }
    setIsSupported(true);

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "ja-JP";

    rec.onresult = (event: any) => {
      let interim = ""; let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const part = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += part; else interim += part;
      }
      if (final) setTranscript((prev) => prev + final + " ");
      setInterimTranscript(interim);
      setError("");
    };

    rec.onerror = (event: any) => {
      if (event.error === "aborted") return;
      if (event.error === "no-speech") { setError("⚠️ 音声が検出されませんでした。"); setTimeout(() => setError(""), 3000); return; }
      const msgs: Record<string, string> = {
        "not-allowed": "❌ マイクのアクセスが拒否されました。ブラウザの設定で許可してください。",
        "audio-capture": "❌ マイクが見つかりません。接続を確認してください。",
        "network": "❌ ネットワークエラーが発生しました。",
      };
      setError(msgs[event.error] ?? `❌ エラー: ${event.error}`);
      setIsListening(false);
    };

    rec.onend = () => {
      if (isListeningRef.current) {
        try { rec.start(); } catch (e: any) {
          if (e.message && !e.message.includes("already started")) { setIsListening(false); }
        }
      }
    };

    setRecognition(rec);
    return () => { try { rec.stop(); } catch (_) {} };
  }, []);

  // ── モーダルを開くたびにリセット ──
  useEffect(() => {
    if (open) {
      setStep("record");
      setTranscript("");
      setInterimTranscript("");
      setError("");
      setIsListening(false);
    } else {
      // モーダルを閉じたら録音停止
      isListeningRef.current = false;
      try { recognition?.stop(); } catch (_) {}
      setIsListening(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── voice.tsx と同じ toggleListening ──
  const toggleListening = async () => {
    if (!isMounted || !recognition) return;
    if (isListening) {
      try { recognition.stop(); setIsListening(false); setInterimTranscript(""); } catch (_) { setIsListening(false); }
    } else {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) { setError("❌ HTTPSでアクセスしてください。"); return; }
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognition.start();
        setIsListening(true); setError("");
      } catch (err: any) {
        if (err.message?.includes("already started")) { setIsListening(true); return; }
        const msgs: Record<string, string> = {
          NotAllowedError: "❌ マイクの許可が必要です。アドレスバー左のアイコンから許可してください。",
          NotFoundError: "❌ マイクが見つかりません。",
          NotSupportedError: "❌ HTTPS環境でのみ利用可能です。",
        };
        setError(msgs[err.name] ?? `❌ エラー: ${err.message || err.name}`);
      }
    }
  };

  const clearTranscript = () => { setTranscript(""); setInterimTranscript(""); setError(""); };

  // ── 「確認する」ボタン → テキスト解析して確認ステップへ ──
  const handleGoConfirm = () => {
    const fullText = (transcript + interimTranscript).trim();
    if (!fullText) return;
    // 録音停止
    isListeningRef.current = false;
    try { recognition?.stop(); } catch (_) {}
    setIsListening(false);

    // 解析
    const date = resolveDate(fullText);
    const time = resolveTime(fullText);
    const cal  = inferCalendarId(fullText);
    const ttl  = extractTitle(fullText);

    // 終了時間：「X時間」で自動計算
    let eTime = "";
    if (time) {
      const dur = fullText.match(/(\d+)時間/);
      if (dur) {
        const [h, m] = time.split(":").map(Number);
        eTime = `${String(h + parseInt(dur[1])).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      }
    }

    setParsedDate(date);
    setTitle(ttl);
    setIsAllDay(!time);
    setStartTime(time ?? "10:00");
    setEndTime(eTime || (time ? `${String(parseInt(time.split(":")[0]) + 1).padStart(2,"0")}:${time.split(":")[1]}` : "11:00"));
    setCalendarId(cal);
    setColor(CALENDARS.find(c => c.id === cal)?.color ?? COLOR_OPTIONS[0]);
    setStep("confirm");
  };

  // ── 保存 ──
  const handleSave = () => {
    if (!title.trim()) return;
    onAddEvent({
      id: String(Date.now()),
      title: title.trim(),
      date: parsedDate,
      isAllDay,
      startTime: isAllDay ? undefined : startTime,
      endTime:   isAllDay ? undefined : endTime,
      color,
      calendarId,
    });
    onOpenChange(false);
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

        {/* ═══ STEP 1: 録音 ═══ */}
        {step === "record" && (
          <div className="space-y-4">
            {/* 非対応 */}
            {!isSupported && isMounted && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error || "このブラウザは音声認識に対応していません。"}</span>
              </div>
            )}

            {/* エラー */}
            {error && isSupported && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ガイド */}
            <div className="p-3 rounded-lg bg-teal-50 border border-teal-100 text-sm text-teal-800 space-y-1">
              <p className="font-medium">💡 話す例：</p>
              <p className="text-xs">「明日の午後3時に会議」</p>
              <p className="text-xs">「3月15日 ハッカソン」</p>
              <p className="text-xs">「来週月曜 午前10時から2時間 打ち合わせ」</p>
            </div>

            {/* マイクボタン（voice.tsx と同じスタイル） */}
            <div className="flex flex-col items-center gap-3 py-2">
              <button
                disabled={!isSupported}
                onClick={toggleListening}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
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
                {isListening
                  ? <span className="flex items-center gap-1"><span className="animate-pulse">●</span> 録音中…話しかけてください</span>
                  : "タップして録音開始"
                }
              </p>
            </div>

            {/* 文字起こし結果（voice.tsx と同じ表示） */}
            <div className="min-h-[80px] max-h-[160px] overflow-y-auto p-3 rounded-lg border border-zinc-200 bg-zinc-50 text-sm leading-relaxed">
              {(transcript || interimTranscript) ? (
                <>
                  <span className="text-zinc-900">{transcript}</span>
                  <span className="text-blue-400">{interimTranscript}</span>
                </>
              ) : (
                <span className="text-zinc-400">認識したテキストがここに表示されます…</span>
              )}
            </div>

            {/* 文字数 */}
            {transcript && (
              <p className="text-xs text-zinc-400 text-right">{transcript.length} 文字</p>
            )}

            {/* ボタン */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearTranscript} disabled={!transcript && !interimTranscript}>
                <Trash2 className="w-4 h-4 mr-1" /> クリア
              </Button>
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>キャンセル</Button>
                <Button
                  size="sm"
                  onClick={handleGoConfirm}
                  disabled={!transcript && !interimTranscript}
                  className="bg-teal-500 hover:bg-teal-600 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" /> 予定を確認する
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: 確認・編集 ═══ */}
        {step === "confirm" && (
          <div className="space-y-4">
            {/* 認識テキスト */}
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-sm text-zinc-600">
              <span className="text-xs font-medium text-zinc-400 block mb-0.5">認識テキスト</span>
              「{transcript.trim()}」
            </div>

            {/* 解析された日付 */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-400 text-xs w-12 shrink-0">日付</span>
              <span className="font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                {format(parsedDate, "yyyy年M月d日(E)", { locale: ja })}
              </span>
            </div>

            {/* タイトル */}
            <div className="space-y-1">
              <Label htmlFor="v-title">タイトル</Label>
              <Input id="v-title" value={title} autoFocus onChange={(e) => setTitle(e.target.value)} placeholder="予定のタイトル" />
            </div>

            {/* カレンダー */}
            <div className="space-y-1">
              <Label>カレンダー</Label>
              <Select value={calendarId} onValueChange={setCalendarId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                <input type="checkbox" checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)} className="w-4 h-4 accent-teal-500" />
                <span className="text-sm">終日</span>
              </label>
              {!isAllDay && (
                <div className="flex items-center gap-2">
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="flex-1" />
                  <span className="text-zinc-400 text-sm">〜</span>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="flex-1" />
                </div>
              )}
            </div>

            {/* カラー */}
            <div className="space-y-1">
              <Label>カラー</Label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-offset-1 ring-zinc-400" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* ボタン */}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => { setStep("record"); }}>
                <RotateCcw className="w-4 h-4 mr-1" /> 録音し直す
              </Button>
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>キャンセル</Button>
                <Button size="sm" onClick={handleSave} disabled={!title.trim()} className="bg-teal-500 hover:bg-teal-600 text-white">
                  カレンダーに追加
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
