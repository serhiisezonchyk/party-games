import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WEB_APP_MAX_WIDTH } from "@/constants/layout";
import { Colors } from "@/constants/theme";
import { usePreferences } from "@/contexts/preferences-context";
import type { LanguageMode, ThemeMode } from "@/storage/preferences-storage";
import { DateOfBirthPicker } from "./date-of-birth-picker";

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateOnly(value?: string) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDisplayDate(value?: string) {
  const date = parseDateOnly(value);

  if (!date) {
    return "";
  }

  return date.toLocaleDateString();
}

interface SegmentOption<T extends string> {
  label: string;
  value: T;
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly SegmentOption<T>[];
  onChange: (value: T) => void;
}) {
  const { effectiveTheme } = usePreferences();
  const palette = Colors[effectiveTheme];

  return (
    <View style={[styles.segmentGroup, { backgroundColor: palette.surface }]}>
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={option.value}
            onPress={() => onChange(option.value)}
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
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PreferencesModal() {
  const {
    preferences,
    effectiveTheme,
    isSettingsVisible,
    closeSettings,
    setDateOfBirthIso,
    setLanguageMode,
    setThemeMode,
    t,
  } = usePreferences();
  const palette = Colors[effectiveTheme];
  const insets = useSafeAreaInsets();
  const [isRendered, setIsRendered] = useState(isSettingsVisible);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const animationProgress = useRef(new Animated.Value(0)).current;
  const selectedBirthDate = parseDateOnly(preferences.dateOfBirthIso);
  const datePickerValue = selectedBirthDate ?? new Date(2000, 0, 1);

  useEffect(() => {
    if (isSettingsVisible) {
      setIsRendered(true);
      animationProgress.setValue(0);
      Animated.timing(animationProgress, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }).start();
      return;
    }

    if (isRendered) {
      Animated.timing(animationProgress, {
        duration: 160,
        easing: Easing.in(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setIsRendered(false);
        }
      });
    }
  }, [animationProgress, isRendered, isSettingsVisible]);

  const languageOptions: readonly SegmentOption<LanguageMode>[] = [
    { label: t("settings.system"), value: "system" },
    { label: t("settings.english"), value: "en" },
    { label: t("settings.ukrainian"), value: "uk" },
  ];
  const themeOptions: readonly SegmentOption<ThemeMode>[] = [
    { label: t("settings.system"), value: "system" },
    { label: t("settings.light"), value: "light" },
    { label: t("settings.dark"), value: "dark" },
  ];

  const backdropOpacity = animationProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const sheetTranslateY = animationProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [420, 0],
  });

  if (!isRendered) {
    return null;
  }

  return (
    <Modal
      animationType="none"
      onRequestClose={closeSettings}
      transparent
      visible={isRendered}
    >
      <Pressable onPress={closeSettings} style={styles.backdrop}>
        <Animated.View
          pointerEvents="none"
          style={[styles.backdropTint, { opacity: backdropOpacity }]}
        />
        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.sheet,
              {
                backgroundColor: palette.background,
                borderColor: palette.border,
                paddingBottom: 24 + insets.bottom,
              },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: palette.text }]}>
                  {t("settings.title")}
                </Text>
                <Text style={[styles.subtitle, { color: palette.mutedText }]}>
                  {t("settings.subtitle")}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={t("common.close")}
                accessibilityRole="button"
                hitSlop={12}
                onPress={closeSettings}
                style={({ pressed }) => [
                  styles.closeButton,
                  {
                    backgroundColor: palette.surface,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <MaterialIcons color={palette.text} name="close" size={22} />
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: palette.text }]}>
                {t("settings.language")}
              </Text>
              <SegmentedControl
                onChange={setLanguageMode}
                options={languageOptions}
                value={preferences.languageMode}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: palette.text }]}>
                {t("settings.theme")}
              </Text>
              <SegmentedControl
                onChange={setThemeMode}
                options={themeOptions}
                value={preferences.themeMode}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: palette.text }]}>
                {t("settings.dateOfBirth")}
              </Text>
              <Text style={[styles.helperText, { color: palette.mutedText }]}>
                {t("settings.dateOfBirthHelp")}
              </Text>
              <View style={styles.dateRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setIsDatePickerVisible(true)}
                  style={({ pressed }) => [
                    styles.dateButton,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.border,
                      opacity: pressed ? 0.72 : 1,
                    },
                  ]}
                >
                  <MaterialIcons color={palette.tint} name="cake" size={20} />
                  <Text style={[styles.dateText, { color: palette.text }]}>
                    {preferences.dateOfBirthIso
                      ? formatDisplayDate(preferences.dateOfBirthIso)
                      : t("settings.dateOfBirthUnset")}
                  </Text>
                </Pressable>
                {preferences.dateOfBirthIso ? (
                  <Pressable
                    accessibilityLabel={t("settings.clearDateOfBirth")}
                    accessibilityRole="button"
                    onPress={() => setDateOfBirthIso(undefined)}
                    style={({ pressed }) => [
                      styles.clearButton,
                      {
                        backgroundColor: palette.surface,
                        opacity: pressed ? 0.72 : 1,
                      },
                    ]}
                  >
                    <MaterialIcons
                      color={palette.mutedText}
                      name="close"
                      size={20}
                    />
                  </Pressable>
                ) : null}
              </View>
              {isDatePickerVisible ? (
                <View
                  style={[
                    styles.datePickerContainer,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <DateOfBirthPicker
                    backgroundColor={palette.surface}
                    borderColor={palette.border}
                    maximumDate={new Date()}
                    onChange={(date) => setDateOfBirthIso(formatDateOnly(date))}
                    onDismiss={() => setIsDatePickerVisible(false)}
                    textColor={palette.text}
                    value={datePickerValue}
                  />
                </View>
              ) : null}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.34)",
  },
  sheetContainer: {
    alignItems: "center",
    width: "100%",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    gap: 24,
    maxWidth: Platform.OS === "web" ? WEB_APP_MAX_WIDTH : undefined,
    padding: 24,
    width: "100%",
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  section: {
    gap: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
  },
  dateRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  dateButton: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  clearButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  datePickerContainer: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  segmentGroup: {
    borderRadius: 14,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  segment: {
    alignItems: "center",
    borderRadius: 11,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
});
