import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { hideAsync, preventAutoHideAsync } from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";

import { HeaderSettingsButton } from "@/components/header-settings-button";
import { PreferencesModal } from "@/components/preferences-modal";
import { Colors } from "@/constants/theme";
import {
  PreferencesProvider,
  usePreferences,
} from "@/contexts/preferences-context";

preventAutoHideAsync().catch(() => undefined);

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
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
      <PreferencesModal />
    </ThemeProvider>
  );
}
