"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CameraIcon,
  MicIcon,
  Calendar1Icon,
  WalletIcon,
  CheckIcon,
} from "lucide-react";
import TextBox from "@/components/TextBox";
import Kakeibo from "@/components/kakeibo";
import { CalendarEvent } from "@/lib/types";
import { parseVoiceInput, toCalendarEvent } from "@/lib/parseVoiceInput";

interface Props {
  onPreviewEvent: (event: CalendarEvent) => void;
}

export default function FloatingActions({ onPreviewEvent }: Props) {
  const [voiceOpen,   setVoiceOpen]   = useState(false);
  const [kakeiboOpen, setKakeiboOpen] = useState(false);

  const handleVoiceSubmit = (text: string) => {
    const parsed   = parseVoiceInput(text);
    const newEvent = toCalendarEvent(parsed);
    setVoiceOpen(false);
    onPreviewEvent(newEvent);
  };

  const actions = [
    {
      icon:    <CameraIcon size={24} />,
      label:   "Camera",
      onClick: undefined,
    },
    {
      icon:    <Calendar1Icon size={24} />,
      label:   "Calendar",
      onClick: undefined,
    },
    {
      icon:     <MicIcon size={24} />,
      label:    voiceOpen ? "音声入力を閉じる" : "音声で予定追加",
      onClick:  () => setVoiceOpen((prev) => !prev),
      isActive: voiceOpen,
    },
    {
      icon:     <WalletIcon size={24} />,
      label:    kakeiboOpen ? "家計簿を閉じる" : "家計簿",
      onClick:  () => setKakeiboOpen((prev) => !prev),
      isActive: kakeiboOpen,
    },
    {
      icon:    <CheckIcon size={24} />,
      label:   "Check",
      onClick: undefined,
    },
  ];

  return (
    <>
      {/* ── 音声入力 TextBox ── */}
      {voiceOpen && (
        <TextBox
          onClose={() => setVoiceOpen(false)}
          onSubmit={handleVoiceSubmit}
        />
      )}

      {/* ── 家計簿モーダル ── */}
      {kakeiboOpen && (
        <Kakeibo onClose={() => setKakeiboOpen(false)} />
      )}

      {/* ── FloatingActions バー ── */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 w-auto z-40">
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center justify-between gap-6 rounded-2xl bg-background/80 backdrop-blur-md p-3 shadow-2xl border border-border">
            {actions.map((action, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={action.onClick}
                    className={`h-12 w-12 rounded-xl transition-all duration-200 ${
                      action.isActive
                        ? "bg-teal-500 text-white hover:bg-teal-600"
                        : "hover:bg-primary hover:text-primary-foreground"
                    }`}
                  >
                    {action.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{action.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>
    </>
  );
}
