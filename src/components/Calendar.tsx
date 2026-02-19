"use client";

import { useState, useMemo, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  isSunday,
  isSaturday,
} from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarEvent } from "@/lib/types";
import {
  INITIAL_EVENTS,
  getEventsForDay,
  isEventStart,
  isEventEnd,
} from "@/lib/events";
import EventDialog from "@/components/EventDialog";

const MAX_VISIBLE_EVENTS = 3;
const DAY_HEADERS = ["月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日", "サン"];

interface Props {
  /**
   * 音声入力など外部から渡される「仮予定」。
   * セットされると EventDialog が開いて確認を求める。
   * 確定 → カレンダーに追加、キャンセル → 破棄。
   */
  previewEvent?: CalendarEvent | null;
  onPreviewConsumed?: () => void;
}

export default function Calendar({ previewEvent, onPreviewConsumed }: Props) {
  const [currentDate,  setCurrentDate]  = useState(new Date(2026, 1, 1));
  const [events,       setEvents]       = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // ── 仮予定が渡されたら EventDialog を開く ──────────────────────
  useEffect(() => {
    if (!previewEvent) return;
    // 仮予定の日付の月へ移動
    setCurrentDate(
      new Date(previewEvent.date.getFullYear(), previewEvent.date.getMonth(), 1)
    );
    // EventDialog を「新規追加モード」で開く
    // editingEvent は null のまま → 保存時に新規追加扱い
    setSelectedDate(previewEvent.date);
    setEditingEvent(previewEvent);   // フォームの初期値として仮予定を渡す
    setDialogOpen(true);
    onPreviewConsumed?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewEvent]);

  // ── カレンダーグリッド計算 ─────────────────────────────────────
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd   = endOfMonth(currentDate);
    const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd     = endOfWeek(monthEnd,     { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7)
      result.push(calendarDays.slice(i, i + 7));
    return result;
  }, [calendarDays]);

  // ── イベントハンドラ ──────────────────────────────────────────
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    setSelectedDate(event.date);
    setDialogOpen(true);
  };

  const handleSaveEvent = (event: CalendarEvent) => {
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === event.id);
      return exists
        ? prev.map((e) => (e.id === event.id ? event : e))
        : [...prev, event];
    });
    setDialogOpen(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setDialogOpen(false);
    setEditingEvent(null);
  };

  // ダイアログを閉じたとき（キャンセル時）は仮予定を破棄するだけでOK
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setDialogOpen(false);
      setEditingEvent(null);
    }
  };

  // ── レンダリング ─────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-white font-sans pb-24">
      {/* ヘッダー */}
      <header className="flex items-center px-4 py-2 border-b border-gray-200 bg-white shrink-0">
        <span className="text-teal-500 font-bold text-xl mr-6 select-none">カレンダー</span>

        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="mr-3 text-sm font-medium">
          今日
        </Button>

        <div className="flex items-center gap-1 mr-4">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <h1 className="text-lg font-semibold text-gray-800 mr-6">
          {format(currentDate, "yyyy年M月", { locale: ja })}
        </h1>

        <div className="flex gap-1 ml-auto items-center">
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Search className="w-4 h-4 text-gray-500" />
          </Button>
          <Button
            size="sm"
            onClick={() => { setSelectedDate(new Date()); setEditingEvent(null); setDialogOpen(true); }}
            className="bg-teal-500 hover:bg-teal-600 text-white rounded-full w-8 h-8 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 border-b border-gray-200 shrink-0">
        {DAY_HEADERS.map((day, i) => (
          <div
            key={day}
            className={`py-2 text-center text-xs font-medium border-r border-gray-100 last:border-r-0 ${
              i === 5 ? "text-blue-500" : i === 6 ? "text-red-500" : "text-gray-600"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* グリッド */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7">
          {weeks.map((week) =>
            week.map((day) => {
              const dayEvents    = getEventsForDay(events, day);
              const inMonth      = isSameMonth(day, currentDate);
              const todayFlag    = isToday(day);
              const isSat        = isSaturday(day);
              const isSun        = isSunday(day);
              const visible      = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
              const hiddenCount  = dayEvents.length - MAX_VISIBLE_EVENTS;

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[110px] border-b border-r border-gray-100 last:border-r-0 p-1 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !inMonth ? "bg-gray-50/50" : ""
                  }`}
                >
                  <div className="flex items-center mb-1">
                    <span
                      className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        todayFlag
                          ? "bg-teal-500 text-white"
                          : !inMonth
                          ? "text-gray-400"
                          : isSun
                          ? "text-red-500"
                          : isSat
                          ? "text-blue-500"
                          : "text-gray-700"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    {visible.map((event) => {
                      const evStart  = isEventStart(event, day);
                      const evEnd    = isEventEnd(event, day);
                      const multiDay = !!event.endDate && event.isAllDay;

                      return (
                        <div
                          key={`${event.id}-${day.toISOString()}`}
                          onClick={(e) => handleEventClick(event, e)}
                          className={`text-xs py-0.5 px-1 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden whitespace-nowrap overflow-ellipsis ${
                            event.isAllDay
                              ? `text-white font-medium ${
                                  evStart && evEnd ? "rounded"
                                  : evStart         ? "rounded-l pr-0"
                                  : evEnd           ? "rounded-r pl-0"
                                  : "px-0"
                                }`
                              : "rounded text-gray-700"
                          }`}
                          style={{
                            backgroundColor: event.isAllDay ? event.color : "transparent",
                            borderLeft: !event.isAllDay ? `3px solid ${event.color}` : "none",
                          }}
                        >
                          {(!multiDay || evStart) && (
                            <span>
                              {!event.isAllDay && event.startTime && (
                                <span className="opacity-75 mr-1 text-[10px]">{event.startTime}</span>
                              )}
                              {event.title}
                            </span>
                          )}
                          {multiDay && !evStart && <span>&nbsp;</span>}
                        </div>
                      );
                    })}
                    {hiddenCount > 0 && (
                      <div className="text-xs text-gray-500 px-1">+{hiddenCount} 件</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* EventDialog（通常の追加/編集 & 音声入力からの仮予定確認を兼用） */}
      <EventDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        selectedDate={selectedDate}
        editingEvent={editingEvent}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}
