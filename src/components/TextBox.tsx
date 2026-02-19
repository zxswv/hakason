"use client";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
} from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AudioLinesIcon, CameraIcon, SendHorizontalIcon } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";

export default function TextBox() {
  return (
    <div className="fixed bottom-8 left-1/2 w-full max-w-3xl -translate-x-1/2 px-4">
      <TooltipProvider>
        <div className="flex items-end gap-2">
          
          {/* カメラボタン（外側に配置） */}
          

          <div className="flex-1">
            <InputGroup className="bg-background shadow-lg rounded-3xl border-2 overflow-hidden items-end flex pr-2">
              
              <TextareaAutosize
                minRows={1}
                maxRows={5}
                placeholder="Send a message..."
                className="flex-1 !text-xl border-none focus:ring-0 resize-none py-4 px-4 bg-transparent outline-none leading-tight"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    console.log("送信処理");
                  }
                }}
              />
              
              {/* テキストボックス内の右側アクションエリア */}
              <div className="flex items-center gap-1 mb-2">
                {/* ボイスモード */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="hover:bg-accent p-2 rounded-full transition-colors text-muted-foreground">
                      <AudioLinesIcon className="h-6 w-6" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Voice Mode</TooltipContent>
                </Tooltip>

                {/* 送信ボタンをここに追加 */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground"
                    >
                      <SendHorizontalIcon className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Send Message</TooltipContent>
                </Tooltip>
              </div>
            </InputGroup>
          </div>

        </div>
      </TooltipProvider>
    </div>
  );
}