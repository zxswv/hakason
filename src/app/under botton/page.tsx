import  Image from "next/image";
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  CameraIcon, 
  MicIcon, 
  Calendar1Icon, 
  FilesIcon, 
  CheckIcon
} from "lucide-react"

export default function FloatingActions() {
  // ボタンの設定データ
  const actions = [
    { icon: <CameraIcon size={24} />, label: "Camera" },
    { icon: <Calendar1Icon size={24} />, label: "Calender" },
    { icon: <MicIcon size={24} />, label: "Voice" },
    { icon: <FilesIcon size={24} />, label: "Documents" },
    { icon: <CheckIcon size={24} />, label: "Check" },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 w-auto">
      <TooltipProvider delayDuration={200}>
        {/* コンテナ：w-maxで中身に合わせる、またはw-[320px]などで固定 */}
        <div className="flex items-center justify-between gap-6 rounded-2xl bg-background/80 backdrop-blur-md p-3 shadow-2xl border border-border">
          
          {actions.map((action, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-12 w-12 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all duration-200"
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
  )
}