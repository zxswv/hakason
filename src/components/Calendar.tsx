"use client";

import { useState, useMemo } from "react";
import {
  format, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, subMonths,
  isSameMonth, isToday,
} from "date-fns";
import { ja } from "date-fns/locale";
import { 
  ChevronLeft, ChevronRight, Plus, Search, 
  Calendar as CalendarIcon, List, Asterisk 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarEvent } from "@/lib/types";
import {
  INITIAL_EVENTS, getEventsForDay,
} from "@/lib/events";
import EventDialog from "@/components/EventDialog";

const MAX_VISIBLE = 3;
const DAY_NAMES = ["月", "火", "水", "木", "金", "土", "日"];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1));
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  
  // 表示モードの切り替え
  const [showList, setShowList] = useState(false);

  // カレンダーグリッド計算
  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7));
    return result;
  }, [currentDate]);

  // リスト表示用のソート済みイベント（現在の表示月のものに絞り込み）
  const sortedEvents = useMemo(() => {
    return events
      .filter(ev => isSameMonth(ev.date, currentDate))
      .sort((a, b) => {
        const dateCompare = a.date.getTime() - b.date.getTime();
        if (dateCompare !== 0) return dateCompare;
        return (a.startTime || "").localeCompare(b.startTime || "");
      });
  }, [events, currentDate]);

  // ダイアログ制御
  const openNewEvent = (date: Date) => {
    setSelectedDate(date); setEditingEvent(null); setDialogOpen(true);
  };
  const openEditEvent = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(event); setSelectedDate(event.date); setDialogOpen(true);
  };

  const handleSave = (ev: CalendarEvent) => {
    setEvents((prev) => editingEvent ? prev.map((e) => (e.id === ev.id ? ev : e)) : [...prev, ev]);
    setDialogOpen(false); setEditingEvent(null);
  };
  const handleDelete = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setDialogOpen(false); setEditingEvent(null);
  };

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900">
      {/* ════════════ ヘッダー（2段構成でスマホ最適化） ════════════ */}
      <header className="flex flex-col border-b border-gray-200 shrink-0 bg-white">
        {/* 上段：ロゴと右側アクション */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-1 text-teal-500 font-bold text-lg tracking-tight select-none">
            <Asterisk className="w-5 h-5 stroke-[3px]" />
            <span>TimeTree</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Search className="w-4 h-4 text-gray-500" />
            </Button>
            <button
              onClick={() => openNewEvent(new Date())}
              className="w-8 h-8 rounded-full bg-teal-500 hover:bg-teal-600 flex items-center justify-center transition-colors ml-1"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* 下段：ナビゲーションと切り替え */}
        <div className="flex items-center gap-2 px-4 pb-2">
          <div className="flex items-center gap-0.5 shrink-0">
            <h1 className="text-base font-bold text-gray-800 mr-1">
              {format(currentDate, "yyyy年M月", { locale: ja })}
            </h1>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" className="h-7 px-2 text-xs ml-auto shrink-0" onClick={() => setCurrentDate(new Date())}>
            今日
          </Button>

          {/* 表示切替タブ */}
          <div className="flex bg-gray-100 p-0.5 rounded-lg shrink-0">
            <Button 
              variant={!showList ? "secondary" : "ghost"} 
              size="sm" 
              className={`h-7 px-2 text-[10px] sm:text-xs transition-all ${!showList ? "bg-white shadow-sm" : "text-gray-500"}`}
              onClick={() => setShowList(false)}
            >
              <CalendarIcon className="w-3 h-3 mr-1" />
              <span>月</span>
            </Button>
            <Button 
              variant={showList ? "secondary" : "ghost"} 
              size="sm" 
              className={`h-7 px-2 text-[10px] sm:text-xs transition-all ${showList ? "bg-white shadow-sm" : "text-gray-500"}`}
              onClick={() => setShowList(true)}
            >
              <List className="w-3 h-3 mr-1" />
              <span>リスト</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ════════════ メインコンテンツ ════════════ */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* ── カレンダー表示 ── */}
        {/* スマホではshowListがtrueの時に隠す */}
        <div className={`flex-1 flex flex-col ${showList ? "hidden md:flex" : "flex"}`}>
          <div className="grid grid-cols-7 border-b border-gray-100 shrink-0">
            {DAY_NAMES.map((name, i) => (
              <div key={name} className={`py-1.5 text-center text-[10px] font-bold ${
                i === 5 ? "text-blue-500" : i === 6 ? "text-red-500" : "text-gray-400"
              }`}>
                {name}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 flex-1 overflow-y-auto">
            {weeks.flat().map((day) => {
              const dayEvents = getEventsForDay(events, day);
              const inMonth = isSameMonth(day, currentDate);
              return (
                <div key={day.toISOString()} onClick={() => openNewEvent(day)}
                  className={`min-h-[80px] border-b border-r border-gray-50 p-0.5 cursor-pointer hover:bg-gray-50 ${!inMonth ? "bg-gray-50/40" : ""}`}>
                  <div className="flex justify-center mb-1">
                    <span className={`text-[11px] font-medium w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday(day) ? "bg-teal-500 text-white" : !inMonth ? "text-gray-300" : "text-gray-700"
                    }`}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, MAX_VISIBLE).map((ev) => (
                      <div key={ev.id} onClick={(e) => openEditEvent(ev, e)}
                        className="text-[9px] px-1 truncate rounded text-white" style={{ backgroundColor: ev.color }}>
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── リスト表示 ── */}
        {showList && (
          <div className="w-full md:w-80 border-l border-gray-200 bg-gray-50 flex flex-col">
            <div className="p-4 border-b bg-white shrink-0">
              <h2 className="font-bold text-sm text-gray-700">予定リスト</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {sortedEvents.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">今月の予定はありません</div>
              ) : (
                sortedEvents.map((ev, i) => {
                  const isNewDate = i === 0 || format(sortedEvents[i-1].date, 'yyyy-MM-dd') !== format(ev.date, 'yyyy-MM-dd');
                  return (
                    <div key={ev.id}>
                      {isNewDate && (
                        <div className="text-xs font-bold text-teal-600 mb-2 mt-2 sticky top-0 bg-gray-50 py-1">
                          {format(ev.date, "M月d日 (E)", { locale: ja })}
                        </div>
                      )}
                      <div
                        onClick={(e) => openEditEvent(ev, e)}
                        className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm active:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-800 truncate">{ev.title}</div>
                            <div className="text-[10px] text-gray-500">
                              {ev.isAllDay ? "終日" : `${ev.startTime} 〜`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

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