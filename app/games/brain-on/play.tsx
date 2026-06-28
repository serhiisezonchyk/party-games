import { Stack } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { HeaderInfoButton } from "@/components/header-info-button";
import { HeaderSettingsButton } from "@/components/header-settings-button";
import { Colors } from "@/constants/theme";
import { usePreferences } from "@/contexts/preferences-context";
import { BrainOnGameplayScreen } from "@/features/brain-on/brain-on-gameplay-screen";
import { GameRulesModal } from "@/features/game-rules-modal";

export default function BrainOnPlayRoute() {
  const { effectiveTheme, t } = usePreferences();
  const palette = Colors[effectiveTheme];
  const [isRulesVisible, setIsRulesVisible] = useState(false);

  return (
    <>
      <Stack.Screen
        options={{
          title: t("games.brainOn.title"),
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <HeaderInfoButton onPress={() => setIsRulesVisible(true)} />
              <HeaderSettingsButton />
            </View>
          ),
        }}
      />
      <BrainOnGameplayScreen />
      <GameRulesModal
        gameId="brain-on"
        onClose={() => setIsRulesVisible(false)}
        palette={palette}
        t={t}
        visible={isRulesVisible}
      />
    </>
  );
}
