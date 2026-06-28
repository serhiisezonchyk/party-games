import type { TranslationKey } from "@/i18n/translations";

export type GameId =
  | "spy"
  | "mafia"
  | "alias"
  | "truth-or-dare"
  | "never-have-i-ever"
  | "brain-on";

export interface GameDefinition {
  descriptionKey: TranslationKey;
  id: GameId;
  playersKey: TranslationKey;
  titleKey: TranslationKey;
}

export const games = [
  {
    id: "spy",
    titleKey: "games.spy.title",
    descriptionKey: "games.spy.description",
    playersKey: "games.spy.players",
  },
  {
    id: "mafia",
    titleKey: "games.mafia.title",
    descriptionKey: "games.mafia.description",
    playersKey: "games.mafia.players",
  },
  {
    id: "alias",
    titleKey: "games.alias.title",
    descriptionKey: "games.alias.description",
    playersKey: "games.alias.players",
  },
  {
    id: "truth-or-dare",
    titleKey: "games.truthOrDare.title",
    descriptionKey: "games.truthOrDare.description",
    playersKey: "games.truthOrDare.players",
  },
  {
    id: "never-have-i-ever",
    titleKey: "games.neverHaveIEver.title",
    descriptionKey: "games.neverHaveIEver.description",
    playersKey: "games.neverHaveIEver.players",
  },
  {
    id: "brain-on",
    titleKey: "games.brainOn.title",
    descriptionKey: "games.brainOn.description",
    playersKey: "games.brainOn.players",
  },
] as const satisfies readonly GameDefinition[];

export function getGameById(gameId: string) {
  return games.find((game) => game.id === gameId);
}
