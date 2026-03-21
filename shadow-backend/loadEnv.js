const fs = require("fs");
const os = require("os");
const path = require("path");
const dotenv = require("dotenv");

const backendEnvPath = path.resolve(__dirname, ".env");
const rootEnvPath = path.resolve(__dirname, "..", ".env");

function loadIfPresent(filePath, override = false) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  dotenv.config({
    path: filePath,
    override,
  });
}

// Load shared monorepo secrets first.
loadIfPresent(rootEnvPath);

// Allow shadow-backend/.env to override root values when needed locally.
loadIfPresent(backendEnvPath, true);

function hasReadableCredentialsFile(filePath) {
  if (!filePath) return false;
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function parseGoogleCredentialsFromEnv() {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    return rawJson;
  }

  const rawBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (!rawBase64) {
    return null;
  }

  return Buffer.from(rawBase64, "base64").toString("utf8");
}

function ensureGoogleCredentialsFile() {
  if (hasReadableCredentialsFile(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    return;
  }

  const credentialsJson = parseGoogleCredentialsFromEnv();
  if (!credentialsJson) {
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(credentialsJson);
  } catch {
    throw new Error(
      "Invalid Google service account JSON in GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_JSON_BASE64."
    );
  }

  const tempFilePath = path.join(
    os.tmpdir(),
    `shadow-google-service-account-${process.pid}.json`
  );

  fs.writeFileSync(tempFilePath, JSON.stringify(parsed));
  process.env.GOOGLE_APPLICATION_CREDENTIALS = tempFilePath;
}

ensureGoogleCredentialsFile();

module.exports = {
  backendEnvPath,
  rootEnvPath,
};
