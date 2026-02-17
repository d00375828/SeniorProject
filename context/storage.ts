import AsyncStorage from "@react-native-async-storage/async-storage";

export const KEYS = {
  history: "history",
  criteria: "criteria",
  avgScore: "avgScore",
  profile: "profile",
  notifPrefs: "notifPrefs",
  privacyPrefs: "privacyPrefs",
  isAuthed: "isAuthed",
  themeMode: "themeMode",
} as const;

export async function getJson<T>(key: string, fallback: T): Promise<T> {
  try { const s = await AsyncStorage.getItem(key); return s ? JSON.parse(s) as T : fallback; }
  catch { return fallback; }
}
export function setJson(key: string, val: unknown) {
  return AsyncStorage.setItem(key, JSON.stringify(val));
}
export async function getStr(key: string, fallback = "") {
  try { return (await AsyncStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
export function setStr(key: string, val: string) {
  return AsyncStorage.setItem(key, val);
}
