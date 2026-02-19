import { CalendarEvent, CalendarGroup } from "./types";

export const CALENDARS: CalendarGroup[] = [
  { id: "work",     name: "仕事",   color: "#3b82f6" },
  { id: "personal", name: "個人",   color: "#22c55e" },
  { id: "family",   name: "家族",   color: "#f97316" },
  { id: "event",    name: "イベント", color: "#a855f7" },
  { id: "holiday",  name: "祝日",   color: "#ef4444" },
];

export const COLOR_OPTIONS = [
  "#3b82f6",
  "#22c55e",
  "#f97316",
  "#a855f7",
  "#ef4444",
  "#06b6d4",
  "#f59e0b",
  "#ec4899",
  "#10b981",
  "#6366f1",
];

// ──────────────────────────────────────────
//  サンプルイベントデータ (2026年2月 TimeTree再現)
// ──────────────────────────────────────────
const Y = 2026;

function d(day: number, month: number = 1): Date {
  return new Date(Y, month, day); // month: 0-indexed
}

export const INITIAL_EVENTS: CalendarEvent[] = [
  // ─── 1/26〜 ───
  { id: "e01", title: "AIサイト",          date: d(26, 0), isAllDay: true,  color: "#22c55e", calendarId: "work" },
  { id: "e02", title: "AWS",              date: d(26, 0), isAllDay: false, startTime: "14:30", endTime: "16:00", color: "#3b82f6", calendarId: "work" },
  { id: "e03", title: "精神科診察",        date: d(30, 0), isAllDay: false, startTime: "11:00", color: "#3b82f6", calendarId: "personal" },
  { id: "e04", title: "クラウド・ススス",   date: d(30, 0), isAllDay: false, startTime: "13:00", color: "#ef4444", calendarId: "work" },
  { id: "e05", title: "山",               date: d(31, 0), isAllDay: false, startTime: "07:00", color: "#f97316", calendarId: "personal" },
  { id: "e06", title: "尚夫 徳洲会病院",   date: d(31, 0), isAllDay: false, startTime: "11:00", color: "#f97316", calendarId: "family" },

  // ─── 2月第1週 ───
  { id: "e07", title: "株式会 会の件",     date: d(2),  isAllDay: false, startTime: "09:30", color: "#ef4444", calendarId: "work" },
  { id: "e08", title: "節分",             date: d(3),  isAllDay: true,  color: "#6b7280", calendarId: "holiday" },
  { id: "e09", title: "ディレミ",          date: d(6),  isAllDay: false, startTime: "13:00", color: "#f59e0b", calendarId: "personal" },
  { id: "e10", title: "冬の集い",          date: d(7),  endDate: d(8),  isAllDay: true,  color: "#06b6d4", calendarId: "event" },
  { id: "e11", title: "衆院選投票日",       date: d(8),  isAllDay: true,  color: "#6b7280", calendarId: "holiday" },

  // ─── 2月第2週 ───
  { id: "e12", title: "建国記念の日",       date: d(11), isAllDay: true,  color: "#ef4444", calendarId: "holiday" },
  { id: "e13", title: "ハッカソン プ",      date: d(12), isAllDay: false, startTime: "13:10", color: "#3b82f6", calendarId: "work" },
  { id: "e14", title: "国ミ",              date: d(12), isAllDay: false, startTime: "00:00", color: "#f59e0b", calendarId: "event" },
  { id: "e15", title: "国ミ",              date: d(13), isAllDay: false, startTime: "19:00", color: "#f59e0b", calendarId: "event" },
  { id: "e16", title: "バレンタインデー",    date: d(14), isAllDay: true,  color: "#ec4899", calendarId: "holiday" },
  { id: "e17", title: "学校校",            date: d(14), endDate: d(15), isAllDay: true,  color: "#f59e0b", calendarId: "personal" },

  // ─── 2月第3週 ───
  { id: "e18", title: "ハッカソン",         date: d(17), endDate: d(20), isAllDay: true,  color: "#22c55e", calendarId: "work" },

  // ─── 2月第4〜5週 ───
  { id: "e19", title: "スキー",            date: d(23), endDate: d(27), isAllDay: true,  color: "#06b6d4", calendarId: "personal" },
  { id: "e20", title: "天空誕生日",         date: d(23), isAllDay: true,  color: "#ef4444", calendarId: "family" },
  { id: "e21", title: "尚夫 徳洲会病院",    date: d(27), isAllDay: false, startTime: "10:00", color: "#f97316", calendarId: "family" },

  // ─── 3/1 ───
  { id: "e22", title: "デジタルデトッ",     date: d(1, 2), isAllDay: false, startTime: "10:00", color: "#3b82f6", calendarId: "work" },
];

// ──────────────────────────────────────────
//  ヘルパー関数
// ──────────────────────────────────────────
export function getEventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const target = normalizeDate(date);
  return events.filter((ev) => {
    const start = normalizeDate(ev.date);
    if (ev.isAllDay && ev.endDate) {
      const end = normalizeDate(ev.endDate);
      return target >= start && target <= end;
    }
    return start.getTime() === target.getTime();
  });
}

export function isEventStart(event: CalendarEvent, date: Date): boolean {
  return normalizeDate(event.date).getTime() === normalizeDate(date).getTime();
}

export function isEventEnd(event: CalendarEvent, date: Date): boolean {
  if (!event.endDate) return true;
  return normalizeDate(event.endDate).getTime() === normalizeDate(date).getTime();
}

function normalizeDate(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
