"use client";

import React, { useState, useEffect, useRef } from "react";
import Draggable from "react-draggable";
import { useNotification } from "@/components/NotificationProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BellRing, Calendar as CalendarIcon, X, Clock } from "lucide-react";

// カレンダーから渡される予定の型定義（TimeTreeの構造に合わせる）
interface Event {
  id: string;
  title: string;
  start: Date;
}

export function ScheduleReminder({ events = [] }: { events?: Event[] }) {
  const notify = useNotification();
  const nodeRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  // 1. 直近の予定を探す・カウントダウン計算
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      
      // 未来の予定だけを抽出して、一番近い順に並び替え
      const upcoming = events
        .filter(e => e.start > now)
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      if (upcoming.length > 0) {
        const target = upcoming[0];
        setNextEvent(target);

        // 残り時間の計算
        const diffMs = target.start.getTime() - now.getTime();
        const diffMin = Math.floor(diffMs / (1000 * 60));
        const diffSec = Math.floor((diffMs / 1000) % 60);

        // 0分0秒になった瞬間にリマインド
        if (diffMin === 0 && diffSec === 0) {
          notify(`予定の時間です`, target.title);
        }

        setTimeLeftStr(`${diffMin}分${diffSec}秒`);
      } else {
        setNextEvent(null);
        setTimeLeftStr("予定なし");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [events, notify]);

  return (
    <Draggable 
      nodeRef={nodeRef} 
      onStart={() => setIsDragging(false)}
      onDrag={() => setIsDragging(true)}
      onStop={() => { setTimeout(() => setIsDragging(false), 100); 
}}
    >
      <div ref={nodeRef} className="fixed z-[9999] cursor-move select-none" style={{ top: '20px', right: '20px' }}>
        <div className="relative inline-block">
          {/* メインボタン：次の予定を表示 */}
          <Button 
            onClick={() => { if (!isDragging) setIsOpen(!isOpen); }} 
            className={`shadow-xl border-2 h-14 px-6 rounded-2xl transition-all bg-white hover:bg-slate-50 border-blue-500 text-blue-700 pointer-events-auto`}
          >
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Next Event
              </span>
              <span className="text-sm font-bold truncate max-w-[120px]">
                {nextEvent ? nextEvent.title : "予定なし"}
              </span>
              <span className="text-xs text-blue-500 font-mono">
                {nextEvent ? `あと ${timeLeftStr}` : "--:--"}
              </span>
            </div>
            {nextEvent && <BellRing className="ml-3 h-5 w-5 text-blue-600 animate-bounce" />}
          </Button>

          {/* 予定リスト（ポップアップ） */}
          {isOpen && (
            <Card className="absolute top-16 right-0 w-80 border border-slate-200 shadow-2xl bg-white !opacity-100 overflow-hidden cursor-default" onPointerDown={(e) => e.stopPropagation()}>
              <CardContent className="p-0 bg-white">
                <div className="flex justify-between items-center p-4 border-b bg-slate-50">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-blue-600" />
                    今日のリマインダー
                  </span>
                  <X className="h-4 w-4 cursor-pointer text-slate-400" onClick={() => setIsOpen(false)} />
                </div>
                <div className="max-h-60 overflow-y-auto p-2 space-y-2">
                  {events.length > 0 ? (
                    events.map(e => (
                      <div key={e.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{e.title}</span>
                          <span className="text-[10px] text-slate-500">
                            {e.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {e.start > new Date() && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">待機中</span>}
                      </div>
                    ))
                  ) : (
                    <p className="text-center p-4 text-slate-400 text-sm">予定が見つかりません</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Draggable>
  );
}