"use client";

import { useState } from "react";
import FloatingActions from "@/components/under botton/page";
import Calendar from "@/components/Calendar";
import VoiceRecorder from "@/components/voice";
import  kakeibo from "@/components/kakeibo";
import { CalendarEvent } from "@/lib/types";
import { Kameron } from "next/font/google";

export default function Home() {
  /**
   * 音声入力 → FloatingActions → ここ → Calendar の流れで仮予定を受け渡す。
   * null のときは何もしない。セットされると Calendar 側で EventDialog が開く。
   */
  const [previewEvent, setPreviewEvent] = useState<CalendarEvent | null>(null);

  return (
    <div className="relative">
      <main>
        <Calendar
          previewEvent={previewEvent}
          onPreviewConsumed={() => setPreviewEvent(null)}
        />
      </main>
    <kakeibo />
      {/* FloatingActions バー（画面下部固定） */}
      <FloatingActions onPreviewEvent={(event) => setPreviewEvent(event)} />
    </div>
  );
}
