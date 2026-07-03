import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";

import { HeaderSettingsButton } from "@/components/header-settings-button";
import { PreferencesModal } from "@/components/preferences-modal";
import { TelegramMiniAppBridge } from "@/components/telegram-mini-app-bridge";
import { WEB_APP_MAX_WIDTH } from "@/constants/layout";
import { Colors } from "@/constants/theme";
import {
  PreferencesProvider,
  usePreferences,
} from "@/contexts/preferences-context";
import {
  getTelegramWebApp,
  isTelegramMiniApp,
} from "@/utils/telegram-mini-app";

preventAutoHideAsync().catch(() => undefined);

const TELEGRAM_FULLSCREEN_TOP_INSET = 80;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat: require("../assets/fonts/Montserrat.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError]);

  if (!(fontsLoaded || fontError)) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PreferencesProvider>
        <RootNavigator />
      </PreferencesProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { effectiveTheme, t } = usePreferences();
  const palette = Colors[effectiveTheme];
  const navigationTheme = effectiveTheme === "dark" ? DarkTheme : DefaultTheme;
  const [isTelegramRuntime, setIsTelegramRuntime] = useState(false);

  useEffect(() => {
    setIsTelegramRuntime(isTelegramMiniApp(getTelegramWebApp()));
  }, []);

  return (
    <ThemeProvider
      value={{
        ...navigationTheme,
        colors: {
          ...navigationTheme.colors,
          background: palette.background,
          card: palette.background,
          text: palette.text,
          border: palette.border,
          primary: palette.tint,
        },
      }}
    >
      <View
        style={[
          styles.appRoot,
          {
            backgroundColor: palette.background,
            paddingTop: isTelegramRuntime ? TELEGRAM_FULLSCREEN_TOP_INSET : 0,
          },
        ]}
      >
        <View style={styles.appShell}>
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: palette.background },
              headerRight: () => <HeaderSettingsButton />,
              headerShadowVisible: false,
              headerStyle: { backgroundColor: palette.background },
              headerTintColor: palette.text,
              headerTitleStyle: {
                fontWeight: "700",
              },
            }}
          >
            <Stack.Screen name="index" options={{ title: t("app.name") }} />
            <Stack.Screen
              name="games/[gameId]"
              options={{ title: t("home.openGame") }}
            />
          </Stack>
        </View>
      </View>
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
      <TelegramMiniAppBridge />
      <PreferencesModal />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
  appShell: {
    flex: 1,
    ...(Platform.OS === "web"
      ? {
          alignSelf: "center",
          maxWidth: WEB_APP_MAX_WIDTH,
          width: "100%",
        }
      : null),
  },
});
