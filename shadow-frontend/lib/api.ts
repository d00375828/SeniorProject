const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? "";

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function buildEndpoint(path: string) {
  if (!API_BASE_URL) {
    throw new Error(
      "Missing EXPO_PUBLIC_API_BASE_URL. Set it in your Expo environment before making roleplay API requests."
    );
  }

  const baseUrl = normalizeBaseUrl(API_BASE_URL);

  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new Error(
      "Invalid EXPO_PUBLIC_API_BASE_URL. Use a full http:// or https:// URL."
    );
  }

  return `${baseUrl}${path}`;
}

export function getRoleplayTurnEndpoint() {
  return buildEndpoint("/roleplay/turn");
}

export function getRoleplayEndEndpoint() {
  return buildEndpoint("/roleplay/end");
}

export function getRoleplayContextEndpoint() {
  return buildEndpoint("/roleplay/context");
}
