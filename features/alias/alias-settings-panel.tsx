import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Colors } from "@/constants/theme";
import { aliasPackages } from "@/features/alias/content";
import { clampAliasSettings } from "@/features/alias/defaults";
import type {
  AliasPenaltyMode,
  AliasScoreFloor,
  AliasSettings,
} from "@/features/alias/types";
import { getLocalizedText } from "@/features/alias/types";
import type { Language, TranslationKey } from "@/i18n/translations";

interface AliasSettingsPanelProps {
  language: Language;
  onChange: (settings: AliasSettings) => void;
  palette: (typeof Colors)["light"];
  settings: AliasSettings;
  t: (key: TranslationKey) => string;
}

const roundDurations = [45, 60, 90, 120, 180] as const;
const targetScores = [20, 30, 40, 50, 75] as const;

function formatDuration(seconds: number) {
  return `${seconds}s`;
}

export function AliasSettingsPanel({
  settings,
  language,
  palette,
  t,
  onChange,
}: AliasSettingsPanelProps) {
  function updateSettings(nextSettings: AliasSettings) {
    onChange(clampAliasSettings(nextSettings));
  }

  function toggleCategory(categoryId: string) {
    const isSelected = settings.selectedCategoryIds.includes(categoryId);
    const selectedCategoryIds = isSelected
      ? settings.selectedCategoryIds.filter(
          (selectedCategoryId) => selectedCategoryId !== categoryId
        )
      : [...settings.selectedCategoryIds, categoryId];

    updateSettings({ ...settings, selectedCategoryIds });
  }

  function setPenaltyMode(penaltyMode: AliasPenaltyMode) {
    updateSettings({ ...settings, penaltyMode });
  }

  function setScoreFloor(scoreFloor: AliasScoreFloor) {
    updateSettings({ ...settings, scoreFloor });
  }

  const selectedCount = settings.selectedCategoryIds.length;

  return (
    <View style={styles.container}>
      <View style={styles.settingGroup}>
        <Text style={[styles.label, { color: palette.text }]}>
          {t("alias.settings.roundDuration")}
        </Text>
        <View style={styles.optionRow}>
          {roundDurations.map((duration) => {
            const isSelected = settings.roundDurationSec === duration;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={duration}
                onPress={() =>
                  updateSettings({ ...settings, roundDurationSec: duration })
                }
                style={({ pressed }) => [
                  styles.optionButton,
                  {
                    backgroundColor: isSelected
                      ? palette.tint
                      : palette.surface,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: isSelected ? palette.onTint : palette.text },
                  ]}
                >
                  {formatDuration(duration)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.settingGroup}>
        <Text style={[styles.label, { color: palette.text }]}>
          {t("alias.settings.targetScore")}
        </Text>
        <View style={styles.optionRow}>
          {targetScores.map((targetScore) => {
            const isSelected = settings.targetScore === targetScore;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={targetScore}
                onPress={() => updateSettings({ ...settings, targetScore })}
                style={({ pressed }) => [
                  styles.optionButton,
                  {
                    backgroundColor: isSelected
                      ? palette.tint
                      : palette.surface,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: isSelected ? palette.onTint : palette.text },
                  ]}
                >
                  {targetScore}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.settingGroup}>
        <Text style={[styles.label, { color: palette.text }]}>
          {t("alias.settings.penalty")}
        </Text>
        <View
          style={[styles.segmentGroup, { backgroundColor: palette.surface }]}
        >
          {(["minusPoint", "none"] as const).map((penaltyMode) => {
            const isSelected = settings.penaltyMode === penaltyMode;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={penaltyMode}
                onPress={() => setPenaltyMode(penaltyMode)}
                style={({ pressed }) => [
                  styles.segment,
                  {
                    backgroundColor: isSelected ? palette.tint : "transparent",
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: isSelected ? palette.onTint : palette.text },
                  ]}
                >
                  {t(
                    penaltyMode === "minusPoint"
                      ? "alias.penalty.minusPoint"
                      : "alias.penalty.none"
                  )}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.settingGroup}>
        <Text style={[styles.label, { color: palette.text }]}>
          {t("alias.settings.scoreFloor")}
        </Text>
        <View
          style={[styles.segmentGroup, { backgroundColor: palette.surface }]}
        >
          {(["zero", "negative"] as const).map((scoreFloor) => {
            const isSelected = settings.scoreFloor === scoreFloor;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={scoreFloor}
                onPress={() => setScoreFloor(scoreFloor)}
                style={({ pressed }) => [
                  styles.segment,
                  {
                    backgroundColor: isSelected ? palette.tint : "transparent",
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: isSelected ? palette.onTint : palette.text },
                  ]}
                >
                  {t(
                    scoreFloor === "zero"
                      ? "alias.scoreFloor.zero"
                      : "alias.scoreFloor.negative"
                  )}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.settingGroup}>
        <View style={styles.categoryHeader}>
          <View style={styles.headerText}>
            <Text style={[styles.label, { color: palette.text }]}>
              {t("alias.settings.categories")}
            </Text>
            <Text style={[styles.metaText, { color: palette.mutedText }]}>
              {t("alias.settings.categorySummary").replace(
                "{count}",
                String(selectedCount)
              )}
            </Text>
          </View>
        </View>

        <View style={styles.packageList}>
          {aliasPackages.map((contentPackage) => (
            <View key={contentPackage.id} style={styles.packageGroup}>
              <Text style={[styles.packageTitle, { color: palette.text }]}>
                {getLocalizedText(contentPackage.label, language)}
              </Text>
              <View style={styles.categoryList}>
                {contentPackage.categories.map((category) => {
                  const isSelected = settings.selectedCategoryIds.includes(
                    category.id
                  );

                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{
                        selected: isSelected,
                      }}
                      key={category.id}
                      onPress={() => toggleCategory(category.id)}
                      style={({ pressed }) => [
                        styles.categoryRow,
                        {
                          backgroundColor: isSelected
                            ? palette.card
                            : palette.surface,
                          borderColor: isSelected
                            ? palette.tint
                            : palette.border,
                          opacity: pressed ? 0.72 : 1,
                        },
                      ]}
                    >
                      <MaterialIcons
                        color={isSelected ? palette.tint : palette.mutedText}
                        name={
                          isSelected ? "check-circle" : "radio-button-unchecked"
                        }
                        size={22}
                      />
                      <View style={styles.categoryText}>
                        <Text
                          style={[
                            styles.categoryTitle,
                            { color: palette.text },
                          ]}
                        >
                          {getLocalizedText(category.label, language)}
                        </Text>
                        <Text
                          style={[
                            styles.categoryMeta,
                            { color: palette.mutedText },
                          ]}
                        >
                          {t("alias.settings.wordCount").replace(
                            "{count}",
                            String(category.words.length)
                          )}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  settingGroup: {
    gap: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    alignItems: "center",
    borderRadius: 14,
    minHeight: 42,
    minWidth: 58,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "900",
  },
  segmentGroup: {
    borderRadius: 16,
    flexDirection: "row",
    padding: 4,
  },
  segment: {
    alignItems: "center",
    borderRadius: 12,
    flex: 1,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  categoryHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  packageList: {
    gap: 14,
  },
  packageGroup: {
    gap: 8,
  },
  packageTitle: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
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
    minHeight: 60,
    padding: 12,
  },
  categoryText: {
    flex: 1,
    gap: 3,
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
});
