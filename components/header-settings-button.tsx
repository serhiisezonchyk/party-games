import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet } from "react-native";

import { Colors } from "@/constants/theme";
import { usePreferences } from "@/contexts/preferences-context";

export function HeaderSettingsButton() {
  const { effectiveTheme, openSettings, t } = usePreferences();
  const palette = Colors[effectiveTheme];

  return (
    <Pressable
      accessibilityLabel={t("settings.title")}
      accessibilityRole="button"
      hitSlop={12}
      onPress={openSettings}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.surface,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <MaterialIcons color={palette.text} name="settings" size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
});
