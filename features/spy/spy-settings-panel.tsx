import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Colors } from "@/constants/theme";
import {
  builtinSpyPackageIds,
  builtinSpyPackages,
} from "@/features/spy/content";
import {
  clampSpySettings,
  getAvailableSpyPackageIds,
  getMaxSpyCount,
  MIN_SPY_PLAYERS,
} from "@/features/spy/defaults";
import type { SpyCustomContent, SpySettings } from "@/features/spy/types";
import { getLocalizedText } from "@/features/spy/types";
import type { Language, TranslationKey } from "@/i18n/translations";

interface PackageOption {
  id: string;
  isCustomPackage: boolean;
  itemCount: number;
  name: string;
}

interface SpySettingsPanelProps {
  customContent: SpyCustomContent;
  language: Language;
  onChange: (settings: SpySettings) => void;
  onEditCustomContent: (packageId?: string) => void;
  onRemovePackage: (packageId: string, isCustomPackage: boolean) => void;
  palette: (typeof Colors)["light"];
  participantCount: number;
  settings: SpySettings;
  t: (key: TranslationKey) => string;
}

const durationOptions = [300, 480, 600, 900, 1200] as const;

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function createPackageOptions(
  customContent: SpyCustomContent,
  language: Language
) {
  const builtinOptions: PackageOption[] = builtinSpyPackages
    .map((contentPackage) => ({
      id: contentPackage.id,
      isCustomPackage: false,
      name: getLocalizedText(contentPackage.label, language),
      itemCount:
        contentPackage.items.filter(
          (item) => !customContent.hiddenPlaceIds.includes(item.id)
        ).length +
        (customContent.packages.find(
          (customPackage) => customPackage.id === contentPackage.id
        )?.items.length ?? 0),
    }))
    .filter((option) => !customContent.hiddenPackageIds.includes(option.id));
  const customOptions: PackageOption[] = customContent.packages
    .filter(
      (contentPackage) => !builtinSpyPackageIds.includes(contentPackage.id)
    )
    .map((contentPackage) => ({
      id: contentPackage.id,
      isCustomPackage: true,
      name: contentPackage.name,
      itemCount: contentPackage.items.length,
    }));

  return [...builtinOptions, ...customOptions];
}

function getStepperOpacity(isEnabled: boolean, isPressed: boolean) {
  if (!isEnabled) {
    return 0.38;
  }

  return isPressed ? 0.72 : 1;
}

