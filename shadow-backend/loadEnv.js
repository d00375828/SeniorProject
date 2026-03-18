const fs = require("fs");
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

module.exports = {
  backendEnvPath,
  rootEnvPath,
};
