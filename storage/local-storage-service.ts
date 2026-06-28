import AsyncStorage from "@react-native-async-storage/async-storage";

export const storageKeys = {
  preferences: "party-games.preferences.v1",
  participants: "party-games.participants.current.v1",
  mafiaRecentCompanies: "party-games.mafia.recentCompanies.v1",
  mafiaCurrentSettings: "party-games.mafia.currentSettings.v1",
  mafiaActiveGame: "party-games.mafia.activeGame.v1",
  spyParticipants: "party-games.spy.participants.v1",
  spyCurrentSettings: "party-games.spy.currentSettings.v1",
  spyCustomContent: "party-games.spy.customContent.v1",
  spyActiveGame: "party-games.spy.activeGame.v1",
} as const;

export type StorageKey = (typeof storageKeys)[keyof typeof storageKeys];

type Parser<T> = (value: unknown) => T;

async function get<T>(
  key: StorageKey,
  fallback: T,
  parser: Parser<T>
): Promise<T> {
  const storedValue = await AsyncStorage.getItem(key);

  if (!storedValue) {
    return fallback;
  }

  try {
    return parser(JSON.parse(storedValue));
  } catch {
    return fallback;
  }
}

async function set<T>(key: StorageKey, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function update<T>(
  key: StorageKey,
  fallback: T,
  updater: (currentValue: T) => T,
  parser: Parser<T>
): Promise<T> {
  const currentValue = await get(key, fallback, parser);
  const nextValue = updater(currentValue);

  await set(key, nextValue);

  return nextValue;
}

async function remove(key: StorageKey): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export const localStorageService = {
  get,
  set,
  update,
  remove,
};
