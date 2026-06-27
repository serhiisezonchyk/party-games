import { clampMafiaSettingsForParticipants } from "@/features/mafia/defaults";
import type {
  MafiaActiveGame,
  MafiaNightActions,
  MafiaPlayerState,
  MafiaRole,
  MafiaScriptAction,
  MafiaScriptStep,
  MafiaSettings,
  MafiaWinner,
  Participant,
} from "@/features/mafia/types";
import type { TranslationKey } from "@/i18n/translations";

const roleTitleKeys: Record<MafiaRole, TranslationKey> = {
  civilian: "mafia.role.civilian",
  mafia: "mafia.role.mafia",
  don: "mafia.role.don",
  sheriff: "mafia.role.sheriff",
  doctor: "mafia.role.doctor",
  prostitute: "mafia.role.prostitute",
  homeless: "mafia.role.homeless",
  maniac: "mafia.role.maniac",
};

const roleDescriptionKeys: Record<MafiaRole, TranslationKey> = {
  civilian: "mafia.ruleRole.civilian.description",
  mafia: "mafia.ruleRole.mafia.description",
  don: "mafia.ruleRole.don.description",
  sheriff: "mafia.ruleRole.sheriff.description",
  doctor: "mafia.ruleRole.doctor.description",
  prostitute: "mafia.ruleRole.prostitute.description",
  homeless: "mafia.ruleRole.homeless.description",
  maniac: "mafia.ruleRole.maniac.description",
};

export const roleIcons: Record<
  MafiaRole,
  keyof typeof import("@expo/vector-icons/MaterialIcons").default.glyphMap
> = {
  civilian: "person",
  mafia: "groups",
  don: "admin-panel-settings",
  sheriff: "local-police",
  doctor: "medical-services",
  prostitute: "block",
  homeless: "visibility",
  maniac: "dangerous",
};

export function getRoleTitleKey(role: MafiaRole) {
  return roleTitleKeys[role];
}

export function getRoleDescriptionKey(role: MafiaRole) {
  return roleDescriptionKeys[role];
}

export function normalizeNamedParticipants(participants: Participant[]) {
  return participants
    .map((participant) => ({
      ...participant,
      name: participant.name.trim(),
    }))
    .filter((participant) => participant.name.length > 0);
}

function shuffleRoles(roles: MafiaRole[]) {
  const nextRoles = [...roles];

  for (let index = nextRoles.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const role = nextRoles[index];
    nextRoles[index] = nextRoles[randomIndex];
    nextRoles[randomIndex] = role;
  }

  return nextRoles;
}

function repeatRole(role: MafiaRole, count: number) {
  return Array.from({ length: Math.max(0, count) }, () => role);
}

function buildRoleDeck(settings: MafiaSettings, playerCount: number) {
  const clampedSettings = clampMafiaSettingsForParticipants(
    settings,
    playerCount
  );
  const donCount = clampedSettings.hasDon ? 1 : 0;
  const roleDeck: MafiaRole[] = [
    ...repeatRole("mafia", clampedSettings.mafiaCount - donCount),
    ...repeatRole("don", donCount),
    ...repeatRole("sheriff", clampedSettings.sheriffCount),
  ];

  if (clampedSettings.variant === "expanded") {
    roleDeck.push(
      ...repeatRole("doctor", clampedSettings.doctorCount),
      ...repeatRole("prostitute", clampedSettings.prostituteCount),
      ...repeatRole("homeless", clampedSettings.homelessCount),
      ...repeatRole("maniac", clampedSettings.maniacCount)
    );
  }

  while (roleDeck.length < playerCount) {
    roleDeck.push("civilian");
  }

  return shuffleRoles(roleDeck.slice(0, playerCount));
}

