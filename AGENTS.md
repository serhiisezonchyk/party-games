# Project Instructions

This is a React Native Expo application for offline company party games: Spy,
Mafia, Alias, Truth or Dare, and similar local multiplayer games.

## Expo SDK 54 Requirement

Expo has changed. Before writing or changing any code that touches Expo,
React Native, Expo Router, app config, native permissions, assets, builds, or
Expo packages, read the exact versioned docs:

https://docs.expo.dev/versions/v54.0.0/

Do not rely on older Expo examples or unversioned docs when making SDK-specific
decisions.

## Stack

- Use React Native with Expo SDK 54.
- Use Expo Router for navigation.
- Use TypeScript for all app code.
- Keep TypeScript strictness intact. Do not introduce `any` unless the boundary
  genuinely requires it and the reason is clear.
- Use the configured Tailwind CSS setup for styling where it is available.
  Verify `tailwind.config.js` content paths before adding class-based styles;
  the project may use `app/` instead of `src/app/`.
- Prefer existing project components, hooks, constants, and theme utilities
  before adding new abstractions.

## Product Direction

- The app is a collection of party games for in-person groups.
- The primary experience must work without an internet connection.
- Do not build flows that require accounts, remote services, cloud sync,
  analytics, or a backend unless the user explicitly asks for them.
- Favor fast setup before each game: choosing a game, adding participants,
  adjusting settings, and starting quickly.
- Preserve each game's last-used local state, such as participants, selected
  language, theme preference, and game-specific settings.

## Data And Storage

- Do not add a database.
- Use bundled JSON or TypeScript data modules for static game content such as
  word packs, prompts, roles, categories, and default settings.
- Keep game content easy to localize and review. Prefer simple records keyed by
  stable ids.
- For user data and last-used settings, use a lightweight local persistence
  layer. Store only local device data.
- Centralize local storage access behind small typed helpers. Avoid scattering
  raw storage keys across screens.
- Version persisted data when the shape may evolve, and provide simple
  migration/defaulting logic so old local settings do not crash the app.
- Treat persisted values as untrusted input: validate and fall back to safe
  defaults.

## Localization

- The app must support English and Ukrainian.
- Do not hardcode user-facing strings directly in components unless the string
  is temporary development-only text.
- Keep translation keys stable and descriptive.
- Static game content must be available in both English and Ukrainian before it
  is surfaced in the UI.
- Remember that Ukrainian text can be longer than English. Layouts must allow
  wrapping and must not depend on fixed-width English labels.

## Theme And UI

- Support light and dark themes.
- Respect the platform/system theme by default, while allowing local user
  preference when implemented.
- Keep the UI minimalistic, but not bare. Use clear spacing, restrained color,
  readable typography, and polished interactive states.
- Avoid over-decorated marketing-style screens. The first screen should help
  users choose or resume a game.
- Use accessible contrast in both themes.
- Make controls comfortable for phones being passed around during a party:
  large tap targets, simple labels, clear confirmation for destructive actions,
  and minimal setup friction.

## Game Implementation Guidelines

- Model each game with typed settings, typed runtime state, and pure helpers for
  core rules where practical.
- Keep rules and content separate from UI components.
- Make game setup resumable from local state, but avoid persisting secret
  round information in a way that accidentally reveals hidden roles or prompts
  in normal navigation.
- For hidden-role games such as Spy and Mafia, design screens so players can
  privately view their own assignment without exposing the next player's data.
- Prefer deterministic, testable helpers for role assignment, prompt selection,
  shuffling, scoring, and round setup.

## Offline-First Constraints

- Assume no ethernet, Wi-Fi, or mobile data is available during gameplay.
- Do not fetch game content at runtime.
- Do not depend on remote images, fonts, configuration, or APIs for core flows.
- Any optional online behavior must fail quietly and must not block gameplay.

## Code Quality

- Keep files focused. Split large screens into small components and move rule
  logic into typed utility modules.
- Use explicit domain names: `players`, `roles`, `round`, `settings`,
  `language`, `theme`, `wordPack`.
- Avoid adding dependencies for simple JSON parsing, storage wrappers, state
  helpers, or formatting that can be handled cleanly in the app.
- If a dependency is necessary, install it using the Expo-compatible approach
  from the SDK 54 docs.
- Run the relevant checks after changes, at minimum `npm run lint` when code
  is touched.

## Agent Behavior

- Read existing files before editing and follow local patterns.
- Keep changes scoped to the user's request.
- Do not remove user work or reset the repository.
- Prefer small, typed, offline-safe implementations over broad rewrites.
- When adding or changing Expo-specific code, cite the SDK 54 docs decision in
  the implementation notes or final response when useful.
