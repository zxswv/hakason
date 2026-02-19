import { CalendarEvent } from "@/lib/types";
import { COLOR_OPTIONS } from "@/lib/events";

export interface ParsedVoiceEvent {
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  color: string;
  calendarId: string;
}

// 今日基準の日付解決
function resolveDate(text: string, base: Date = new Date()): Date {
  const t = text;

  // 「X月Y日」
  const mdMatch = t.match(/(\d{1,2})月(\d{1,2})日/);
  if (mdMatch) {
    const d = new Date(base);
    d.setMonth(parseInt(mdMatch[1]) - 1);
    d.setDate(parseInt(mdMatch[2]));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // 「今日」「明日」「明後日」「来週」
  if (/今日|本日/.test(t)) return new Date(base.setHours(0,0,0,0));
  if (/明日|あした/.test(t)) {
    const d = new Date(base); d.setDate(d.getDate() + 1); d.setHours(0,0,0,0); return d;
  }
  if (/明後日|あさって/.test(t)) {
    const d = new Date(base); d.setDate(d.getDate() + 2); d.setHours(0,0,0,0); return d;
  }

  // 「X日後」
  const daysLater = t.match(/(\d+)日後/);
  if (daysLater) {
    const d = new Date(base); d.setDate(d.getDate() + parseInt(daysLater[1])); d.setHours(0,0,0,0); return d;
  }

  // 曜日指定「次の月曜」「来週火曜」
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const wdMatch = t.match(/(?:次の?|来週の?)?([月火水木金土日])曜/);
  if (wdMatch) {
    const targetWd = weekdays.indexOf(wdMatch[1]);
    if (targetWd !== -1) {
      const d = new Date(base);
      const diff = (targetWd - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      d.setHours(0,0,0,0);
      return d;
    }
  }

  // デフォルト：今日
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  return d;
}

// 「午前10時」「10時30分」「10:30」などを HH:MM 形式に変換
function resolveTime(text: string): string | undefined {
  // 「午後X時Y分」
  const pm = text.match(/午後\s*(\d{1,2})時(?:\s*(\d{1,2})分)?/);
  if (pm) {
    let h = parseInt(pm[1]);
    if (h !== 12) h += 12;
    const m = pm[2] ? parseInt(pm[2]) : 0;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  }
  // 「午前X時Y分」
  const am = text.match(/午前\s*(\d{1,2})時(?:\s*(\d{1,2})分)?/);
  if (am) {
    let h = parseInt(am[1]);
    if (h === 12) h = 0;
    const m = am[2] ? parseInt(am[2]) : 0;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  }
  // 「X時Y分」（午前/午後なし）
  const plain = text.match(/(\d{1,2})時(?:(\d{1,2})分)?/);
  if (plain) {
    const h = parseInt(plain[1]);
    const m = plain[2] ? parseInt(plain[2]) : 0;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  }
  // 「HH:MM」
  const colon = text.match(/(\d{1,2}):(\d{2})/);
  if (colon) {
    return `${String(parseInt(colon[1])).padStart(2,"0")}:${colon[2]}`;
  }
  return undefined;
}

// カレンダーカテゴリの自動判定
function inferCalendarId(text: string): string {
  if (/仕事|会議|ミーティング|打ち合わせ|出張|業務|案件|クライアント|プレゼン|締め切り|デッドライン/.test(text)) return "work";
  if (/家族|子供|こども|親|兄弟|姉妹|夫|妻|父|母|誕生日|記念日/.test(text)) return "family";
  if (/病院|医者|診察|健診|検診|クリニック|歯医者/.test(text)) return "personal";
  if (/ハッカソン|イベント|勉強会|セミナー|コンサート|ライブ|試合|大会/.test(text)) return "event";
  if (/祝日|休日|振替休日/.test(text)) return "holiday";
  return "personal";
}

// イベントタイトルの抽出（日時・助詞などを除去）
function extractTitle(text: string): string {
  let t = text;
  // 日時表現を除去
  t = t.replace(/(\d{1,2})月(\d{1,2})日/g, "");
  t = t.replace(/今日|明日|明後日|本日/g, "");
  t = t.replace(/(\d+)日後/g, "");
  t = t.replace(/(?:次の?|来週の?)?[月火水木金土日]曜/g, "");
  t = t.replace(/午前|午後/g, "");
  t = t.replace(/(\d{1,2})時(\d{1,2})分?/g, "");
  t = t.replace(/(\d{1,2}):(\d{2})/g, "");
  t = t.replace(/から|まで|に|で|の|を|が|は/g, "");
  t = t.replace(/予定|スケジュール|追加|登録|入れて|教えて/g, "");
  t = t.replace(/\s+/g, " ").trim();
  return t || "新しい予定";
}

export function parseVoiceInput(
  rawText: string,
  baseDate: Date = new Date()
): ParsedVoiceEvent {
  const text = rawText.trim();

  const date      = resolveDate(text, new Date(baseDate));
  const startTime = resolveTime(text);
  const isAllDay  = !startTime;
  const calendarId = inferCalendarId(text);
  const title     = extractTitle(text);

  // 終了時間（「から〜まで」パターン）
  let endTime: string | undefined;
  const rangeMatch = text.match(/から(.+?)まで/);
  if (rangeMatch) {
    endTime = resolveTime(rangeMatch[1]);
  }
  // 「1時間」「2時間後」などで終了時間を自動算出
  if (startTime && !endTime) {
    const durationMatch = text.match(/(\d+)時間/);
    if (durationMatch) {
      const [hStr, mStr] = startTime.split(":");
      const endH = parseInt(hStr) + parseInt(durationMatch[1]);
      endTime = `${String(endH).padStart(2,"0")}:${mStr}`;
    }
  }

  return {
    title,
    date,
    startTime,
    endTime,
    isAllDay,
    color: COLOR_OPTIONS[0],
    calendarId,
  };
}

// ParsedVoiceEvent → CalendarEvent に変換
export function toCalendarEvent(parsed: ParsedVoiceEvent): CalendarEvent {
  return {
    id:          String(Date.now()),
    title:       parsed.title,
    date:        parsed.date,
    isAllDay:    parsed.isAllDay,
    startTime:   parsed.startTime,
    endTime:     parsed.endTime,
    color:       parsed.color,
    calendarId:  parsed.calendarId,
  };
}