export function createMafiaActiveGame(
  participants: Participant[],
  settings: MafiaSettings
): MafiaActiveGame {
  const namedParticipants = normalizeNamedParticipants(participants);
  const [leader, ...playingParticipants] = namedParticipants;
  const roleDeck = buildRoleDeck(settings, playingParticipants.length);
  const now = new Date().toISOString();
  const players: MafiaPlayerState[] = playingParticipants.map(
    (participant, index) => ({
      participant,
      role: roleDeck[index] ?? "civilian",
      isAlive: true,
    })
  );

  return {
    version: 1,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    round: 1,
    leader: leader ?? participants[0],
    players,
    settings,
    phase: "roleReveal",
    revealIndex: 0,
    scriptIndex: 0,
    daySpeakerIndex: 0,
    tieSpeakerIndex: 0,
    nightActions: {},
    nominations: {},
    votingCandidateIds: [],
    tiedCandidateIds: [],
    votes: {},
  };
}

function hasAliveRole(game: MafiaActiveGame, roles: MafiaRole[]) {
  return game.players.some(
    (player) => player.isAlive && roles.includes(player.role)
  );
}

export function getNightScriptSteps(game: MafiaActiveGame): MafiaScriptStep[] {
  const steps: MafiaScriptStep[] = [{ textKey: "mafia.script.citySleeps" }];
  const hasMafia = hasAliveRole(game, ["mafia", "don"]);
  const hasDon = hasAliveRole(game, ["don"]);
  const hasManiac = hasAliveRole(game, ["maniac"]);

  if (hasMafia) {
    steps.push(
      { textKey: "mafia.script.mafiaWake" },
      { textKey: "mafia.script.mafiaChoose", action: "mafiaTargetId" },
      { dynamicText: "mafiaTargetSummary" },
      { textKey: "mafia.script.mafiaSleep" }
    );
  }

  if (hasDon) {
    steps.push(
      { textKey: "mafia.script.donWake" },
      {
        textKey: "mafia.script.donChoose",
        action: "donTargetId",
        resultType: "don",
      },
      { dynamicText: "donResultSummary" },
      { textKey: "mafia.script.donSleep" }
    );
  }

  if (hasAliveRole(game, ["doctor"])) {
    steps.push(
      { textKey: "mafia.script.doctorWake" },
      { textKey: "mafia.script.doctorChoose", action: "doctorTargetId" },
      { dynamicText: "doctorTargetSummary" },
      { textKey: "mafia.script.doctorSleep" }
    );
  }

  if (hasAliveRole(game, ["prostitute"])) {
    steps.push(
      { textKey: "mafia.script.prostituteWake" },
      {
        textKey: "mafia.script.prostituteChoose",
        action: "prostituteTargetId",
      },
      { dynamicText: "prostituteTargetSummary" },
      { textKey: "mafia.script.prostituteSleep" }
    );
  }

  if (hasAliveRole(game, ["sheriff"])) {
    steps.push(
      { textKey: "mafia.script.sheriffWake" },
      {
        textKey: "mafia.script.sheriffChoose",
        action: "sheriffTargetId",
        resultType: "sheriff",
      },
      { dynamicText: "sheriffResultSummary" },
      { textKey: "mafia.script.sheriffSleep" }
    );
  }

  if (hasAliveRole(game, ["homeless"])) {
    steps.push(
      { textKey: "mafia.script.homelessWake" },
      {
        textKey: "mafia.script.homelessChoose",
        action: "homelessTargetId",
        resultType: "homeless",
      },
      { dynamicText: "homelessResultSummary" },
      { textKey: "mafia.script.homelessSleep" }
    );
  }

  if (hasManiac) {
    steps.push(
      { textKey: "mafia.script.maniacWake" },
      { textKey: "mafia.script.maniacChoose", action: "maniacTargetId" },
      { dynamicText: "maniacTargetSummary" },
      { textKey: "mafia.script.maniacSleep" }
    );
  }

  steps.push({ textKey: "mafia.script.cityWake" });

  const resolution = getNightResolution(game);

  if (hasMafia && resolution.mafia?.killed) {
    steps.push({ dynamicText: "mafiaOutcomeSummary" });
  }

  if (hasManiac && resolution.maniac?.killed) {
    steps.push({ dynamicText: "maniacOutcomeSummary" });
  }

  steps.push({ dynamicText: "nightOutcomeSummary" });

  return steps;
}

