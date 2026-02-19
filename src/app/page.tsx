"use client";

import { useState } from "react";
import FloatingActions from "@/app/under botton/page";
import Calendar from "@/components/Calendar";
import { CalendarEvent } from "@/lib/types";

export default function Home() {
  const [pendingEvent, setPendingEvent] = useState<CalendarEvent | null>(null);

  return (
    <div className="relative">
      <main>
        <Calendar
          pendingEvent={pendingEvent}
          onPendingConsumed={() => setPendingEvent(null)}
        />
      </main>
      <FloatingActions onAddEvent={(event) => setPendingEvent(event)} />
    </div>
  );
}
