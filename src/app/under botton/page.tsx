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
import VoiceModal from "@/components/VoiceModal";
import { CalendarEvent } from "@/lib/types";

// onAddEvent を受け取り、Mic ボタンを押すと VoiceModal が開く
interface Props {
  onAddEvent: (event: CalendarEvent) => void;
}

export default function FloatingActions({ onAddEvent }: Props) {
  const [voiceOpen, setVoiceOpen] = useState(false);

  const actions = [
    { icon: <CameraIcon size={24} />,   label: "Camera",       onClick: undefined },
    { icon: <Calendar1Icon size={24} />, label: "Calendar",     onClick: undefined },
    {
      icon: <MicIcon size={24} />,
      label: "音声で予定追加",
      onClick: () => setVoiceOpen(true),
      highlight: true,
    },
    { icon: <FilesIcon size={24} />,    label: "Documents",    onClick: undefined },
    { icon: <CheckIcon size={24} />,    label: "Check",        onClick: undefined },
  ];

  return (
    <>
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
                      action.highlight
                        ? "text-teal-500 hover:bg-teal-500 hover:text-white"
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

      {/* 音声入力モーダル */}
      <VoiceModal
        open={voiceOpen}
        onOpenChange={setVoiceOpen}
        onAddEvent={(event) => {
          onAddEvent(event);
          setVoiceOpen(false);
        }}
      />
    </>
  );
}