export function getAlivePlayers(game: MafiaActiveGame) {
  return game.players.filter((player) => player.isAlive);
}

function isMafiaTeamRole(role: MafiaRole) {
  return role === "mafia" || role === "don";
}

function isCivilianThreatRole(role: MafiaRole) {
  return isMafiaTeamRole(role) || role === "maniac";
}

export function getWinCondition(game: MafiaActiveGame): MafiaWinner | null {
  const alivePlayers = getAlivePlayers(game);
  const aliveMafiaCount = alivePlayers.filter((player) =>
    isMafiaTeamRole(player.role)
  ).length;
  const aliveNonMafiaCount = alivePlayers.length - aliveMafiaCount;
  const hasAliveCivilianThreat = alivePlayers.some((player) =>
    isCivilianThreatRole(player.role)
  );

  if (!hasAliveCivilianThreat) {
    return "civilians";
  }

  if (aliveMafiaCount > 0 && aliveMafiaCount >= aliveNonMafiaCount) {
    return "mafia";
  }

  return null;
}

export function finishGameIfWon(game: MafiaActiveGame) {
  const winner = getWinCondition(game);

  if (!winner) {
    return game;
  }

  return {
    ...game,
    phase: "ended" as const,
    winner,
    endedAt: new Date().toISOString(),
  };
}

export function getPlayerById(game: MafiaActiveGame, participantId: string) {
  return game.players.find((player) => player.participant.id === participantId);
}

export function getTargetOptions(
  game: MafiaActiveGame,
  action?: MafiaScriptAction,
  speakerId?: string
) {
  const alivePlayers = getAlivePlayers(game);

  if (action === "mafiaTargetId") {
    return alivePlayers;
  }

  if (action === "donTargetId") {
    return alivePlayers.filter(
      (player) => player.role !== "mafia" && player.role !== "don"
    );
  }

  return alivePlayers.filter((player) => player.participant.id !== speakerId);
}

function isBlocked(game: MafiaActiveGame, actionRole: MafiaRole | MafiaRole[]) {
  const blockedPlayerId = game.nightActions.prostituteTargetId;

  if (!blockedPlayerId) {
    return false;
  }

  const blockedPlayer = getPlayerById(game, blockedPlayerId);
  const blockedRoles = Array.isArray(actionRole) ? actionRole : [actionRole];

  return Boolean(blockedPlayer && blockedRoles.includes(blockedPlayer.role));
}

export function isNightActionBlocked(
  game: MafiaActiveGame,
  actionRole: MafiaRole | MafiaRole[]
) {
  return isBlocked(game, actionRole);
}

type NightAttackActor = "mafia" | "maniac";

export interface NightAttackResolution {
  actor: NightAttackActor;
  blocked: boolean;
  killed: boolean;
  protected: boolean;
  targetId?: string;
}

export interface NightResolution {
  killedIds: string[];
  mafia?: NightAttackResolution;
  maniac?: NightAttackResolution;
  protectedId?: string;
}

function createAttackResolution({
  actor,
  blocked,
  protectedId,
  targetId,
}: {
  actor: NightAttackActor;
  blocked: boolean;
  protectedId?: string;
  targetId?: string;
}): NightAttackResolution {
  const isProtected = Boolean(targetId && protectedId === targetId);

  return {
    actor,
    blocked,
    protected: !blocked && isProtected,
    killed: Boolean(targetId && !blocked && !isProtected),
    targetId,
  };
}

export function getNightResolution(game: MafiaActiveGame): NightResolution {
  const protectedId = isBlocked(game, "doctor")
    ? undefined
    : game.nightActions.doctorTargetId;
  const mafia = game.nightActions.mafiaTargetId
    ? createAttackResolution({
        actor: "mafia",
        blocked: isBlocked(game, ["mafia", "don"]),
        protectedId,
        targetId: game.nightActions.mafiaTargetId,
      })
    : undefined;
  const maniac = game.nightActions.maniacTargetId
    ? createAttackResolution({
        actor: "maniac",
        blocked: isBlocked(game, "maniac"),
        protectedId,
        targetId: game.nightActions.maniacTargetId,
      })
    : undefined;
  const killedIds = Array.from(
    new Set(
      [mafia, maniac]
        .filter((attack): attack is NightAttackResolution =>
          Boolean(attack?.killed && attack.targetId)
        )
        .map((attack) => attack.targetId as string)
    )
  );

  return {
    killedIds,
    mafia,
    maniac,
    protectedId,
  };
}

