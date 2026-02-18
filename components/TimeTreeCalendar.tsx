"use client";

import { useState, useMemo } from "react";
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
  CALENDARS,
} from "@/lib/events";
import EventDialog from "@/components/EventDialog";

const MAX_VISIBLE_EVENTS = 3;

export default function TimeTreeCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1));
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // 月曜始まり
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

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
    if (editingEvent) {
      setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
    } else {
      setEvents((prev) => [...prev, event]);
    }
    setDialogOpen(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setDialogOpen(false);
    setEditingEvent(null);
  };

  const getDayEvents = (day: Date) => {
    return getEventsForDay(events, day);
  };

  const DAY_HEADERS = ["月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日", "サン"];

  return (
    <div className="flex flex-col h-screen bg-white font-sans">
      {/* ヘッダー */}
      <header className="flex items-center px-4 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 mr-6">
          <span className="text-teal-500 font-bold text-xl">✳ TimeTree</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          className="mr-3 text-sm font-medium"
        >
          今日
        </Button>

        <div className="flex items-center gap-1 mr-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="w-7 h-7"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="w-7 h-7"
          >
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
            onClick={() => {
              setSelectedDate(new Date());
              setEditingEvent(null);
              setDialogOpen(true);
            }}
            className="bg-teal-500 hover:bg-teal-600 text-white rounded-full w-8 h-8 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* カレンダーグリッド */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DAY_HEADERS.map((day, i) => (
            <div
              key={day}
              className={`py-2 text-center text-xs font-medium border-r border-gray-100 last:border-r-0 ${
                i === 5
                  ? "text-blue-500"
                  : i === 6
                  ? "text-red-500"
                  : "text-gray-600"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1">
          {weeks.map((week, weekIdx) =>
            week.map((day, dayIdx) => {
              const dayEvents = getDayEvents(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              const isSat = isSaturday(day);
              const isSun = isSunday(day);

              const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
              const hiddenCount = dayEvents.length - MAX_VISIBLE_EVENTS;

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[110px] border-b border-r border-gray-100 last:border-r-0 p-1 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !isCurrentMonth ? "bg-gray-50/50" : ""
                  }`}
                >
                  {/* 日付 */}
                  <div className="flex items-center mb-1">
                    <span
                      className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        isTodayDate
                          ? "bg-teal-500 text-white"
                          : !isCurrentMonth
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

                  {/* イベント */}
                  <div className="space-y-0.5">
                    {visibleEvents.map((event) => {
                      const isStart = isEventStart(event, day);
                      const isEnd = isEventEnd(event, day);
                      const isMultiDay = !!event.endDate && event.isAllDay;

                      return (
                        <div
                          key={`${event.id}-${day.toISOString()}`}
                          onClick={(e) => handleEventClick(event, e)}
                          className={`text-xs py-0.5 px-1 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden whitespace-nowrap overflow-ellipsis ${
                            event.isAllDay
                              ? `text-white font-medium ${
                                  isStart && isEnd
                                    ? "rounded"
                                    : isStart
                                    ? "rounded-l mr-0 pr-0"
                                    : isEnd
                                    ? "rounded-r ml-0 pl-0"
                                    : "mx-0 px-0"
                                }`
                              : "rounded text-gray-700"
                          }`}
                          style={{
                            backgroundColor: event.isAllDay
                              ? event.color
                              : "transparent",
                            borderLeft: !event.isAllDay
                              ? `3px solid ${event.color}`
                              : "none",
                          }}
                        >
                          {(!isMultiDay || isStart) && (
                            <span>
                              {!event.isAllDay && event.startTime && (
                                <span className="opacity-75 mr-1">
                                  {event.startTime.slice(0, -3) === "00"
                                    ? event.startTime
                                    : event.startTime}
                                </span>
                              )}
                              {event.title}
                            </span>
                          )}
                          {isMultiDay && !isStart && <span>&nbsp;</span>}
                        </div>
                      );
                    })}
                    {hiddenCount > 0 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{hiddenCount} 件
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* イベント追加/編集ダイアログ */}
      {dialogOpen && (
        <EventDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          selectedDate={selectedDate}
          editingEvent={editingEvent}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
}
