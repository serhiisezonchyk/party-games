import { Platform } from "react-native";

import type { TelegramWebApp } from "@/types/telegram-mini-app";

export function getTelegramWebApp(): TelegramWebApp | null {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }

  return window.Telegram?.WebApp ?? null;
}

export function isTelegramMiniApp(webApp: TelegramWebApp | null): boolean {
  return Boolean(webApp?.initData);
}
