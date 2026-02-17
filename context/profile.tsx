import React, { createContext, useContext, useEffect, useState } from "react";
import { KEYS, getJson, setJson } from "./storage";

type Profile = {
  name: string;
  role: string;
  org: string;
  avatarUri?: string;
  email?: string;
  phone?: string;
};
const DEFAULT: Profile = {
  name: "",
  role: "",
  org: "",
  avatarUri: undefined,
  email: "",
  phone: "",
};

const Ctx = createContext<{
  profile: Profile;
  setProfile: (p: Profile) => void;
} | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(DEFAULT);

  useEffect(() => {
    (async () => setProfile(await getJson(KEYS.profile, DEFAULT)))();
  }, []);
  useEffect(() => {
    setJson(KEYS.profile, profile);
  }, [profile]);

  return (
    <Ctx.Provider value={{ profile, setProfile }}>{children}</Ctx.Provider>
  );
}

export function useProfile() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProfile must be used within ProfileProvider");
  return v;
}