export function resolveNightActions(game: MafiaActiveGame) {
  const eliminatedIds = new Set(getNightResolution(game).killedIds);

  return {
    ...game,
    players: game.players.map((player) => {
      if (!eliminatedIds.has(player.participant.id)) {
        return player;
      }

      return {
        ...player,
        isAlive: false,
        eliminatedReason: "night" as const,
      };
    }),
  };
}

export function getSheriffResultKey(game: MafiaActiveGame, targetId?: string) {
  if (!targetId || isBlocked(game, "sheriff")) {
    return "mafia.night.resultNoInformation" as TranslationKey;
  }

  const target = getPlayerById(game, targetId);

  return target?.role === "mafia" || target?.role === "don"
    ? "mafia.night.resultMafia"
    : "mafia.night.resultNotMafia";
}

export function getDonResultKey(game: MafiaActiveGame, targetId?: string) {
  if (!targetId || isBlocked(game, "don")) {
    return "mafia.night.resultNoInformation" as TranslationKey;
  }

  const target = getPlayerById(game, targetId);

  return target?.role === "sheriff"
    ? "mafia.night.resultSheriff"
    : "mafia.night.resultNotSheriff";
}

export function getHomelessResultKey(game: MafiaActiveGame, targetId?: string) {
  if (!targetId || isBlocked(game, "homeless")) {
    return "mafia.night.resultNoInformation" as TranslationKey;
  }

  const visitedIds = [
    game.nightActions.mafiaTargetId,
    game.nightActions.donTargetId,
    game.nightActions.doctorTargetId,
    game.nightActions.prostituteTargetId,
    game.nightActions.sheriffTargetId,
    game.nightActions.maniacTargetId,
  ];

  return visitedIds.includes(targetId)
    ? "mafia.night.resultVisited"
    : "mafia.night.resultQuiet";
}

export function getUniqueNominations(nominations: Record<string, string>) {
  return Array.from(new Set(Object.values(nominations).filter(Boolean)));
}

export function createVotes(candidateIds: string[]) {
  return candidateIds.reduce<Record<string, number>>((votes, candidateId) => {
    votes[candidateId] = 0;
    return votes;
  }, {});
}

export function resolveVotes(votes: Record<string, number>) {
  const entries = Object.entries(votes);

  if (entries.length === 0) {
    return { type: "none" as const };
  }

  const highestVoteCount = Math.max(...entries.map(([, count]) => count));

  if (highestVoteCount <= 0) {
    return { type: "none" as const };
  }

  const topCandidateIds = entries
    .filter(([, count]) => count === highestVoteCount)
    .map(([candidateId]) => candidateId);

  if (topCandidateIds.length === 1) {
    return { type: "eliminate" as const, eliminatedId: topCandidateIds[0] };
  }

  return { type: "tie" as const, tiedCandidateIds: topCandidateIds };
}

export function eliminatePlayer(
  game: MafiaActiveGame,
  participantId: string,
  reason: "night" | "vote"
) {
  return {
    ...game,
    players: game.players.map((player) =>
      player.participant.id === participantId
        ? { ...player, isAlive: false, eliminatedReason: reason }
        : player
    ),
  };
}

export function startNextNight(game: MafiaActiveGame) {
  return {
    ...game,
    phase: "night" as const,
    round: game.round + 1,
    scriptIndex: 0,
    daySpeakerIndex: 0,
    tieSpeakerIndex: 0,
    nightActions: {} as MafiaNightActions,
    nominations: {},
    votingCandidateIds: [],
    tiedCandidateIds: [],
    votes: {},
  };
}
