// Configure these endpoints when the backend is ready.
export const ROLEPLAY_TURN_ENDPOINT = "";
export const ROLEPLAY_END_ENDPOINT = "";
export const USE_ROLEPLAY_MOCKS =
  !ROLEPLAY_TURN_ENDPOINT.trim() || !ROLEPLAY_END_ENDPOINT.trim();

// Legacy exports retained for unused older modules still on disk.
export const AUDIO_ENDPOINT = ROLEPLAY_TURN_ENDPOINT;
export const CHAT_ENDPOINT = "";
