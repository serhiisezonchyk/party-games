const appJson = require("./app.json");

const expoConfig = appJson.expo;
const rawBaseUrl = process.env.EXPO_BASE_URL?.trim();
const baseUrl =
  rawBaseUrl && rawBaseUrl !== "/" ? rawBaseUrl.replace(/\/$/, "") : undefined;

module.exports = {
  ...expoConfig,
  experiments: {
    ...expoConfig.experiments,
    ...(baseUrl ? { baseUrl } : {}),
  },
};
