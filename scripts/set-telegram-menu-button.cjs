"use strict";
const { existsSync, readFileSync } = require("node:fs");
const { join } = require("node:path");

const LINE_BREAK_REGEX = /\r?\n/;
const SURROUNDING_QUOTES_REGEX = /^["']|["']$/g;

function loadDotEnv() {
  const envPath = join(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(LINE_BREAK_REGEX);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(SURROUNDING_QUOTES_REGEX, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const token = process.env.TELEGRAM_BOT_TOKEN;
const miniAppUrl = process.env.TELEGRAM_MINI_APP_URL;
const text = process.env.TELEGRAM_MENU_TEXT || "Party Games";
const chatId = process.env.TELEGRAM_CHAT_ID;

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!token) {
  fail("Missing TELEGRAM_BOT_TOKEN.");
}

if (!miniAppUrl) {
  fail("Missing TELEGRAM_MINI_APP_URL.");
}

let url;

try {
  url = new URL(miniAppUrl);
} catch {
  fail("TELEGRAM_MINI_APP_URL must be a valid HTTPS URL.");
}

if (url.protocol !== "https:") {
  fail("TELEGRAM_MINI_APP_URL must use HTTPS.");
}

const apiUrl = `https://api.telegram.org/bot${token}/setChatMenuButton`;
const payload = {
  menu_button: {
    type: "web_app",
    text,
    web_app: {
      url: url.toString(),
    },
  },
};

if (chatId) {
  payload.chat_id = chatId;
}

fetch(apiUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
})
  .then(async (response) => {
    const body = await response.json();

    if (!(response.ok && body.ok)) {
      throw new Error(JSON.stringify(body));
    }

    console.log(`Telegram menu button set to ${url.toString()}`);
  })
  .catch((error) => {
    fail(`Failed to set Telegram menu button: ${error.message}`);
  });
