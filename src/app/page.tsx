"use client";

import { useState } from "react";
import FloatingActions from "@/components/under botton/page";
import Calendar from "@/components/Calendar";
import VoiceRecorder from "@/components/voice";
import { CalendarEvent } from "@/lib/types";

   export default function Home() {
     return (
       <div >
      <main >
      {/* <FloatingActions/>
        <Calendar /> */}
        <VoiceRecorder />
      </main>
    </div>
  );
}
