import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Colors } from "@/constants/theme";
import {
  clampMafiaSettingsForParticipants,
  countMafiaRoles,
  getMafiaRoleLimits,
  getRecommendedMafiaSettings,
} from "@/features/mafia/defaults";
import type { MafiaSettings, MafiaVariant } from "@/features/mafia/types";
import type { TranslationKey } from "@/i18n/translations";

interface MafiaSettingsPanelProps {
  onChange: (settings: MafiaSettings) => void;
  palette: (typeof Colors)["light"];
  participantCount: number;
  settings: MafiaSettings;
  t: (key: TranslationKey) => string;
}

const speechDurations = [30, 45, 60, 90, 120] as const;

function getStepperOpacity(isEnabled: boolean, isPressed: boolean) {
  if (!isEnabled) {
    return 0.38;
  }

  return isPressed ? 0.72 : 1;
}

export function MafiaSettingsPanel({
  settings,
  participantCount,
  palette,
  t,
  onChange,
}: MafiaSettingsPanelProps) {
  const recommendation = getRecommendedMafiaSettings(
    participantCount,
    settings
  );
  const roleLimits = getMafiaRoleLimits(participantCount, settings);
  const roleCount = countMafiaRoles(settings);
  const remainingRoleSlots = Math.max(0, participantCount - roleCount);
  const civilianCount = Math.max(0, participantCount - roleCount);

  function setVariant(variant: MafiaVariant) {
    onChange(
      getRecommendedMafiaSettings(participantCount, { ...settings, variant })
        .settings
    );
  }

  function setSpeechDuration(speechDurationSec: number) {
    onChange({ ...settings, speechDurationSec });
  }

  function setRoleCount(
    key:
      | "mafiaCount"
      | "sheriffCount"
      | "doctorCount"
      | "prostituteCount"
      | "homelessCount"
      | "maniacCount",
    value: number
  ) {
    onChange(
      clampMafiaSettingsForParticipants(
        {
          ...settings,
          [key]: value,
        },
        participantCount
      )
    );
  }

  function setDonCount(value: number) {
    onChange(
      clampMafiaSettingsForParticipants(
        {
          ...settings,
          hasDon: value > 0,
        },
        participantCount
      )
    );
  }

  function getStepperMax(roleMax: number, currentValue: number) {
    return Math.min(roleMax, currentValue + remainingRoleSlots);
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={[styles.label, { color: palette.text }]}>
          {t("mafia.settings.variant")}
        </Text>
        <View
          style={[styles.segmentGroup, { backgroundColor: palette.surface }]}
        >
          {(["classic", "expanded"] as const).map((variant) => {
            const isSelected = settings.variant === variant;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={variant}
                onPress={() => setVariant(variant)}
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
                    variant === "classic"
                      ? "mafia.variant.classic"
                      : "mafia.variant.expanded"
                  )}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: palette.text }]}>
          {t("mafia.settings.speechDuration")}
        </Text>
        <View style={styles.durationRow}>
          {speechDurations.map((duration) => {
            const isSelected = settings.speechDurationSec === duration;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={duration}
                onPress={() => setSpeechDuration(duration)}
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
                  {duration}
                  {t("mafia.settings.secondsShort")}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View
        style={[
          styles.summary,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      >
        <View style={styles.summaryHeader}>
          <MaterialIcons color={palette.tint} name="auto-awesome" size={20} />
          <Text style={[styles.summaryTitle, { color: palette.text }]}>
            {t("mafia.settings.recommended")}
          </Text>
        </View>
        <View style={styles.roleList}>
          <RoleStepper
            label={t("mafia.role.mafia")}
            max={getStepperMax(roleLimits.mafiaCount, settings.mafiaCount)}
            min={1}
            onChange={(value) => setRoleCount("mafiaCount", value)}
            palette={palette}
            value={settings.mafiaCount}
          />
          <RoleStepper
            label={t("mafia.role.sheriff")}
            max={getStepperMax(roleLimits.sheriffCount, settings.sheriffCount)}
            onChange={(value) => setRoleCount("sheriffCount", value)}
            palette={palette}
            value={settings.sheriffCount}
          />
          <RoleStepper
            label={t("mafia.role.don")}
            max={roleLimits.donCount}
            onChange={setDonCount}
            palette={palette}
            value={settings.hasDon ? 1 : 0}
          />
          {settings.variant === "expanded" ? (
            <>
              <RoleStepper
                label={t("mafia.role.doctor")}
                max={getStepperMax(
                  roleLimits.doctorCount,
                  settings.doctorCount
                )}
                onChange={(value) => setRoleCount("doctorCount", value)}
                palette={palette}
                value={settings.doctorCount}
              />
              <RoleStepper
                label={t("mafia.role.prostitute")}
                max={getStepperMax(
                  roleLimits.prostituteCount,
                  settings.prostituteCount
                )}
                onChange={(value) => setRoleCount("prostituteCount", value)}
                palette={palette}
                value={settings.prostituteCount}
              />
              <RoleStepper
                label={t("mafia.role.homeless")}
                max={getStepperMax(
                  roleLimits.homelessCount,
                  settings.homelessCount
                )}
                onChange={(value) => setRoleCount("homelessCount", value)}
                palette={palette}
                value={settings.homelessCount}
              />
              <RoleStepper
                label={t("mafia.role.maniac")}
                max={getStepperMax(
                  roleLimits.maniacCount,
                  settings.maniacCount
                )}
                onChange={(value) => setRoleCount("maniacCount", value)}
                palette={palette}
                value={settings.maniacCount}
              />
            </>
          ) : null}
          <View
            style={[styles.readonlyRoleRow, { backgroundColor: palette.card }]}
          >
            <Text style={[styles.roleLabel, { color: palette.text }]}>
              {t("mafia.role.civilian")}
            </Text>
            <Text style={[styles.roleValue, { color: palette.mutedText }]}>
              {civilianCount}
            </Text>
          </View>
        </View>
        {recommendation.warningKey ? (
          <Text style={[styles.warning, { color: palette.tint }]}>
            {t(recommendation.warningKey)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function RoleStepper({
  label,
  value,
  min = 0,
  max,
  onChange,
  palette,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  palette: (typeof Colors)["light"];
}) {
  const resolvedMax = max ?? 99;
  const canDecrement = value > min;
  const canIncrement = value < resolvedMax;

  return (
    <View style={[styles.roleRow, { backgroundColor: palette.card }]}>
      <Text style={[styles.roleLabel, { color: palette.text }]}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          disabled={!canDecrement}
          onPress={() => onChange(value - 1)}
          style={({ pressed }) => [
            styles.stepperButton,
            {
              backgroundColor: palette.surface,
              opacity: getStepperOpacity(canDecrement, pressed),
            },
          ]}
        >
          <MaterialIcons color={palette.text} name="remove" size={20} />
        </Pressable>
        <Text style={[styles.roleValue, { color: palette.text }]}>{value}</Text>
        <Pressable
          accessibilityRole="button"
          disabled={!canIncrement}
          onPress={() => onChange(value + 1)}
          style={({ pressed }) => [
            styles.stepperButton,
            {
              backgroundColor: palette.surface,
              opacity: getStepperOpacity(canIncrement, pressed),
            },
          ]}
        >
          <MaterialIcons color={palette.text} name="add" size={20} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  section: {
    gap: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "800",
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
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  durationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  durationButton: {
    borderRadius: 12,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  durationText: {
    fontSize: 14,
    fontWeight: "800",
  },
  summary: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  summaryHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  roleList: {
    gap: 8,
  },
  roleRow: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 10,
  },
  readonlyRoleRow: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 48,
    padding: 10,
  },
  stepper: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  stepperButton: {
    alignItems: "center",
    borderRadius: 14,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  roleValue: {
    fontSize: 17,
    fontWeight: "900",
    minWidth: 24,
    textAlign: "center",
  },
  roleLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
  },
  warning: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
});
