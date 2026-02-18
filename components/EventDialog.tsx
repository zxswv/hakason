"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarEvent } from "@/lib/types";
import { CALENDARS, COLOR_OPTIONS } from "@/lib/events";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  editingEvent: CalendarEvent | null;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
}

export default function EventDialog({
  open,
  onOpenChange,
  selectedDate,
  editingEvent,
  onSave,
  onDelete,
}: EventDialogProps) {
  const [title, setTitle] = useState("");
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [calendarId, setCalendarId] = useState("personal");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setIsAllDay(editingEvent.isAllDay);
      setStartTime(editingEvent.startTime || "10:00");
      setEndTime(editingEvent.endTime || "11:00");
      setColor(editingEvent.color);
      setCalendarId(editingEvent.calendarId);
      setDescription(editingEvent.description || "");
    } else {
      setTitle("");
      setIsAllDay(true);
      setStartTime("10:00");
      setEndTime("11:00");
      setColor(COLOR_OPTIONS[0]);
      setCalendarId("personal");
      setDescription("");
    }
  }, [editingEvent, open]);

  const handleSave = () => {
    if (!title.trim()) return;
    const event: CalendarEvent = {
      id: editingEvent?.id || Date.now().toString(),
      title: title.trim(),
      date: selectedDate || new Date(),
      isAllDay,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      color,
      calendarId,
      description,
    };
    onSave(event);
  };

  const dateLabel = selectedDate
    ? format(selectedDate, "yyyy年M月d日(E)", { locale: ja })
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {editingEvent ? "予定を編集" : "予定を追加"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 日付表示 */}
          <div className="text-sm text-gray-500 font-medium">{dateLabel}</div>

          {/* タイトル */}
          <div className="space-y-1">
            <Label htmlFor="title" className="text-sm">
              タイトル
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="予定のタイトルを入力"
              className="text-sm"
              autoFocus
            />
          </div>

          {/* カレンダー選択 */}
          <div className="space-y-1">
            <Label className="text-sm">カレンダー</Label>
            <Select value={calendarId} onValueChange={setCalendarId}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CALENDARS.map((cal) => (
                  <SelectItem key={cal.id} value={cal.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: cal.color }}
                      />
                      {cal.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 終日 / 時間 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allday"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="w-4 h-4 accent-teal-500"
              />
              <Label htmlFor="allday" className="text-sm cursor-pointer">
                終日
              </Label>
            </div>

            {!isAllDay && (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="text-sm flex-1"
                />
                <span className="text-gray-400 text-sm">〜</span>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="text-sm flex-1"
                />
              </div>
            )}
          </div>

          {/* カラー選択 */}
          <div className="space-y-1">
            <Label className="text-sm">カラー</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* メモ */}
          <div className="space-y-1">
            <Label htmlFor="desc" className="text-sm">
              メモ
            </Label>
            <Input
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="メモを入力（任意）"
              className="text-sm"
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-2 pt-2">
            {editingEvent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(editingEvent.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                削除
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                キャンセル
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!title.trim()}
                className="bg-teal-500 hover:bg-teal-600 text-white"
              >
                保存
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
