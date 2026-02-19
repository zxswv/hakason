"use client";

import { useState, useMemo } from "react";
import {
  format, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, subMonths,
  isSameMonth, isToday, isSaturday, isSunday,
} from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarEvent } from "@/lib/types";
import {
  INITIAL_EVENTS, getEventsForDay, isEventStart, isEventEnd,
} from "@/lib/events";
import EventDialog from "@/components/EventDialog";

const MAX_VISIBLE = 3;
const DAY_NAMES   = ["月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日", "日曜日"];

export default function TimeTreeCalendar() {
  const [currentDate,  setCurrentDate]  = useState(new Date(2026, 1, 1));
  const [events,       setEvents]       = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // ── カレンダーグリッドの日付配列（月曜始まり）────────────────
  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end   = endOfWeek(endOfMonth(currentDate),     { weekStartsOn: 1 });
    const days  = eachDayOfInterval({ start, end });
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7));
    return result;
  }, [currentDate]);

  // ── ダイアログ制御 ────────────────────────────────────────
  const openNewEvent = (date: Date) => {
    setSelectedDate(date); setEditingEvent(null); setDialogOpen(true);
  };
  const openEditEvent = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(event); setSelectedDate(event.date); setDialogOpen(true);
  };

  // ── CRUD ─────────────────────────────────────────────────
  const handleSave = (ev: CalendarEvent) => {
    setEvents((prev) =>
      editingEvent ? prev.map((e) => (e.id === ev.id ? ev : e)) : [...prev, ev]
    );
    setDialogOpen(false); setEditingEvent(null);
  };
  const handleDelete = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setDialogOpen(false); setEditingEvent(null);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* ════════════ ヘッダー ════════════ */}
      <header className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 shrink-0">
        {/* ロゴ */}
        <span className="text-teal-500 font-bold text-lg tracking-tight select-none mr-2">
          ✳ TimeTree
        </span>

        {/* 今日ボタン */}
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
          今日
        </Button>

        {/* 月移動 */}
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* 年月 */}
        <h1 className="text-base font-semibold text-gray-800 min-w-[90px]">
          {format(currentDate, "yyyy年M月", { locale: ja })}
        </h1>

        {/* 月次 バッジ */}
        <span className="ml-1 px-2 py-0.5 rounded bg-teal-500 text-white text-xs font-medium">
          月次
        </span>

        {/* 右側アイコン */}
        <div className="flex items-center gap-1 ml-auto">
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Search className="w-4 h-4 text-gray-500" />
          </Button>
          <button
            onClick={() => openNewEvent(new Date())}
            className="w-8 h-8 rounded-full bg-teal-500 hover:bg-teal-600 flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
      </header>

      {/* ════════════ カレンダー本体 ════════════ */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 border-b border-gray-200 shrink-0">
          {DAY_NAMES.map((name, i) => (
            <div
              key={name}
              className={`py-2 text-center text-xs font-medium border-r border-gray-100 last:border-r-0 ${
                i === 5 ? "text-blue-500" : i === 6 ? "text-red-500" : "text-gray-500"
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        {/* 日付グリッド */}
        <div className="grid grid-cols-7 flex-1">
          {weeks.map((week) =>
            week.map((day) => {
              const dayEvents    = getEventsForDay(events, day);
              const visible      = dayEvents.slice(0, MAX_VISIBLE);
              const hiddenCount  = dayEvents.length - MAX_VISIBLE;
              const inMonth      = isSameMonth(day, currentDate);
              const todayFlag    = isToday(day);
              const sat          = isSaturday(day);
              const sun          = isSunday(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => openNewEvent(day)}
                  className={`min-h-[110px] border-b border-r border-gray-100 last:border-r-0 p-1 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !inMonth ? "bg-gray-50/60" : ""
                  }`}
                >
                  {/* 日付番号 */}
                  <div className="mb-0.5">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium ${
                        todayFlag
                          ? "bg-teal-500 text-white"
                          : !inMonth
                          ? "text-gray-350"
                          : sun
                          ? "text-red-500"
                          : sat
                          ? "text-blue-500"
                          : "text-gray-700"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  {/* イベント一覧 */}
                  <div className="space-y-[2px]">
                    {visible.map((ev) => {
                      const evStart    = isEventStart(ev, day);
                      const evEnd      = isEventEnd(ev, day);
                      const multiDay   = ev.isAllDay && !!ev.endDate;

                      return (
                        <div
                          key={`${ev.id}-${day.toISOString()}`}
                          onClick={(e) => openEditEvent(ev, e)}
                          title={ev.title}
                          className={`text-xs leading-4 py-[2px] px-1 truncate cursor-pointer hover:opacity-80 transition-opacity ${
                            ev.isAllDay
                              ? `text-white font-medium ${
                                  !multiDay
                                    ? "rounded"
                                    : evStart && evEnd
                                    ? "rounded"
                                    : evStart
                                    ? "rounded-l pr-0"
                                    : evEnd
                                    ? "rounded-r pl-0"
                                    : "px-0"
                                }`
                              : "text-gray-700 rounded"
                          }`}
                          style={{
                            backgroundColor: ev.isAllDay ? ev.color : "transparent",
                            borderLeft: !ev.isAllDay ? `3px solid ${ev.color}` : undefined,
                          }}
                        >
                          {(!multiDay || evStart) && (
                            <>
                              {!ev.isAllDay && ev.startTime && (
                                <span className="opacity-70 mr-1 text-[10px]">{ev.startTime}</span>
                              )}
                              {ev.title}
                            </>
                          )}
                          {multiDay && !evStart && "\u00A0"}
                        </div>
                      );
                    })}

                    {hiddenCount > 0 && (
                      <p className="text-[11px] text-gray-400 px-1">+{hiddenCount} 件</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ════════════ ダイアログ ════════════ */}
      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedDate={selectedDate}
        editingEvent={editingEvent}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
