import { useEffect, useState } from "react";

import { KEYS, getJson, setJson } from "@/context/storage";
import { NotifPrefs } from "@/context/types";

const DEFAULT_PREFS: NotifPrefs = { push: false, email: false, sms: false };

export function useNotificationPrefs() {
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    (async () =>
      setNotifPrefs(await getJson(KEYS.notifPrefs, DEFAULT_PREFS)))();
  }, []);

  useEffect(() => {
    setJson(KEYS.notifPrefs, notifPrefs);
  }, [notifPrefs]);

  return { notifPrefs, setNotifPrefs } as const;
}