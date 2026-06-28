import { Stack } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { HeaderInfoButton } from "@/components/header-info-button";
import { HeaderSettingsButton } from "@/components/header-settings-button";
import { Colors } from "@/constants/theme";
import { usePreferences } from "@/contexts/preferences-context";
import { GameRulesModal } from "@/features/game-rules-modal";
import { SpyGameplayScreen } from "@/features/spy/spy-gameplay-screen";

export default function SpyPlayRoute() {
  const { effectiveTheme, t } = usePreferences();
  const palette = Colors[effectiveTheme];
  const [isRulesVisible, setIsRulesVisible] = useState(false);

  return (
    <>
      <Stack.Screen
        options={{
          title: t("games.spy.title"),
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <HeaderInfoButton onPress={() => setIsRulesVisible(true)} />
              <HeaderSettingsButton />
            </View>
          ),
        }}
      />
      <SpyGameplayScreen />
      <GameRulesModal
        gameId="spy"
        onClose={() => setIsRulesVisible(false)}
        palette={palette}
        t={t}
        visible={isRulesVisible}
      />
    </>
  );
}
