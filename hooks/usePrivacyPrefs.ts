import { useEffect, useState } from "react";

import { KEYS, getJson, setJson } from "@/context/storage";
import { PrivacyPrefs } from "@/context/types";

const DEFAULT_PRIVACY_PREFS: PrivacyPrefs = {
  activeListening: false,
  analytics: false,
  location: false,
  microphone: false,
  access: [
    { name: "Avery Morgan", role: "Manager", relation: "manager" },
    { name: "Jordan Lee", role: "Owner", relation: "owner" },
  ],
};

export function usePrivacyPrefs() {
  const [privacyPrefs, setPrivacyPrefs] =
    useState<PrivacyPrefs>(DEFAULT_PRIVACY_PREFS);

  useEffect(() => {
    (async () =>
      setPrivacyPrefs(
        await getJson(KEYS.privacyPrefs, DEFAULT_PRIVACY_PREFS)
      ))();
  }, []);

  useEffect(() => {
    setJson(KEYS.privacyPrefs, privacyPrefs);
  }, [privacyPrefs]);

  return { privacyPrefs, setPrivacyPrefs } as const;
}