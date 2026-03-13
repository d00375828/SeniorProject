// Configure these endpoints when the backend is ready.
export const ROLEPLAY_TURN_ENDPOINT = "http://192.168.1.165:3000/roleplay/turn";
export const ROLEPLAY_END_ENDPOINT = "http://192.168.1.165:3000/roleplay/end";
export const USE_ROLEPLAY_MOCKS =
  !ROLEPLAY_TURN_ENDPOINT.trim() || !ROLEPLAY_END_ENDPOINT.trim();

// Legacy exports retained for unused older modules still on disk.
export const AUDIO_ENDPOINT = ROLEPLAY_TURN_ENDPOINT;
export const CHAT_ENDPOINT = "";
