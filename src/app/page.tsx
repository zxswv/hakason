"use client";

import { useState, useMemo } from "react";
import FloatingActions from "@/components/under botton/page";
import Calendar from "@/components/Calendar";
import { ScheduleReminder } from "@/components/ScheduleReminder";
import { CalendarEvent } from "@/lib/types";
import { INITIAL_EVENTS } from "@/lib/events";

export default function Home() {
  const [previewEvent, setPreviewEvent] = useState<CalendarEvent | null>(null);
  // Calendar と ScheduleReminder が共有する events の「スナップショット」
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);

  /**
   * ScheduleReminder が期待する形式に変換。
   * CalendarEvent の date + startTime を結合して start: Date にする。
   * 終日イベントは日付の 00:00:00 をそのまま使う。
   */
  const reminderEvents = useMemo(() => {
    return calendarEvents
      .filter((ev) => {
        // 時間付きイベントのみリマインダー対象（終日は除外してもよいが一応含める）
        return true;
      })
      .map((ev) => {
        let start: Date;
        if (!ev.isAllDay && ev.startTime) {
          const [h, m] = ev.startTime.split(":").map(Number);
          start = new Date(ev.date);
          start.setHours(h, m, 0, 0);
        } else {
          start = new Date(ev.date);
          start.setHours(0, 0, 0, 0);
        }
        return { id: ev.id, title: ev.title, start };
      });
  }, [calendarEvents]);

  return (
    <div className="relative">
      <main>
        <Calendar
          previewEvent={previewEvent}
          onPreviewConsumed={() => setPreviewEvent(null)}
          onEventsChange={setCalendarEvents}
        />
      </main>

      {/* 右上に固定：次の予定カウントダウン + 通知リマインダー */}
      <ScheduleReminder events={reminderEvents} />

      {/* 下部固定：FloatingActions バー */}
      <FloatingActions onPreviewEvent={(event) => setPreviewEvent(event)} />
    </div>
  );
}
