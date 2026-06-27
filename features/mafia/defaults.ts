import type {
  MafiaSettings,
  MafiaVariant,
  Participant,
} from "@/features/mafia/types";

export const MIN_MAFIA_PLAYERS = 6;
export const MAX_RECENT_COMPANIES = 5;

export const defaultMafiaSettings: MafiaSettings = {
  version: 1,
  variant: "classic",
  speechDurationSec: 60,
  mafiaCount: 2,
  sheriffCount: 1,
  hasDon: true,
  doctorCount: 0,
  prostituteCount: 0,
  homelessCount: 0,
  maniacCount: 0,
};

type CountRoleKey =
  | "mafiaCount"
  | "sheriffCount"
  | "doctorCount"
  | "prostituteCount"
  | "homelessCount"
  | "maniacCount";

export type MafiaRoleLimits = Record<CountRoleKey, number> & {
  donCount: number;
};

export function createParticipant(name = ""): Participant {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    gender: "male",
  };
}

export function createDefaultParticipants() {
  return [
    createParticipant(),
    createParticipant(),
    createParticipant(),
    createParticipant(),
    createParticipant(),
    createParticipant(),
    createParticipant(),
  ];
}

export function createSettingsForVariant(
  variant: MafiaVariant,
  participantCount: number
) {
  return getRecommendedMafiaSettings(participantCount, {
    ...defaultMafiaSettings,
    variant,
  }).settings;
}

export function getRecommendedMafiaSettings(
  participantCount: number,
  currentSettings: MafiaSettings
) {
  const playerCount = Math.max(participantCount, MIN_MAFIA_PLAYERS);
  const mafiaCount = Math.max(1, Math.floor(playerCount / 3));
  const hasDon = mafiaCount >= 2;
  const baseSettings: MafiaSettings = {
    ...currentSettings,
    mafiaCount,
    sheriffCount: 1,
    hasDon,
  };

  if (currentSettings.variant === "classic") {
    return {
      settings: clampMafiaSettingsForParticipants(
        {
          ...baseSettings,
          doctorCount: 0,
          prostituteCount: 0,
          homelessCount: 0,
          maniacCount: 0,
        },
        participantCount
      ),
      warningKey:
        participantCount < MIN_MAFIA_PLAYERS
          ? "mafia.warning.minPlayers"
          : undefined,
    } as const;
  }

  return {
    settings: clampMafiaSettingsForParticipants(
      {
        ...baseSettings,
        doctorCount: playerCount >= 6 ? 1 : 0,
        prostituteCount: playerCount >= 9 ? 1 : 0,
        homelessCount: playerCount >= 10 ? 1 : 0,
        maniacCount: playerCount >= 11 ? 1 : 0,
      },
      participantCount
    ),
    warningKey:
      participantCount < MIN_MAFIA_PLAYERS
        ? "mafia.warning.minPlayers"
        : undefined,
  } as const;
}

export function getMafiaRoleLimits(
  participantCount: number,
  settings: MafiaSettings
): MafiaRoleLimits {
  const playerCount = Math.max(0, participantCount);
  const isExpanded = settings.variant === "expanded";
  const mafiaMax =
    playerCount >= MIN_MAFIA_PLAYERS
      ? Math.max(1, Math.floor(playerCount / 3))
      : Math.max(0, Math.floor(playerCount / 3));

  return {
    mafiaCount: Math.min(playerCount, mafiaMax),
    sheriffCount: playerCount >= MIN_MAFIA_PLAYERS ? 1 : 0,
    donCount:
      playerCount >= MIN_MAFIA_PLAYERS && settings.mafiaCount >= 2 ? 1 : 0,
    doctorCount: isExpanded && playerCount >= MIN_MAFIA_PLAYERS ? 1 : 0,
    prostituteCount: isExpanded && playerCount >= 8 ? 1 : 0,
    homelessCount: isExpanded && playerCount >= 9 ? 1 : 0,
    maniacCount: isExpanded && playerCount >= 10 ? 1 : 0,
  };
}

export function countMafiaRoles(settings: MafiaSettings) {
  return (
    settings.mafiaCount +
    settings.sheriffCount +
    (settings.variant === "expanded"
      ? settings.doctorCount +
        settings.prostituteCount +
        settings.homelessCount +
        settings.maniacCount
      : 0)
  );
}

function clampCount(value: number, max: number) {
  return Math.max(0, Math.min(max, value));
}

export function clampMafiaSettingsForParticipants(
  settings: MafiaSettings,
  participantCount: number
) {
  const limits = getMafiaRoleLimits(participantCount, settings);
  const nextSettings: MafiaSettings = {
    ...settings,
    mafiaCount: clampCount(settings.mafiaCount, limits.mafiaCount),
    sheriffCount: clampCount(settings.sheriffCount, limits.sheriffCount),
    hasDon: settings.hasDon && limits.donCount > 0,
    doctorCount: clampCount(settings.doctorCount, limits.doctorCount),
    prostituteCount: clampCount(
      settings.prostituteCount,
      limits.prostituteCount
    ),
    homelessCount: clampCount(settings.homelessCount, limits.homelessCount),
    maniacCount: clampCount(settings.maniacCount, limits.maniacCount),
  };

  let overflow = countMafiaRoles(nextSettings) - participantCount;
  const reduceRole = (key: CountRoleKey) => {
    if (overflow <= 0) {
      return;
    }

    const reduction = Math.min(nextSettings[key], overflow);
    nextSettings[key] -= reduction;
    overflow -= reduction;
  };

  reduceRole("maniacCount");
  reduceRole("homelessCount");
  reduceRole("prostituteCount");
  reduceRole("doctorCount");
  reduceRole("sheriffCount");
  reduceRole("mafiaCount");
  nextSettings.hasDon = nextSettings.hasDon && nextSettings.mafiaCount >= 2;

  return nextSettings;
}
