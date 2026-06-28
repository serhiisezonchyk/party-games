import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Colors } from "@/constants/theme";
import {
  clampTruthOrDareSettings,
  truthOrDareCategories,
} from "@/features/truth-or-dare/defaults";
import type {
  TruthOrDareCategoryId,
  TruthOrDareSettings,
} from "@/features/truth-or-dare/types";
import type { TranslationKey } from "@/i18n/translations";

interface TruthOrDareSettingsPanelProps {
  isAdult: boolean;
  onChange: (settings: TruthOrDareSettings) => void;
  onOpenSettings: () => void;
  palette: (typeof Colors)["light"];
  settings: TruthOrDareSettings;
  t: (key: TranslationKey) => string;
}

function getCategoryOpacity(isLocked: boolean, isPressed: boolean) {
  if (isLocked) {
    return 0.62;
  }

  return isPressed ? 0.72 : 1;
}

function getEnabledOpacity(isEnabled: boolean, isPressed: boolean) {
  if (!isEnabled) {
    return 0.62;
  }

  return isPressed ? 0.72 : 1;
}

function getCategoryIconColor({
  isLocked,
  isSelected,
  palette,
}: {
  isLocked: boolean;
  isSelected: boolean;
  palette: (typeof Colors)["light"];
}) {
  if (isLocked) {
    return palette.mutedText;
  }

  return isSelected ? palette.tint : palette.mutedText;
}

function getCategoryIconName(isLocked: boolean, isSelected: boolean) {
  if (isLocked) {
    return "lock";
  }

  return isSelected ? "check-circle" : "radio-button-unchecked";
}

export function TruthOrDareSettingsPanel({
  settings,
  isAdult,
  palette,
  t,
  onChange,
  onOpenSettings,
}: TruthOrDareSettingsPanelProps) {
  const selectedCount = settings.selectedCategoryIds.length;

  function updateSettings(nextSettings: TruthOrDareSettings) {
    onChange(clampTruthOrDareSettings(nextSettings, isAdult));
  }

  function toggleCategory(categoryId: TruthOrDareCategoryId) {
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
            {t("truthOrDare.settings.categories")}
          </Text>
          <Text style={[styles.metaText, { color: palette.mutedText }]}>
            {t("truthOrDare.settings.categorySummary").replace(
              "{count}",
              String(selectedCount)
            )}
          </Text>
        </View>

        <View style={styles.categoryList}>
          {truthOrDareCategories.map((category) => {
            const isLocked = category.isAdultOnly && !isAdult;
            const isSelected = settings.selectedCategoryIds.includes(
              category.id
            );

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  disabled: isLocked,
                  selected: isSelected,
                }}
                disabled={isLocked}
                key={category.id}
                onPress={() => toggleCategory(category.id)}
                style={({ pressed }) => [
                  styles.categoryRow,
                  {
                    backgroundColor: isSelected
                      ? palette.card
                      : palette.surface,
                    borderColor: isSelected ? palette.tint : palette.border,
                    opacity: getCategoryOpacity(isLocked, pressed),
                  },
                ]}
              >
                <MaterialIcons
                  color={getCategoryIconColor({
                    isLocked,
                    isSelected,
                    palette,
                  })}
                  name={getCategoryIconName(isLocked, isSelected)}
                  size={22}
                />
                <View style={styles.categoryText}>
                  <View style={styles.categoryTitleRow}>
                    <Text
                      style={[
                        styles.categoryTitle,
                        { color: isLocked ? palette.mutedText : palette.text },
                      ]}
                    >
                      {t(category.titleKey)}
                    </Text>
                    {category.isAdultOnly ? (
                      <Text
                        style={[styles.adultBadge, { color: palette.tint }]}
                      >
                        {t("truthOrDare.settings.adultBadge")}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={[styles.categoryMeta, { color: palette.mutedText }]}
                  >
                    {isLocked
                      ? t("truthOrDare.settings.lockedHint")
                      : t(category.descriptionKey)}
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
            {t("truthOrDare.settings.adultUnlock")}
          </Text>
          <Text style={[styles.metaText, { color: palette.mutedText }]}>
            {isAdult
              ? t("truthOrDare.settings.adultUnlocked")
              : t("truthOrDare.settings.openSettingsHint")}
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
              {t("truthOrDare.settings.alcoholMode")}
            </Text>
            <Text style={[styles.adultBadge, { color: palette.tint }]}>
              {t("truthOrDare.settings.adultBadge")}
            </Text>
          </View>
          <Text style={[styles.metaText, { color: palette.mutedText }]}>
            {isAdult
              ? t("truthOrDare.settings.alcoholModeHelp")
              : t("truthOrDare.settings.lockedHint")}
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
