import { AudioMode } from "expo-audio";

type BackgroundCapableAudioMode = Partial<AudioMode> & {
  staysActiveInBackground?: boolean;
};
export const RECORDING_AUDIO_MODE: BackgroundCapableAudioMode = {
  allowsRecording: true,
  playsInSilentMode: true,
  shouldPlayInBackground: true,
  staysActiveInBackground: true, 
  interruptionMode: "doNotMix",
  interruptionModeAndroid: "doNotMix",
  shouldRouteThroughEarpiece: false,
};

export const IDLE_AUDIO_MODE: Partial<AudioMode> = {
  allowsRecording: false,
  playsInSilentMode: true,
  shouldPlayInBackground: false,
  interruptionMode: "mixWithOthers",
  interruptionModeAndroid: "duckOthers",
  shouldRouteThroughEarpiece: false,
};