export function SpySettingsPanel({
  settings,
  participantCount,
  customContent,
  language,
  palette,
  t,
  onChange,
  onEditCustomContent,
  onRemovePackage,
}: SpySettingsPanelProps) {
  const packageOptions = createPackageOptions(customContent, language);
  const packageIds = getAvailableSpyPackageIds(customContent);
  const maxSpyCount = getMaxSpyCount(participantCount);
  const selectedPackageIds = settings.selectedPackageIds.filter((packageId) =>
    packageIds.includes(packageId)
  );
  const selectedPackageCount = selectedPackageIds.length;
  const selectedItemCount = packageOptions
    .filter((option) => selectedPackageIds.includes(option.id))
    .reduce((total, option) => total + option.itemCount, 0);
  const areAllPackagesSelected =
    packageIds.length > 0 && selectedPackageCount === packageIds.length;

  function updateSettings(nextSettings: SpySettings) {
    onChange(clampSpySettings(nextSettings, participantCount, packageIds));
  }

  function setSpyCount(spyCount: number) {
    updateSettings({ ...settings, spyCount });
  }

  function setDuration(durationSec: number) {
    updateSettings({ ...settings, durationSec });
  }

  function toggleShowRoles() {
    updateSettings({ ...settings, showRoles: !settings.showRoles });
  }

  function toggleAllPackages() {
    if (packageIds.length === 0) {
      return;
    }

    updateSettings({
      ...settings,
      selectedPackageIds: areAllPackagesSelected
        ? [packageIds[0] ?? ""]
        : packageIds,
    });
  }

  function togglePackage(packageId: string) {
    const isSelected = selectedPackageIds.includes(packageId);
    const nextPackageIds = isSelected
      ? selectedPackageIds.filter((selectedId) => selectedId !== packageId)
      : [...selectedPackageIds, packageId];

    updateSettings({
      ...settings,
      selectedPackageIds: nextPackageIds,
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.settingGroup}>
        <Text style={[styles.label, { color: palette.text }]}>
          {t("spy.settings.spyCount")}
        </Text>
        <View
          style={[
            styles.stepperRow,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <Pressable
            accessibilityLabel={t("spy.settings.decreaseSpyCount")}
            accessibilityRole="button"
            disabled={maxSpyCount === 0 || settings.spyCount <= 1}
            onPress={() => setSpyCount(settings.spyCount - 1)}
            style={({ pressed }) => [
              styles.iconButton,
              {
                opacity: getStepperOpacity(
                  maxSpyCount > 0 && settings.spyCount > 1,
                  pressed
                ),
              },
            ]}
          >
            <MaterialIcons color={palette.text} name="remove" size={22} />
          </Pressable>
          <View style={styles.stepperValue}>
            <Text style={[styles.stepperNumber, { color: palette.text }]}>
              {settings.spyCount}
            </Text>
            <Text style={[styles.stepperHint, { color: palette.mutedText }]}>
              {maxSpyCount > 0
                ? t("spy.settings.spyCountLimit").replace(
                    "{count}",
                    String(maxSpyCount)
                  )
                : t("spy.settings.needPlayersShort")}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={t("spy.settings.increaseSpyCount")}
            accessibilityRole="button"
            disabled={maxSpyCount === 0 || settings.spyCount >= maxSpyCount}
            onPress={() => setSpyCount(settings.spyCount + 1)}
            style={({ pressed }) => [
              styles.iconButton,
              {
                opacity: getStepperOpacity(
                  maxSpyCount > 0 && settings.spyCount < maxSpyCount,
                  pressed
                ),
              },
            ]}
          >
            <MaterialIcons color={palette.text} name="add" size={22} />
          </Pressable>
        </View>
        {participantCount < MIN_SPY_PLAYERS ? (
          <Text style={[styles.warning, { color: palette.tint }]}>
            {t("spy.warning.minPlayers")}
          </Text>
        ) : null}
      </View>

      <View style={styles.settingGroup}>
        <Text style={[styles.label, { color: palette.text }]}>
          {t("spy.settings.timer")}
        </Text>
        <View style={styles.durationRow}>
          {durationOptions.map((duration) => {
            const isSelected = settings.durationSec === duration;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={duration}
                onPress={() => setDuration(duration)}
                style={({ pressed }) => [
                  styles.durationButton,
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
                    styles.durationText,
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
        <View style={styles.rowHeader}>
          <View style={styles.headerText}>
            <Text style={[styles.label, { color: palette.text }]}>
              {t("spy.settings.packages")}
            </Text>
            <Text style={[styles.metaText, { color: palette.mutedText }]}>
              {t("spy.settings.packageSummary")
                .replace("{packages}", String(selectedPackageCount))
                .replace("{places}", String(selectedItemCount))}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => onEditCustomContent()}
            style={({ pressed }) => [
              styles.manageButton,
              {
                backgroundColor: palette.surface,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <MaterialIcons color={palette.tint} name="edit" size={18} />
            <Text style={[styles.manageText, { color: palette.text }]}>
              {t("spy.custom.manage")}
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: areAllPackagesSelected }}
          onPress={toggleAllPackages}
          style={({ pressed }) => [
            styles.packageRow,
            {
              backgroundColor: areAllPackagesSelected
                ? palette.tint
                : palette.surface,
              borderColor: areAllPackagesSelected
                ? palette.tint
                : palette.border,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <MaterialIcons
            color={areAllPackagesSelected ? palette.onTint : palette.tint}
            name={
              areAllPackagesSelected ? "check-circle" : "radio-button-unchecked"
            }
            size={22}
          />
          <View style={styles.packageText}>
            <Text
              style={[
                styles.packageTitle,
                {
                  color: areAllPackagesSelected ? palette.onTint : palette.text,
                },
              ]}
            >
              {t("spy.settings.allPackages")}
            </Text>
            <Text
              style={[
                styles.packageMeta,
                {
                  color: areAllPackagesSelected
                    ? palette.onTint
                    : palette.mutedText,
                },
              ]}
            >
              {t("spy.settings.allPackagesHelp")}
            </Text>
          </View>
        </Pressable>

        <View style={styles.packageList}>
          {packageOptions.map((option) => {
            const isSelected = selectedPackageIds.includes(option.id);

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={option.id}
                onPress={() => togglePackage(option.id)}
                style={({ pressed }) => [
                  styles.packageRow,
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
                  color={isSelected ? palette.tint : palette.mutedText}
                  name={isSelected ? "check-circle" : "radio-button-unchecked"}
                  size={22}
                />
                <View style={styles.packageText}>
                  <Text style={[styles.packageTitle, { color: palette.text }]}>
                    {option.name}
                  </Text>
                  <Text
                    style={[styles.packageMeta, { color: palette.mutedText }]}
                  >
                    {t("spy.settings.placeCount").replace(
                      "{count}",
                      String(option.itemCount)
                    )}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={t("spy.custom.editPackageItems")}
                  accessibilityRole="button"
                  onPress={(event) => {
                    event.stopPropagation();
                    onEditCustomContent(option.id);
                  }}
                  style={({ pressed }) => [
                    styles.packageAction,
                    {
                      backgroundColor: palette.surface,
                      opacity: pressed ? 0.72 : 1,
                    },
                  ]}
                >
                  <MaterialIcons color={palette.tint} name="info" size={21} />
                </Pressable>
                <Pressable
                  accessibilityLabel={t("spy.custom.removePackage")}
                  accessibilityRole="button"
                  onPress={(event) => {
                    event.stopPropagation();
                    onRemovePackage(option.id, option.isCustomPackage);
                  }}
                  style={({ pressed }) => [
                    styles.packageAction,
                    {
                      backgroundColor: palette.surface,
                      opacity: pressed ? 0.72 : 1,
                    },
                  ]}
                >
                  <MaterialIcons
                    color="#D92D20"
                    name="remove-circle"
                    size={21}
                  />
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: settings.showRoles }}
        onPress={toggleShowRoles}
        style={({ pressed }) => [
          styles.switchRow,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            opacity: pressed ? 0.72 : 1,
          },
        ]}
      >
        <View style={styles.switchText}>
          <Text style={[styles.label, { color: palette.text }]}>
            {t("spy.settings.roles")}
          </Text>
          <Text style={[styles.metaText, { color: palette.mutedText }]}>
            {t("spy.settings.rolesHelp")}
          </Text>
        </View>
        <View
          style={[
            styles.switchTrack,
            {
              backgroundColor: settings.showRoles
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
                transform: [{ translateX: settings.showRoles ? 18 : 0 }],
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
  label: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  stepperRow: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 64,
    padding: 10,
  },
  iconButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  stepperValue: {
    alignItems: "center",
    flex: 1,
    gap: 2,
  },
  stepperNumber: {
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30,
  },
  stepperHint: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
  },
  warning: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  durationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  durationButton: {
    alignItems: "center",
    borderRadius: 14,
    minHeight: 42,
    minWidth: 64,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  durationText: {
    fontSize: 14,
    fontWeight: "900",
  },
  rowHeader: {
    alignItems: "center",
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
  manageButton: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  manageText: {
    fontSize: 13,
    fontWeight: "900",
  },
  packageList: {
    gap: 8,
  },
  packageRow: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 58,
    padding: 12,
  },
  packageText: {
    flex: 1,
    gap: 3,
  },
  packageAction: {
    alignItems: "center",
    borderRadius: 16,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  packageTitle: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  packageMeta: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  switchRow: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 70,
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
