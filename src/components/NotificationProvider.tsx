"use client";

import React, { createContext, useContext, useEffect, useCallback } from "react";

// 通知関数の型定義
type NotifyFunction = (title: string, body?: string) => void;

const NotificationContext = createContext<NotifyFunction | undefined>(undefined);

// どこでも通知を呼び出せるようにするためのカスタムフック
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // 1. ページ読み込み時に一度だけ許可を求める
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // 2. 通知を実行する実体
  const notify = useCallback((title: string, body: string = "") => {
    if (!("Notification" in window)) {
      alert(`${title}\n${body}`); // 非対応ブラウザ用
      return;
    }

    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    } else {
      // 許可がない場合は許可を求めてから送るか、alertを出す
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, { body });
        } else {
          alert(`${title}\n${body}`);
        }
      });
    }
  }, []);

  return (
    <NotificationContext.Provider value={notify}>
      {children}
    </NotificationContext.Provider>
  );
}