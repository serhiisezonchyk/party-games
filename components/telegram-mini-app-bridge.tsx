import { useEffect } from "react";

import { Colors } from "@/constants/theme";
import { usePreferences } from "@/contexts/preferences-context";
import {
  getTelegramWebApp,
  isTelegramMiniApp,
} from "@/utils/telegram-mini-app";

export function TelegramMiniAppBridge() {
  const { effectiveTheme } = usePreferences();
  const palette = Colors[effectiveTheme];

  useEffect(() => {
    const webApp = getTelegramWebApp();

    if (!isTelegramMiniApp(webApp)) {
      return;
    }

    webApp.ready();
    webApp.expand();
  }, []);

  useEffect(() => {
    const webApp = getTelegramWebApp();

    if (!isTelegramMiniApp(webApp)) {
      return;
    }

    webApp.setHeaderColor?.(palette.background);
    webApp.setBackgroundColor?.(palette.background);

    if (webApp.isVersionAtLeast("7.10")) {
      webApp.setBottomBarColor?.(palette.background);
    }
  }, [palette.background]);

  return null;
}
