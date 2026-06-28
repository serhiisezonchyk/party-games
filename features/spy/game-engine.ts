import type { Participant } from "@/features/mafia/types";
import {
  builtinSpyPackageIds,
  builtinSpyPackages,
} from "@/features/spy/content";
import {
  clampSpySettings,
  getNamedSpyParticipants,
} from "@/features/spy/defaults";
import type {
  CustomSpyPackage,
  CustomSpyPlace,
  CustomSpyRole,
  SpyActiveGame,
  SpyCustomContent,
  SpySettings,
} from "@/features/spy/types";
import { getLocalizedText } from "@/features/spy/types";
import type { Language } from "@/i18n/translations";

interface VisibleRole {
  id: string;
  name: string;
}

interface VisiblePlace {
  id: string;
  name: string;
  packageId: string;
  packageName: string;
  roles: VisibleRole[];
}

interface VisiblePackage {
  id: string;
  items: VisiblePlace[];
  name: string;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function shuffle<T>(items: readonly T[], random = Math.random) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    const item = nextItems[index];
    nextItems[index] = nextItems[randomIndex];
    nextItems[randomIndex] = item;
  }

  return nextItems;
}

function customRolesToVisible(roles: readonly CustomSpyRole[]): VisibleRole[] {
  return roles.map((role) => ({ id: role.id, name: role.name }));
}

function customPlacesToVisible({
  customPackage,
  language,
  packageId,
  packageName,
}: {
  customPackage?: CustomSpyPackage;
  language: Language;
  packageId: string;
  packageName: string;
}) {
  return (
    customPackage?.items.map((item) =>
      customPlaceToVisible({
        item,
        language,
        packageId,
        packageName,
        roleAdditions: customPackage.roleAdditions[item.id] ?? [],
      })
    ) ?? []
  );
}

function customPlaceToVisible({
  item,
  packageId,
  packageName,
  roleAdditions,
}: {
  item: CustomSpyPlace;
  language: Language;
  packageId: string;
  packageName: string;
  roleAdditions: readonly CustomSpyRole[];
}): VisiblePlace {
  return {
    id: item.id,
    name: item.name,
    packageId,
    packageName,
    roles: [
      ...customRolesToVisible(item.roles),
      ...customRolesToVisible(roleAdditions),
    ],
  };
}

export function getVisibleSpyPackages(
  customContent: SpyCustomContent,
  language: Language
): VisiblePackage[] {
  const builtinVisiblePackages = builtinSpyPackages
    .filter(
      (contentPackage) =>
        !customContent.hiddenPackageIds.includes(contentPackage.id)
    )
    .map<VisiblePackage>((contentPackage) => {
      const customPackage = customContent.packages.find(
        (item) => item.id === contentPackage.id
      );
      const packageName = getLocalizedText(contentPackage.label, language);
      const builtinItems = contentPackage.items
        .filter((item) => !customContent.hiddenPlaceIds.includes(item.id))
        .map<VisiblePlace>((item) => ({
          id: item.id,
          name: getLocalizedText(item.label, language),
          packageId: contentPackage.id,
          packageName,
          roles: [
            ...item.roles
              .filter((role) => !customContent.hiddenRoleIds.includes(role.id))
              .map((role) => ({
                id: role.id,
                name: getLocalizedText(role.label, language),
              })),
            ...customRolesToVisible(
              customPackage?.roleAdditions[item.id] ?? []
            ),
          ],
        }));

      return {
        id: contentPackage.id,
        name: packageName,
        items: [
          ...builtinItems,
          ...customPlacesToVisible({
            customPackage,
            language,
            packageId: contentPackage.id,
            packageName,
          }),
        ],
      };
    });
  const customOnlyPackages = customContent.packages
    .filter(
      (contentPackage) => !builtinSpyPackageIds.includes(contentPackage.id)
    )
    .map<VisiblePackage>((contentPackage) => ({
      id: contentPackage.id,
      name: contentPackage.name,
      items: customPlacesToVisible({
        customPackage: contentPackage,
        language,
        packageId: contentPackage.id,
        packageName: contentPackage.name,
      }),
    }));

  return [...builtinVisiblePackages, ...customOnlyPackages].filter(
    (contentPackage) => contentPackage.items.length > 0
  );
}

export function getVisibleSpyPlaces(
  customContent: SpyCustomContent,
  settings: SpySettings,
  language: Language
) {
  const selectedPackageIds = new Set(settings.selectedPackageIds);

  return getVisibleSpyPackages(customContent, language)
    .filter((contentPackage) => selectedPackageIds.has(contentPackage.id))
    .flatMap((contentPackage) => contentPackage.items);
}

function createSpyPlayerStates({
  participants,
  place,
  random,
  settings,
}: {
  participants: Participant[];
  place: VisiblePlace;
  random: () => number;
  settings: SpySettings;
}): SpyActiveGame["players"] {
  const spyIndexes = new Set(
    shuffle(
      participants.map((_participant, index) => index),
      random
    ).slice(0, settings.spyCount)
  );
  const roles = shuffle(place.roles, random);

  return participants.map((participant, index) => {
    const isSpy = spyIndexes.has(index);

    if (isSpy) {
      return { participant, isSpy };
    }

    const role = roles.length > 0 ? roles[index % roles.length] : undefined;

    return {
      participant,
      isSpy,
      placeName: place.name,
      roleName: settings.showRoles ? role?.name : undefined,
    };
  });
}

export function createSpyActiveGame({
  customContent,
  language,
  participants,
  random = Math.random,
  settings,
}: {
  customContent: SpyCustomContent;
  language: Language;
  participants: Participant[];
  random?: () => number;
  settings: SpySettings;
}): SpyActiveGame | null {
  const namedParticipants = getNamedSpyParticipants(participants);
  const visiblePackages = getVisibleSpyPackages(customContent, language);
  const clampedSettings = clampSpySettings(
    settings,
    namedParticipants.length,
    visiblePackages.map((contentPackage) => contentPackage.id)
  );
  const visiblePlaces = visiblePackages
    .filter((contentPackage) =>
      clampedSettings.selectedPackageIds.includes(contentPackage.id)
    )
    .flatMap((contentPackage) => contentPackage.items);
  const place = shuffle(visiblePlaces, random)[0];

  if (!(place && namedParticipants.length >= 3)) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    version: 1,
    id: createId(),
    createdAt: now,
    phase: "cardReveal",
    revealIndex: 0,
    settings: clampedSettings,
    place: {
      id: place.id,
      packageId: place.packageId,
      packageName: place.packageName,
      name: place.name,
    },
    players: createSpyPlayerStates({
      participants: namedParticipants,
      place,
      random,
      settings: clampedSettings,
    }),
  };
}
