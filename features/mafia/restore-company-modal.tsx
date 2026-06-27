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
import type { SavedCompany } from "@/features/mafia/types";
import type { TranslationKey } from "@/i18n/translations";

interface RestoreCompanyModalProps {
  companies: SavedCompany[];
  onClose: () => void;
  onDelete: (companyId: string) => void;
  onRestore: (company: SavedCompany) => void;
  palette: (typeof Colors)["light"];
  t: (key: TranslationKey) => string;
  visible: boolean;
}

export function RestoreCompanyModal({
  visible,
  companies,
  palette,
  t,
  onClose,
  onRestore,
  onDelete,
}: RestoreCompanyModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[
            styles.modal,
            {
              backgroundColor: palette.background,
              borderColor: palette.border,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: palette.text }]}>
                {t("mafia.restore.title")}
              </Text>
              <Text style={[styles.subtitle, { color: palette.mutedText }]}>
                {t("mafia.restore.subtitle")}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={t("common.close")}
              accessibilityRole="button"
              hitSlop={12}
              onPress={onClose}
              style={[styles.iconButton, { backgroundColor: palette.surface }]}
            >
              <MaterialIcons color={palette.text} name="close" size={22} />
            </Pressable>
          </View>

          {companies.length === 0 ? (
            <Text style={[styles.empty, { color: palette.mutedText }]}>
              {t("mafia.restore.empty")}
            </Text>
          ) : (
            <ScrollView contentContainerStyle={styles.companyList}>
              {companies.map((company) => (
                <View
                  key={company.id}
                  style={[
                    styles.companyRow,
                    {
                      backgroundColor: palette.card,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onRestore(company)}
                    style={styles.companyMain}
                  >
                    <Text
                      style={[styles.companyTitle, { color: palette.text }]}
                    >
                      {company.participants
                        .map((participant) => participant.name)
                        .slice(0, 3)
                        .join(", ")}
                    </Text>
                    <Text
                      style={[styles.companyMeta, { color: palette.mutedText }]}
                    >
                      {t("mafia.restore.players")}:{" "}
                      {company.participants.length}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={t("mafia.restore.delete")}
                    accessibilityRole="button"
                    onPress={() => onDelete(company.id)}
                    style={styles.deleteButton}
                  >
                    <MaterialIcons color="#D92D20" name="delete" size={22} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.34)",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    borderRadius: 22,
    borderWidth: 1,
    gap: 20,
    maxHeight: "80%",
    padding: 20,
    width: "100%",
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  iconButton: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  empty: {
    fontSize: 15,
    lineHeight: 22,
  },
  companyList: {
    gap: 10,
  },
  companyRow: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  companyMain: {
    flex: 1,
    gap: 4,
  },
  companyTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  companyMeta: {
    fontSize: 13,
    fontWeight: "700",
  },
  deleteButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
});
