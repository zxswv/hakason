import { CalendarEvent, Calendar } from "./types";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  subDays,
} from "date-fns";

export const CALENDARS: Calendar[] = [
  { id: "work", name: "仕事", color: "#3b82f6" },
  { id: "personal", name: "個人", color: "#22c55e" },
  { id: "family", name: "家族", color: "#f97316" },
  { id: "event", name: "イベント", color: "#a855f7" },
  { id: "holiday", name: "祝日", color: "#ef4444" },
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

// 2026年2月のサンプルデータ (TimeTreeの画像に基づく)
const BASE_YEAR = 2026;
const BASE_MONTH = 1; // 0-indexed (2月)

function d(day: number, month = BASE_MONTH, year = BASE_YEAR) {
  return new Date(year, month, day);
}

export const INITIAL_EVENTS: CalendarEvent[] = [
  // 第1週
  {
    id: "e1",
    title: "AIサイト",
    date: d(26, 0),
    isAllDay: true,
    color: "#22c55e",
    calendarId: "work",
  },
  {
    id: "e2",
    title: "AWS",
    date: d(26, 0),
    startTime: "14:30",
    endTime: "16:00",
    isAllDay: false,
    color: "#3b82f6",
    calendarId: "work",
  },
  {
    id: "e3",
    title: "精神科診察",
    date: d(30, 0),
    startTime: "11:00",
    isAllDay: false,
    color: "#3b82f6",
    calendarId: "personal",
  },
  {
    id: "e4",
    title: "クラウド・ススス",
    date: d(30, 0),
    startTime: "13:00",
    isAllDay: false,
    color: "#ef4444",
    calendarId: "work",
  },
  {
    id: "e5",
    title: "山",
    date: d(31, 0),
    startTime: "07:00",
    isAllDay: false,
    color: "#f97316",
    calendarId: "personal",
  },
  {
    id: "e6",
    title: "尚夫 徳洲会病院",
    date: d(31, 0),
    startTime: "11:00",
    isAllDay: false,
    color: "#f97316",
    calendarId: "family",
  },

  // 第2週
  {
    id: "e7",
    title: "株式会 会の件",
    date: d(2),
    startTime: "09:30",
    isAllDay: false,
    color: "#ef4444",
    calendarId: "work",
  },
  {
    id: "e8",
    title: "節分",
    date: d(3),
    isAllDay: true,
    color: "#6b7280",
    calendarId: "holiday",
  },
  {
    id: "e9",
    title: "ディレミ",
    date: d(6),
    startTime: "13:00",
    isAllDay: false,
    color: "#f59e0b",
    calendarId: "personal",
  },
  {
    id: "e10",
    title: "冬の集い",
    date: d(7),
    endDate: d(8),
    isAllDay: true,
    color: "#06b6d4",
    calendarId: "event",
  },
  {
    id: "e11",
    title: "衆院選投票日",
    date: d(8),
    isAllDay: true,
    color: "#6b7280",
    calendarId: "holiday",
  },

  // 第3週
  {
    id: "e12",
    title: "建国記念の日",
    date: d(11),
    isAllDay: true,
    color: "#ef4444",
    calendarId: "holiday",
  },
  {
    id: "e13",
    title: "ハッカソン プ",
    date: d(12),
    startTime: "13:10",
    isAllDay: false,
    color: "#3b82f6",
    calendarId: "work",
  },
  {
    id: "e14",
    title: "国ミ",
    date: d(12),
    startTime: "00:00",
    isAllDay: false,
    color: "#f59e0b",
    calendarId: "event",
  },
  {
    id: "e15",
    title: "国ミ",
    date: d(13),
    startTime: "19:00",
    isAllDay: false,
    color: "#f59e0b",
    calendarId: "event",
  },
  {
    id: "e16",
    title: "バレンタインデー",
    date: d(14),
    isAllDay: true,
    color: "#ec4899",
    calendarId: "holiday",
  },
  {
    id: "e17",
    title: "学校校",
    date: d(14),
    endDate: d(15),
    isAllDay: true,
    color: "#f59e0b",
    calendarId: "personal",
  },

  // 第4週
  {
    id: "e18",
    title: "ハッカソン",
    date: d(17),
    endDate: d(20),
    isAllDay: true,
    color: "#22c55e",
    calendarId: "work",
  },

  // 第5週
  {
    id: "e19",
    title: "スキー",
    date: d(23),
    endDate: d(27),
    isAllDay: true,
    color: "#06b6d4",
    calendarId: "personal",
  },
  {
    id: "e20",
    title: "天空誕生日",
    date: d(23),
    isAllDay: true,
    color: "#ef4444",
    calendarId: "family",
  },
  {
    id: "e21",
    title: "尚夫 徳洲会病院",
    date: d(27),
    startTime: "10:00",
    isAllDay: false,
    color: "#f97316",
    calendarId: "family",
  },
  {
    id: "e22",
    title: "デジタルデトッ",
    date: d(1, 2),
    startTime: "10:00",
    isAllDay: false,
    color: "#3b82f6",
    calendarId: "work",
  },
];

export function getEventsForDay(
  events: CalendarEvent[],
  date: Date
): CalendarEvent[] {
  return events.filter((event) => {
    const eventDate = new Date(event.date);
    const targetDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    if (event.isAllDay && event.endDate) {
      const endDate = new Date(event.endDate);
      endDate.setHours(0, 0, 0, 0);
      return targetDate >= eventDate && targetDate <= endDate;
    }

    return eventDate.getTime() === targetDate.getTime();
  });
}

export function isEventStart(event: CalendarEvent, date: Date): boolean {
  const eventDate = new Date(event.date);
  const targetDate = new Date(date);
  eventDate.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  return eventDate.getTime() === targetDate.getTime();
}

export function isEventEnd(event: CalendarEvent, date: Date): boolean {
  if (!event.endDate) return true;
  const endDate = new Date(event.endDate);
  const targetDate = new Date(date);
  endDate.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  return endDate.getTime() === targetDate.getTime();
}
