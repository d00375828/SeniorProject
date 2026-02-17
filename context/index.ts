export { useAuth } from "./auth";
export { useProfile } from "./profile";
export { useRecordings } from "./recordings";
export { RootProvider } from "./RootProvider";
export { useTheme } from "./theme";
export * from "./types";

import { useAuth } from "./auth";
import { useProfile } from "./profile";
import { useRecordings } from "./recordings";

export function useApp() {
  const { signOut } = useAuth();

  const { profile, setProfile } = useProfile();

  const {
    criteria,
    updateCriteria,
    history,
    addRecording,
    deleteRecording,
    updateRecordingNotes,
    avgScore,
  } = useRecordings();

  return {
    // recordings + stats you use
    criteria,
    updateCriteria,
    history,
    addRecording,
    deleteRecording,
    updateRecordingNotes,
    avgScore,

    // profile
    profile,
    setProfile,

    // auth (current screens call signOut)
    signOut,
  };
}
