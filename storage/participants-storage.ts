import { createDefaultParticipants } from "@/features/mafia/defaults";
import type { Participant, ParticipantGender } from "@/features/mafia/types";
import {
  localStorageService,
  storageKeys,
} from "@/storage/local-storage-service";
import { isRecord } from "@/storage/preferences-storage";

function isParticipantGender(value: unknown): value is ParticipantGender {
  return value === "male" || value === "female" || value === "nonBinary";
}

export function parseParticipant(value: unknown): Participant | null {
  if (!(isRecord(value) && typeof value.id === "string")) {
    return null;
  }

  return {
    id: value.id,
    gender: isParticipantGender(value.gender) ? value.gender : "male",
    name: typeof value.name === "string" ? value.name : "",
  };
}

export function parseParticipants(
  value: unknown,
  fallback = createDefaultParticipants()
): Participant[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const participants = value
    .map(parseParticipant)
    .filter((participant): participant is Participant => Boolean(participant));

  return participants.length > 0 ? participants : fallback;
}

export function loadParticipants(fallback = createDefaultParticipants()) {
  return localStorageService.get(storageKeys.participants, fallback, (value) =>
    parseParticipants(value, fallback)
  );
}

export async function saveParticipants(participants: Participant[]) {
  await localStorageService.set(storageKeys.participants, participants);
}
