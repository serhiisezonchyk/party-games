import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Colors } from "@/constants/theme";
import {
  builtinSpyPackageIds,
  builtinSpyPackages,
} from "@/features/spy/content";
import { defaultSpyCustomContent } from "@/features/spy/defaults";
import type {
  CustomSpyPackage,
  CustomSpyPlace,
  CustomSpyRole,
  SpyCustomContent,
} from "@/features/spy/types";
import { getLocalizedText } from "@/features/spy/types";
import type { Language, TranslationKey } from "@/i18n/translations";

interface SpyContentModalProps {
  customContent: SpyCustomContent;
  initialPackageId?: string;
  language: Language;
  onChange: (customContent: SpyCustomContent) => void;
  onClose: () => void;
  palette: (typeof Colors)["light"];
  t: (key: TranslationKey) => string;
  visible: boolean;
}

interface PackageOption {
  id: string;
  isCustomPackage: boolean;
  name: string;
}

interface PlaceOption {
  id: string;
  isCustomPlace: boolean;
  name: string;
  roles: readonly RoleOption[];
}

interface RoleOption {
  id: string;
  isCustomRole: boolean;
  name: string;
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createPackageOptions(
  customContent: SpyCustomContent,
  language: Language
): PackageOption[] {
  const builtinOptions = builtinSpyPackages
    .filter(
      (contentPackage) =>
        !customContent.hiddenPackageIds.includes(contentPackage.id)
    )
    .map((contentPackage) => ({
      id: contentPackage.id,
      isCustomPackage: false,
      name: getLocalizedText(contentPackage.label, language),
    }));
  const customOptions = customContent.packages
    .filter(
      (contentPackage) => !builtinSpyPackageIds.includes(contentPackage.id)
    )
    .map((contentPackage) => ({
      id: contentPackage.id,
      isCustomPackage: true,
      name: contentPackage.name,
    }));

  return [...builtinOptions, ...customOptions];
}

function findBuiltinPackage(packageId: string) {
  return builtinSpyPackages.find(
    (contentPackage) => contentPackage.id === packageId
  );
}

function findCustomPackage(customContent: SpyCustomContent, packageId: string) {
  return customContent.packages.find(
    (contentPackage) => contentPackage.id === packageId
  );
}

function getPackageName(
  packageId: string,
  customContent: SpyCustomContent,
  language: Language
) {
  const builtinPackage = findBuiltinPackage(packageId);

  if (builtinPackage) {
    return getLocalizedText(builtinPackage.label, language);
  }

  return findCustomPackage(customContent, packageId)?.name ?? "";
}

function createPlaceOptions(
  customContent: SpyCustomContent,
  packageId: string,
  language: Language
): PlaceOption[] {
  const builtinPackage = findBuiltinPackage(packageId);
  const customPackage = findCustomPackage(customContent, packageId);
  const builtinPlaces: PlaceOption[] =
    builtinPackage?.items
      .filter((item) => !customContent.hiddenPlaceIds.includes(item.id))
      .map((item) => ({
        id: item.id,
        isCustomPlace: false,
        name: getLocalizedText(item.label, language),
        roles: [
          ...item.roles
            .filter((role) => !customContent.hiddenRoleIds.includes(role.id))
            .map((role) => ({
              id: role.id,
              isCustomRole: false,
              name: getLocalizedText(role.label, language),
            })),
          ...(customPackage?.roleAdditions[item.id] ?? []).map((role) => ({
            id: role.id,
            isCustomRole: true,
            name: role.name,
          })),
        ],
      })) ?? [];
  const customPlaces: PlaceOption[] =
    customPackage?.items.map((item) => ({
      id: item.id,
      isCustomPlace: true,
      name: item.name,
      roles: [
        ...item.roles.map((role) => ({
          id: role.id,
          isCustomRole: true,
          name: role.name,
        })),
        ...(customPackage.roleAdditions[item.id] ?? []).map((role) => ({
          id: role.id,
          isCustomRole: true,
          name: role.name,
        })),
      ],
    })) ?? [];

  return [...builtinPlaces, ...customPlaces];
}

function upsertCustomPackage(
  customContent: SpyCustomContent,
  packageId: string,
  name: string,
  updater: (contentPackage: CustomSpyPackage) => CustomSpyPackage
) {
  const existingPackage = findCustomPackage(customContent, packageId);
  const basePackage: CustomSpyPackage = existingPackage ?? {
    id: packageId,
    name,
    items: [],
    roleAdditions: {},
  };
  const nextPackage = updater(basePackage);
  const nextPackages = existingPackage
    ? customContent.packages.map((contentPackage) =>
        contentPackage.id === packageId ? nextPackage : contentPackage
      )
    : [...customContent.packages, nextPackage];

  return {
    version: 1,
    hiddenPackageIds: customContent.hiddenPackageIds,
    hiddenPlaceIds: customContent.hiddenPlaceIds,
    hiddenRoleIds: customContent.hiddenRoleIds,
    packages: nextPackages,
  } satisfies SpyCustomContent;
}

function addUniqueId(ids: string[], id: string) {
  return ids.includes(id) ? ids : [...ids, id];
}

export function SpyContentModal({
  visible,
  customContent,
  initialPackageId,
  language,
  palette,
  t,
  onClose,
  onChange,
}: SpyContentModalProps) {
  const packageOptions = useMemo(
    () => createPackageOptions(customContent, language),
    [customContent, language]
  );
  const [selectedPackageId, setSelectedPackageId] = useState(
    packageOptions[0]?.id ?? ""
  );
  const placeOptions = useMemo(
    () => createPlaceOptions(customContent, selectedPackageId, language),
    [customContent, language, selectedPackageId]
  );
  const [selectedPlaceId, setSelectedPlaceId] = useState(
    placeOptions[0]?.id ?? ""
  );
  const [packageName, setPackageName] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [roleName, setRoleName] = useState("");

  useEffect(() => {
    if (
      visible &&
      initialPackageId &&
      packageOptions.some((option) => option.id === initialPackageId)
    ) {
      setSelectedPackageId(initialPackageId);
      return;
    }

    if (!packageOptions.some((option) => option.id === selectedPackageId)) {
      setSelectedPackageId(packageOptions[0]?.id ?? "");
    }
  }, [initialPackageId, packageOptions, selectedPackageId, visible]);

  useEffect(() => {
    if (!placeOptions.some((option) => option.id === selectedPlaceId)) {
      setSelectedPlaceId(placeOptions[0]?.id ?? "");
    }
  }, [placeOptions, selectedPlaceId]);

  const selectedPackageName = getPackageName(
    selectedPackageId,
    customContent,
    language
  );
  const selectedPlace = placeOptions.find(
    (place) => place.id === selectedPlaceId
  );
  const canAddPackage = packageName.trim().length > 0;
  const canAddPlace = selectedPackageId && placeName.trim().length > 0;
  const canAddRole =
    selectedPackageId && selectedPlaceId && roleName.trim().length > 0;

  function addPackage() {
    const trimmedName = packageName.trim();

    if (!trimmedName) {
      return;
    }

    const packageId = createId("custom-package");
    const nextPackage: CustomSpyPackage = {
      id: packageId,
      name: trimmedName,
      items: [],
      roleAdditions: {},
    };

    onChange({
      version: 1,
      hiddenPackageIds: customContent.hiddenPackageIds,
      hiddenPlaceIds: customContent.hiddenPlaceIds,
      hiddenRoleIds: customContent.hiddenRoleIds,
      packages: [...customContent.packages, nextPackage],
    });
    setSelectedPackageId(packageId);
    setPackageName("");
  }

  function addPlace() {
    const trimmedName = placeName.trim();

    if (!(selectedPackageId && trimmedName)) {
      return;
    }

    const nextPlace: CustomSpyPlace = {
      id: createId("custom-place"),
      name: trimmedName,
      roles: [],
    };

    onChange(
      upsertCustomPackage(
        customContent,
        selectedPackageId,
        selectedPackageName,
        (contentPackage) => ({
          ...contentPackage,
          items: [...contentPackage.items, nextPlace],
        })
      )
    );
    setSelectedPlaceId(nextPlace.id);
    setPlaceName("");
  }

  function deleteCustomPlace(placeId: string) {
    onChange(
      upsertCustomPackage(
        customContent,
        selectedPackageId,
        selectedPackageName,
        (contentPackage) => ({
          ...contentPackage,
          items: contentPackage.items.filter((item) => item.id !== placeId),
          roleAdditions: Object.fromEntries(
            Object.entries(contentPackage.roleAdditions).filter(
              ([rolePlaceId]) => rolePlaceId !== placeId
            )
          ),
        })
      )
    );
  }

  function removePlace(place: PlaceOption) {
    if (place.isCustomPlace) {
      deleteCustomPlace(place.id);
      return;
    }

    onChange({
      ...customContent,
      hiddenPlaceIds: addUniqueId(customContent.hiddenPlaceIds, place.id),
    });
  }

  function addRole() {
    const trimmedName = roleName.trim();

    if (!(selectedPackageId && selectedPlaceId && trimmedName)) {
      return;
    }

    const nextRole: CustomSpyRole = {
      id: createId("custom-role"),
      name: trimmedName,
    };

    onChange(
      upsertCustomPackage(
        customContent,
        selectedPackageId,
        selectedPackageName,
        (contentPackage) => {
          const item = contentPackage.items.find(
            (customItem) => customItem.id === selectedPlaceId
          );

          if (item) {
            return {
              ...contentPackage,
              items: contentPackage.items.map((customItem) =>
                customItem.id === selectedPlaceId
                  ? { ...customItem, roles: [...customItem.roles, nextRole] }
                  : customItem
              ),
            };
          }

          return {
            ...contentPackage,
            roleAdditions: {
              ...contentPackage.roleAdditions,
              [selectedPlaceId]: [
                ...(contentPackage.roleAdditions[selectedPlaceId] ?? []),
                nextRole,
              ],
            },
          };
        }
      )
    );
    setRoleName("");
  }

  function deleteCustomRole(placeId: string, roleId: string) {
    onChange(
      upsertCustomPackage(
        customContent,
        selectedPackageId,
        selectedPackageName,
        (contentPackage) => ({
          ...contentPackage,
          items: contentPackage.items.map((item) =>
            item.id === placeId
              ? {
                  ...item,
                  roles: item.roles.filter((role) => role.id !== roleId),
                }
              : item
          ),
          roleAdditions: {
            ...contentPackage.roleAdditions,
            [placeId]: (contentPackage.roleAdditions[placeId] ?? []).filter(
              (role) => role.id !== roleId
            ),
          },
        })
      )
    );
  }

  function removeRole(placeId: string, role: RoleOption) {
    if (role.isCustomRole) {
      deleteCustomRole(placeId, role.id);
      return;
    }

    onChange({
      ...customContent,
      hiddenRoleIds: addUniqueId(customContent.hiddenRoleIds, role.id),
    });
  }

  function updateCustomRoleName(placeId: string, roleId: string, name: string) {
    onChange(
      upsertCustomPackage(
        customContent,
        selectedPackageId,
        selectedPackageName,
        (contentPackage) => ({
          ...contentPackage,
          items: contentPackage.items.map((item) =>
            item.id === placeId
              ? {
                  ...item,
                  roles: item.roles.map((role) =>
                    role.id === roleId ? { ...role, name } : role
                  ),
                }
              : item
          ),
          roleAdditions: {
            ...contentPackage.roleAdditions,
            [placeId]: (contentPackage.roleAdditions[placeId] ?? []).map(
              (role) => (role.id === roleId ? { ...role, name } : role)
            ),
          },
        })
      )
    );
  }

  function restoreDefaults() {
    Alert.alert(t("spy.custom.restoreTitle"), t("spy.custom.restoreBody"), [
      { text: t("spy.custom.restoreCancel"), style: "cancel" },
      {
        text: t("spy.custom.restoreConfirm"),
        style: "destructive",
        onPress: () => onChange(defaultSpyCustomContent),
      },
    ]);
  }

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
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: palette.text }]}>
                {t("spy.custom.title")}
              </Text>
              <Text style={[styles.subtitle, { color: palette.mutedText }]}>
                {t("spy.custom.subtitle")}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={restoreDefaults}
              style={({ pressed }) => [
                styles.restoreButton,
                {
                  backgroundColor: palette.surface,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <MaterialIcons color={palette.tint} name="restore" size={19} />
              <Text style={[styles.restoreText, { color: palette.text }]}>
                {t("spy.custom.restore")}
              </Text>
            </Pressable>
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
          >
            <View style={styles.formGroup}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>
                {t("spy.custom.packages")}
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  accessibilityLabel={t("spy.custom.packageName")}
                  onChangeText={setPackageName}
                  placeholder={t("spy.custom.packageName")}
                  placeholderTextColor={palette.mutedText}
                  style={[
                    styles.input,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.border,
                      color: palette.text,
                    },
                  ]}
                  value={packageName}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={!canAddPackage}
                  onPress={addPackage}
                  style={({ pressed }) => [
                    styles.addButton,
                    {
                      backgroundColor: canAddPackage
                        ? palette.tint
                        : palette.surface,
                      opacity: pressed ? 0.72 : 1,
                    },
                  ]}
                >
                  <MaterialIcons
                    color={canAddPackage ? palette.onTint : palette.mutedText}
                    name="add"
                    size={22}
                  />
                </Pressable>
              </View>
              <View style={styles.chipList}>
                {packageOptions.map((option) => {
                  const isSelected = option.id === selectedPackageId;

                  return (
                    <View key={option.id} style={styles.chipWrap}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => setSelectedPackageId(option.id)}
                        style={({ pressed }) => [
                          styles.chip,
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
                            styles.chipText,
                            {
                              color: isSelected ? palette.onTint : palette.text,
                            },
                          ]}
                        >
                          {option.name}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>
                {t("spy.custom.items")}
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  accessibilityLabel={t("spy.custom.itemName")}
                  onChangeText={setPlaceName}
                  placeholder={t("spy.custom.itemName")}
                  placeholderTextColor={palette.mutedText}
                  style={[
                    styles.input,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.border,
                      color: palette.text,
                    },
                  ]}
                  value={placeName}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={!canAddPlace}
                  onPress={addPlace}
                  style={({ pressed }) => [
                    styles.addButton,
                    {
                      backgroundColor: canAddPlace
                        ? palette.tint
                        : palette.surface,
                      opacity: pressed ? 0.72 : 1,
                    },
                  ]}
                >
                  <MaterialIcons
                    color={canAddPlace ? palette.onTint : palette.mutedText}
                    name="add"
                    size={22}
                  />
                </Pressable>
              </View>
              <View style={styles.placeList}>
                {placeOptions.map((place) => {
                  const isSelected = place.id === selectedPlaceId;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      key={place.id}
                      onPress={() => setSelectedPlaceId(place.id)}
                      style={({ pressed }) => [
                        styles.placeRow,
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
                      <View style={styles.placeText}>
                        <Text
                          style={[styles.placeName, { color: palette.text }]}
                        >
                          {place.name}
                        </Text>
                        <Text
                          style={[
                            styles.placeMeta,
                            { color: palette.mutedText },
                          ]}
                        >
                          {t("spy.custom.roleCount").replace(
                            "{count}",
                            String(place.roles.length)
                          )}
                        </Text>
                      </View>
                      <Pressable
                        accessibilityLabel={t("spy.custom.removeItem")}
                        accessibilityRole="button"
                        onPress={() => removePlace(place)}
                        style={styles.deleteButton}
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

            <View style={styles.formGroup}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>
                {t("spy.custom.roles")}
              </Text>
              <Text style={[styles.helperText, { color: palette.mutedText }]}>
                {selectedPlace
                  ? t("spy.custom.selectedItem").replace(
                      "{item}",
                      selectedPlace.name
                    )
                  : t("spy.custom.noItem")}
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  accessibilityLabel={t("spy.custom.roleName")}
                  onChangeText={setRoleName}
                  placeholder={t("spy.custom.roleName")}
                  placeholderTextColor={palette.mutedText}
                  style={[
                    styles.input,
                    {
                      backgroundColor: palette.surface,
                      borderColor: palette.border,
                      color: palette.text,
                    },
                  ]}
                  value={roleName}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={!canAddRole}
                  onPress={addRole}
                  style={({ pressed }) => [
                    styles.addButton,
                    {
                      backgroundColor: canAddRole
                        ? palette.tint
                        : palette.surface,
                      opacity: pressed ? 0.72 : 1,
                    },
                  ]}
                >
                  <MaterialIcons
                    color={canAddRole ? palette.onTint : palette.mutedText}
                    name="add"
                    size={22}
                  />
                </Pressable>
              </View>
              {selectedPlace ? (
                <View style={styles.roleList}>
                  {selectedPlace.roles.map((role) => (
                    <View
                      key={role.id}
                      style={[
                        styles.roleRow,
                        {
                          backgroundColor: palette.surface,
                          borderColor: palette.border,
                        },
                      ]}
                    >
                      {role.isCustomRole ? (
                        <TextInput
                          accessibilityLabel={t("spy.custom.roleName")}
                          onChangeText={(name) =>
                            updateCustomRoleName(
                              selectedPlace.id,
                              role.id,
                              name
                            )
                          }
                          style={[
                            styles.roleInput,
                            {
                              color: palette.text,
                              borderColor: palette.border,
                            },
                          ]}
                          value={role.name}
                        />
                      ) : (
                        <Text
                          style={[styles.roleName, { color: palette.text }]}
                        >
                          {role.name}
                        </Text>
                      )}
                      <Pressable
                        accessibilityLabel={t("spy.custom.removeRole")}
                        accessibilityRole="button"
                        onPress={() => removeRole(selectedPlace.id, role)}
                        style={styles.deleteButton}
                      >
                        <MaterialIcons
                          color="#D92D20"
                          name="remove-circle"
                          size={20}
                        />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
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
    maxHeight: "90%",
    padding: 20,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  restoreButton: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    gap: 5,
    minHeight: 36,
    paddingHorizontal: 10,
  },
  restoreText: {
    fontSize: 12,
    fontWeight: "900",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30,
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
  content: {
    gap: 22,
    paddingBottom: 28,
  },
  formGroup: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  },
  helperText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  inputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  chipList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipWrap: {
    alignItems: "center",
    flexDirection: "row",
  },
  chip: {
    borderRadius: 14,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18,
  },
  placeList: {
    gap: 8,
  },
  placeRow: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 58,
    padding: 12,
  },
  placeText: {
    flex: 1,
    gap: 3,
  },
  placeName: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  placeMeta: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  deleteButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  roleList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleRow: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    minHeight: 38,
    paddingLeft: 12,
  },
  roleInput: {
    borderBottomWidth: 1,
    flex: 1,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18,
    minHeight: 34,
    minWidth: 160,
    paddingVertical: 4,
  },
  roleName: {
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18,
  },
});
