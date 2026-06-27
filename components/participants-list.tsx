import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  NestableDraggableFlatList,
  type RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import type { Colors } from "@/constants/theme";
import type { Participant, ParticipantGender } from "@/features/mafia/types";
import type { TranslationKey } from "@/i18n/translations";

interface GenderOption {
  labelKey: TranslationKey;
  value: ParticipantGender;
}

const genderOptions: readonly GenderOption[] = [
  { value: "male", labelKey: "participants.gender.male" },
  { value: "female", labelKey: "participants.gender.female" },
  { value: "nonBinary", labelKey: "participants.gender.nonBinary" },
];

interface ParticipantsListProps {
  onAdd: () => void;
  onChange: (participants: Participant[]) => void;
  palette: (typeof Colors)["light"];
  participants: Participant[];
  t: (key: TranslationKey) => string;
  withLeading?: boolean;
}

export function ParticipantsList({
  participants,
  withLeading = false,
  palette,
  t,
  onChange,
  onAdd,
}: ParticipantsListProps) {
  function updateParticipant(
    participantId: string,
    updates: Partial<Participant>
  ) {
    onChange(
      participants.map((participant) =>
        participant.id === participantId
          ? { ...participant, ...updates }
          : participant
      )
    );
  }

  function deleteParticipant(participantId: string) {
    onChange(
      participants.filter((participant) => participant.id !== participantId)
    );
  }

  const renderItem = ({
    item,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<Participant>) => {
    const index = getIndex() ?? 0;
    const isLeader = withLeading && index === 0;

    return (
      <ScaleDecorator>
        <Swipeable
          activeOffsetX={[-16, 16]}
          dragOffsetFromRightEdge={16}
          failOffsetY={[-8, 8]}
          friction={2}
          overshootRight={false}
          renderRightActions={() => (
            <Pressable
              accessibilityLabel={t("participants.delete")}
              accessibilityRole="button"
              onPress={() => deleteParticipant(item.id)}
              style={styles.deleteAction}
            >
              <MaterialIcons color="#FFFFFF" name="delete" size={24} />
            </Pressable>
          )}
        >
          <View
            style={[
              styles.row,
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
                opacity: isActive ? 0.86 : 1,
              },
            ]}
          >
            <Pressable
              accessibilityLabel={t("participants.drag")}
              accessibilityRole="button"
              onLongPress={drag}
              style={({ pressed }) => [
                styles.leadIcon,
                {
                  backgroundColor: isActive ? palette.surface : "transparent",
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              {isLeader ? (
                <MaterialIcons
                  color={palette.tint}
                  name="emoji-events"
                  size={22}
                />
              ) : (
                <MaterialIcons
                  color={palette.mutedText}
                  name="drag-indicator"
                  size={22}
                />
              )}
            </Pressable>

            <View style={styles.rowContent}>
              <TextInput
                accessibilityLabel={t("participants.name")}
                onChangeText={(name) => updateParticipant(item.id, { name })}
                placeholder={t("participants.namePlaceholder")}
                placeholderTextColor={palette.mutedText}
                rejectResponderTermination={false}
                scrollEnabled={false}
                style={[
                  styles.nameInput,
                  {
                    color: palette.text,
                    borderColor: palette.border,
                  },
                ]}
                value={item.name}
              />
              <View style={styles.genderRow}>
                {genderOptions.map((option) => {
                  const isSelected = item.gender === option.value;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      key={option.value}
                      onPress={() =>
                        updateParticipant(item.id, { gender: option.value })
                      }
                      style={({ pressed }) => [
                        styles.genderButton,
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
                          styles.genderText,
                          { color: isSelected ? palette.onTint : palette.text },
                        ]}
                      >
                        {t(option.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </Swipeable>
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.container}>
      <NestableDraggableFlatList
        activationDistance={28}
        autoscrollSpeed={140}
        autoscrollThreshold={72}
        data={participants}
        dragItemOverflow
        keyExtractor={(participant) => participant.id}
        onDragEnd={({ data }) => onChange(data)}
        renderItem={renderItem}
        scrollEnabled={false}
      />
      <Pressable
        accessibilityRole="button"
        onPress={onAdd}
        style={({ pressed }) => [
          styles.addRow,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            opacity: pressed ? 0.72 : 1,
          },
        ]}
      >
        <MaterialIcons color={palette.tint} name="add" size={24} />
        <Text style={[styles.addText, { color: palette.text }]}>
          {t("participants.add")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  row: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
    padding: 12,
  },
  leadIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 28,
  },
  rowContent: {
    flex: 1,
    gap: 10,
  },
  nameInput: {
    borderBottomWidth: 1,
    fontSize: 17,
    fontWeight: "700",
    minHeight: 38,
    paddingVertical: 6,
  },
  genderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genderButton: {
    borderRadius: 12,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  genderText: {
    fontSize: 13,
    fontWeight: "800",
  },
  deleteAction: {
    alignItems: "center",
    backgroundColor: "#D92D20",
    borderRadius: 16,
    justifyContent: "center",
    marginBottom: 10,
    width: 78,
  },
  addRow: {
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
    fontSize: 16,
    fontWeight: "800",
  },
});
