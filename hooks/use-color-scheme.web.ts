import { useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

import type { TelegramColorScheme } from "@/types/telegram-mini-app";
import {
  getTelegramWebApp,
  isTelegramMiniApp,
} from "@/utils/telegram-mini-app";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [telegramColorScheme, setTelegramColorScheme] =
    useState<TelegramColorScheme | null>(null);

  useEffect(() => {
    const webApp = getTelegramWebApp();

    setHasHydrated(true);

    if (!isTelegramMiniApp(webApp)) {
      return;
    }

    function updateTelegramColorScheme() {
      setTelegramColorScheme(webApp.colorScheme);
    }

    updateTelegramColorScheme();
    webApp.onEvent("themeChanged", updateTelegramColorScheme);

    return () => {
      webApp.offEvent("themeChanged", updateTelegramColorScheme);
    };
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return telegramColorScheme ?? colorScheme;
  }

  return "light";
}
