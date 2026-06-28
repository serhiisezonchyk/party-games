import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Colors } from "@/constants/theme";
import {
  brainOnCategories,
  clampBrainOnSettings,
} from "@/features/brain-on/defaults";
import type {
  BrainOnCategoryId,
  BrainOnSettings,
} from "@/features/brain-on/types";
import type { TranslationKey } from "@/i18n/translations";

interface BrainOnSettingsPanelProps {
  isAdult: boolean;
  onChange: (settings: BrainOnSettings) => void;
  onOpenSettings: () => void;
  palette: (typeof Colors)["light"];
  settings: BrainOnSettings;
  t: (key: TranslationKey) => string;
}

function getEnabledOpacity(isEnabled: boolean, isPressed: boolean) {
  if (!isEnabled) {
    return 0.62;
  }

  return isPressed ? 0.72 : 1;
}

function getCategoryIconColor({
  isSelected,
  palette,
}: {
  isSelected: boolean;
  palette: (typeof Colors)["light"];
}) {
  return isSelected ? palette.tint : palette.mutedText;
}

function getCategoryIconName(isSelected: boolean) {
  return isSelected ? "check-circle" : "radio-button-unchecked";
}

export function BrainOnSettingsPanel({
  settings,
  isAdult,
  palette,
  t,
  onChange,
  onOpenSettings,
}: BrainOnSettingsPanelProps) {
  const selectedCount = settings.selectedCategoryIds.length;

  function updateSettings(nextSettings: BrainOnSettings) {
    onChange(clampBrainOnSettings(nextSettings, isAdult));
  }

  function toggleCategory(categoryId: BrainOnCategoryId) {
    const isSelected = settings.selectedCategoryIds.includes(categoryId);
    const selectedCategoryIds = isSelected
      ? settings.selectedCategoryIds.filter(
          (selectedCategoryId) => selectedCategoryId !== categoryId
        )
      : [...settings.selectedCategoryIds, categoryId];

    updateSettings({ ...settings, selectedCategoryIds });
  }

  function toggleAlcoholMode() {
    updateSettings({
      ...settings,
      alcoholModeEnabled: !settings.alcoholModeEnabled,
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.settingGroup}>
        <View style={styles.headerText}>
          <Text style={[styles.label, { color: palette.text }]}>
            {t("brainOn.settings.categories")}
          </Text>
          <Text style={[styles.metaText, { color: palette.mutedText }]}>
            {t("brainOn.settings.categorySummary").replace(
              "{count}",
              String(selectedCount)
            )}
          </Text>
        </View>

        <View style={styles.categoryList}>
          {brainOnCategories.map((category) => {
            const isSelected = settings.selectedCategoryIds.includes(
              category.id
            );

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={category.id}
                onPress={() => toggleCategory(category.id)}
                style={({ pressed }) => [
                  styles.categoryRow,
                  {
                    backgroundColor: isSelected
                      ? palette.card
                      : palette.surface,
                    borderColor: isSelected ? palette.tint : palette.border,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <MaterialIcons
                  color={getCategoryIconColor({ isSelected, palette })}
                  name={getCategoryIconName(isSelected)}
                  size={22}
                />
                <View style={styles.categoryText}>
                  <Text style={[styles.categoryTitle, { color: palette.text }]}>
                    {t(category.titleKey)}
                  </Text>
                  <Text
                    style={[styles.categoryMeta, { color: palette.mutedText }]}
                  >
                    {t(category.descriptionKey)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          disabled: isAdult,
        }}
        disabled={isAdult}
        onPress={onOpenSettings}
        style={({ pressed }) => [
          styles.adultHintRow,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            opacity: pressed ? 0.72 : 1,
          },
        ]}
      >
        <MaterialIcons color={palette.tint} name="cake" size={22} />
        <View style={styles.switchText}>
          <Text style={[styles.label, { color: palette.text }]}>
            {t("brainOn.settings.adultUnlock")}
          </Text>
          <Text style={[styles.metaText, { color: palette.mutedText }]}>
            {isAdult
              ? t("brainOn.settings.adultUnlocked")
              : t("brainOn.settings.openSettingsHint")}
          </Text>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{
          checked: settings.alcoholModeEnabled,
          disabled: !isAdult,
        }}
        disabled={!isAdult}
        onPress={toggleAlcoholMode}
        style={({ pressed }) => [
          styles.switchRow,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            opacity: getEnabledOpacity(isAdult, pressed),
          },
        ]}
      >
        <View style={styles.switchText}>
          <View style={styles.categoryTitleRow}>
            <Text
              style={[
                styles.label,
                { color: isAdult ? palette.text : palette.mutedText },
              ]}
            >
              {t("brainOn.settings.alcoholMode")}
            </Text>
            <Text style={[styles.adultBadge, { color: palette.tint }]}>
              {t("brainOn.settings.adultBadge")}
            </Text>
          </View>
          <Text style={[styles.metaText, { color: palette.mutedText }]}>
            {isAdult
              ? t("brainOn.settings.alcoholModeHelp")
              : t("brainOn.settings.lockedHint")}
          </Text>
        </View>
        <View
          style={[
            styles.switchTrack,
            {
              backgroundColor: settings.alcoholModeEnabled
                ? palette.tint
                : palette.border,
            },
          ]}
        >
          <View
            style={[
              styles.switchThumb,
              {
                backgroundColor: palette.onTint,
                transform: [
                  { translateX: settings.alcoholModeEnabled ? 18 : 0 },
                ],
              },
            ]}
          />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  settingGroup: {
    gap: 10,
  },
  headerText: {
    gap: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  categoryList: {
    gap: 8,
  },
  categoryRow: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 64,
    padding: 12,
  },
  categoryText: {
    flex: 1,
    gap: 3,
  },
  categoryTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  categoryMeta: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  adultBadge: {
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  adultHintRow: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 70,
    padding: 14,
  },
  switchRow: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 76,
    padding: 14,
  },
  switchText: {
    flex: 1,
    gap: 4,
  },
  switchTrack: {
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    padding: 3,
    width: 52,
  },
  switchThumb: {
    borderRadius: 11,
    height: 22,
    width: 22,
  },
});
