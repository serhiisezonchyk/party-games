import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { Colors } from "@/constants/theme";
import type { GameId } from "@/data/games";
import { mafiaRoleRules } from "@/features/mafia/rules";
import type { TranslationKey } from "@/i18n/translations";

interface RulesSection {
  bodyKey: TranslationKey;
  titleKey: TranslationKey;
}

const gameRuleSections: Record<GameId, RulesSection[]> = {
  mafia: [
    { titleKey: "mafia.rules.flowTitle", bodyKey: "mafia.rules.flowBody" },
    {
      titleKey: "mafia.rules.classicTitle",
      bodyKey: "mafia.rules.classicBody",
    },
    {
      titleKey: "mafia.rules.expandedTitle",
      bodyKey: "mafia.rules.expandedBody",
    },
    { titleKey: "mafia.rules.winTitle", bodyKey: "mafia.rules.winBody" },
  ],
  spy: [
    { titleKey: "spy.rules.goalTitle", bodyKey: "spy.rules.goalBody" },
    { titleKey: "spy.rules.setupTitle", bodyKey: "spy.rules.setupBody" },
    {
      titleKey: "spy.rules.questionsTitle",
      bodyKey: "spy.rules.questionsBody",
    },
    {
      titleKey: "spy.rules.accusationTitle",
      bodyKey: "spy.rules.accusationBody",
    },
    { titleKey: "spy.rules.spyGuessTitle", bodyKey: "spy.rules.spyGuessBody" },
    { titleKey: "spy.rules.timerTitle", bodyKey: "spy.rules.timerBody" },
  ],
  alias: [
    { titleKey: "alias.rules.goalTitle", bodyKey: "alias.rules.goalBody" },
    { titleKey: "alias.rules.teamsTitle", bodyKey: "alias.rules.teamsBody" },
    {
      titleKey: "alias.rules.explainTitle",
      bodyKey: "alias.rules.explainBody",
    },
    { titleKey: "alias.rules.scoreTitle", bodyKey: "alias.rules.scoreBody" },
  ],
  "truth-or-dare": [
    { titleKey: "game.rules.soonTitle", bodyKey: "game.rules.soonBody" },
  ],
};

interface GameRulesModalProps {
  gameId: GameId;
  onClose: () => void;
  palette: (typeof Colors)["light"];
  t: (key: TranslationKey) => string;
  visible: boolean;
}

export function GameRulesModal({
  gameId,
  visible,
  palette,
  t,
  onClose,
}: GameRulesModalProps) {
  const sections = gameRuleSections[gameId];

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: palette.background,
              borderColor: palette.border,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.text }]}>
              {t("game.rules.title")}
            </Text>
            <Pressable
              accessibilityLabel={t("common.close")}
              accessibilityRole="button"
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: palette.surface }]}
            >
              <MaterialIcons color={palette.text} name="close" size={22} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            style={styles.scrollArea}
          >
            {sections.map((section) => (
              <View key={section.titleKey} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>
                  {t(section.titleKey)}
                </Text>
                <Text style={[styles.body, { color: palette.mutedText }]}>
                  {t(section.bodyKey)}
                </Text>
              </View>
            ))}

            {gameId === "mafia" ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>
                  {t("mafia.rules.rolesTitle")}
                </Text>
                {mafiaRoleRules.map((role) => (
                  <View
                    key={role.titleKey}
                    style={[
                      styles.roleCard,
                      {
                        backgroundColor: palette.card,
                        borderColor: palette.border,
                      },
                    ]}
                  >
                    <Text style={[styles.roleTitle, { color: palette.text }]}>
                      {t(role.titleKey)}
                    </Text>
                    <Text style={[styles.body, { color: palette.mutedText }]}>
                      {t(role.descriptionKey)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.34)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    flex: 1,
    maxHeight: "86%",
    padding: 20,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  content: {
    gap: 18,
    paddingBottom: 20,
  },
  scrollArea: {
    flex: 1,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  roleCard: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
});
