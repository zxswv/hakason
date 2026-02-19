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
  FilesIcon,
  CheckIcon,
} from "lucide-react";
import TextBox from "@/components/TextBox";
import { CalendarEvent } from "@/lib/types";
import { parseVoiceInput, toCalendarEvent } from "@/lib/parseVoiceInput";

interface Props {
  /** 仮予定を確認ダイアログに渡すコールバック */
  onPreviewEvent: (event: CalendarEvent) => void;
}

export default function FloatingActions({ onPreviewEvent }: Props) {
  const [voiceOpen, setVoiceOpen] = useState(false);

  // TextBox から送信されたテキストを受け取り、解析 → 仮予定として親へ渡す
  const handleSubmit = (text: string) => {
    const parsed   = parseVoiceInput(text);
    const newEvent = toCalendarEvent(parsed);
    setVoiceOpen(false);
    onPreviewEvent(newEvent);
  };

  const actions = [
    { icon: <CameraIcon size={24} />,   label: "カメラ",         onClick: undefined },
    { icon: <Calendar1Icon size={24} />, label: "カレンダー",      onClick: undefined },
    {
      icon: <MicIcon size={24} />,
      label: voiceOpen ? "音声入力を閉じる" : "音声で予定追加",
      onClick: () => setVoiceOpen((prev) => !prev),
      isActive: voiceOpen,
    },
    { icon: <FilesIcon size={24} />,    label: "家計簿",      onClick: undefined },
    { icon: <CheckIcon size={24} />,    label: "生活",          onClick: undefined },
  ];

  return (
    <>
      {/* ── TextBox（Mic ボタンの上に重ねて表示） ── */}
      {voiceOpen && (
        <TextBox
          onClose={() => setVoiceOpen(false)}
          onSubmit={handleSubmit}
        />
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
