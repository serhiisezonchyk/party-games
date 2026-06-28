import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { Colors } from "@/constants/theme";
import {
  createAliasParticipant,
  createAliasTeam,
} from "@/features/alias/defaults";
import type { AliasTeam } from "@/features/alias/types";
import type { TranslationKey } from "@/i18n/translations";

interface AliasTeamListProps {
  onChange: (teams: AliasTeam[]) => void;
  palette: (typeof Colors)["light"];
  t: (key: TranslationKey) => string;
  teams: AliasTeam[];
}

function getRemoveTeamOpacity(isDisabled: boolean, isPressed: boolean) {
  if (isDisabled) {
    return 0.4;
  }

  return isPressed ? 0.72 : 1;
}

export function AliasTeamList({
  teams,
  palette,
  t,
  onChange,
}: AliasTeamListProps) {
  function updateTeam(teamId: string, updates: Partial<AliasTeam>) {
    onChange(
      teams.map((team) => (team.id === teamId ? { ...team, ...updates } : team))
    );
  }

  function updateParticipant(
    teamId: string,
    participantId: string,
    name: string
  ) {
    onChange(
      teams.map((team) =>
        team.id === teamId
          ? {
              ...team,
              participants: team.participants.map((participant) =>
                participant.id === participantId
                  ? { ...participant, name }
                  : participant
              ),
            }
          : team
      )
    );
  }

  function addTeam() {
    onChange([...teams, createAliasTeam(`Team ${teams.length + 1}`)]);
  }

  function removeTeam(teamId: string) {
    if (teams.length <= 2) {
      return;
    }

    onChange(teams.filter((team) => team.id !== teamId));
  }

  function addParticipant(teamId: string) {
    onChange(
      teams.map((team) =>
        team.id === teamId
          ? {
              ...team,
              participants: [...team.participants, createAliasParticipant()],
            }
          : team
      )
    );
  }

  function removeParticipant(teamId: string, participantId: string) {
    onChange(
      teams.map((team) =>
        team.id === teamId
          ? {
              ...team,
              participants: team.participants.filter(
                (participant) => participant.id !== participantId
              ),
            }
          : team
      )
    );
  }

  return (
    <View style={styles.container}>
      {teams.map((team, teamIndex) => (
        <View
          key={team.id}
          style={[
            styles.teamCard,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <View style={styles.teamHeader}>
            <View style={styles.teamTitleGroup}>
              <Text style={[styles.teamNumber, { color: palette.tint }]}>
                {t("alias.teams.teamLabel").replace(
                  "{number}",
                  String(teamIndex + 1)
                )}
              </Text>
              <TextInput
                accessibilityLabel={t("alias.teams.teamName")}
                onChangeText={(name) => updateTeam(team.id, { name })}
                placeholder={t("alias.teams.teamNamePlaceholder")}
                placeholderTextColor={palette.mutedText}
                style={[
                  styles.teamNameInput,
                  { color: palette.text, borderColor: palette.border },
                ]}
                value={team.name}
              />
            </View>
            <Pressable
              accessibilityLabel={t("alias.teams.removeTeam")}
              accessibilityRole="button"
              disabled={teams.length <= 2}
              onPress={() => removeTeam(team.id)}
              style={({ pressed }) => [
                styles.iconButton,
                {
                  backgroundColor: palette.surface,
                  opacity: getRemoveTeamOpacity(teams.length <= 2, pressed),
                },
              ]}
            >
              <MaterialIcons color="#D92D20" name="delete" size={20} />
            </Pressable>
          </View>

          <View style={styles.participants}>
            {team.participants.map((participant, participantIndex) => (
              <View
                key={participant.id}
                style={[
                  styles.participantRow,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                  },
                ]}
              >
                <Text
                  style={[styles.participantIndex, { color: palette.tint }]}
                >
                  {participantIndex + 1}
                </Text>
                <TextInput
                  accessibilityLabel={t("alias.teams.participantName")}
                  onChangeText={(name) =>
                    updateParticipant(team.id, participant.id, name)
                  }
                  placeholder={t("participants.namePlaceholder")}
                  placeholderTextColor={palette.mutedText}
                  style={[styles.nameInput, { color: palette.text }]}
                  value={participant.name}
                />
                <Pressable
                  accessibilityLabel={t("participants.delete")}
                  accessibilityRole="button"
                  onPress={() => removeParticipant(team.id, participant.id)}
                  style={({ pressed }) => [
                    styles.smallIconButton,
                    { opacity: pressed ? 0.72 : 1 },
                  ]}
                >
                  <MaterialIcons
                    color={palette.mutedText}
                    name="remove-circle-outline"
                    size={21}
                  />
                </Pressable>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityLabel={t("alias.teams.addParticipant")}
            accessibilityRole="button"
            onPress={() => addParticipant(team.id)}
            style={({ pressed }) => [
              styles.addParticipantButton,
              {
                backgroundColor: "transparent",
                borderColor: palette.border,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <MaterialIcons color={palette.tint} name="add" size={26} />
          </Pressable>
        </View>
      ))}

      <Pressable
        accessibilityRole="button"
        onPress={addTeam}
        style={({ pressed }) => [
          styles.addTeamButton,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            opacity: pressed ? 0.72 : 1,
          },
        ]}
      >
        <MaterialIcons color={palette.tint} name="group-add" size={22} />
        <Text style={[styles.addText, { color: palette.text }]}>
          {t("alias.teams.addTeam")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  teamCard: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
    padding: 14,
  },
  teamHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  teamTitleGroup: {
    flex: 1,
    gap: 5,
  },
  teamNumber: {
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  teamNameInput: {
    borderBottomWidth: 1,
    fontSize: 20,
    fontWeight: "900",
    minHeight: 38,
    paddingVertical: 5,
  },
  iconButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  participants: {
    gap: 8,
  },
  participantRow: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 12,
  },
  participantIndex: {
    fontSize: 13,
    fontWeight: "900",
    minWidth: 18,
    textAlign: "center",
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    minHeight: 42,
    paddingVertical: 6,
  },
  smallIconButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 34,
  },
  addParticipantButton: {
    alignItems: "center",
    borderRadius: 14,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
  },
  addTeamButton: {
    alignItems: "center",
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 58,
  },
  addText: {
    fontSize: 15,
    fontWeight: "900",
  },
});
