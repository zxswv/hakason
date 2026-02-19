"use client";

import { useState } from "react";
import FloatingActions from "@/app/under botton/page";
import Calendar from "@/components/Calendar";
import { CalendarEvent } from "@/lib/types";

export default function Home() {
  // 音声入力などの外部追加イベントを Calendr に受け渡す
  const [pendingEvent, setPendingEvent] = useState<CalendarEvent | null>(null);

  return (
    <div className="relative">
      <main>
        <Calendar
          pendingEvent={pendingEvent}
          onPendingConsumed={() => setPendingEvent(null)}
        />
      </main>
      {/* フローティングバー：Mic ボタンが押されると VoiceModal を開き、追加されたイベントを Calendar に渡す */}
      <FloatingActions onAddEvent={(event) => setPendingEvent(event)} />
    </div>
  );
}
