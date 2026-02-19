"use client" //
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,

} from "@/components/ui/input-group"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AudioLinesIcon, CameraIcon, SendHorizontalIcon } from "lucide-react"
// 1. ライブラリをインポート
import TextareaAutosize from "react-textarea-autosize"

export default function ButtonGroupNested() {
  return (
    <div className="fixed bottom-8 left-1/2 w-full max-w-3xl -translate-x-1/2 px-4">
      <TooltipProvider>
  
        <div className="flex items-end gap-3">
          
          {/* カメラボタン（位置がズレないよう下揃えの余白を調整） */}
          <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-full mb-1">
            <CameraIcon className="h-6 w-6" />
          </Button>


          <div className="flex-1">
            <InputGroup className="bg-background shadow-lg rounded-2xl border-2 overflow-hidden items-end">
              {/* 2. TextareaAutosizeに変更 */}
              <TextareaAutosize
                minRows={1}           // 最低限の行数
                maxRows={5}           // 最大どこまで伸びるか（これ以上はスクロール）
                placeholder="Send a message..."
                className="w-full !text-xl border-none focus:ring-0 resize-none py-4 px-4 bg-transparent outline-none leading-tight"
                // Enterで送信したい場合はここに処理を追加
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    console.log("送信処理をここに書く");
                  }
                }}
              />
              
              <InputGroupAddon align="inline-end" className="px-4 mb-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="hover:bg-accent p-2 rounded-full transition-colors">
                      <AudioLinesIcon className="h-6 w-6 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Voice Mode</TooltipContent>
                </Tooltip>
              </InputGroupAddon>
            </InputGroup>
          </div>

          {/* 送信ボタン */}
          <Button 
            size="icon" 
            className="h-12 w-12 shrink-0 rounded-full bg-primary text-primary-foreground mb-1"
          >
            <SendHorizontalIcon className="h-6 w-6" />
          </Button>

        </div>
      </TooltipProvider>
    </div>
  )
}






