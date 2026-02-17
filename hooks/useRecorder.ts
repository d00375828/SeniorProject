// hooks/useRecorder.ts
import { RECORDING_AUDIO_MODE } from "@/lib/audio/audioMode";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Linking } from "react-native";

export function useRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [uri, setUri] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // pulse animation
  const pulse = useRef(new Animated.Value(1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  // session token to prevent stale async from a previous session
  const sessionRef = useRef(0);

  // Permissions + audio mode once
  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert("Microphone permission is required to record.");
      } else {
        await setAudioModeAsync(RECORDING_AUDIO_MODE);
      }
    })();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      loopRef.current?.stop();
    };
  }, []);

  // Animate while recording
  useEffect(() => {
    if (isRecording) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1.0, duration: 800, useNativeDriver: true }),
        ])
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      loopRef.current = null;
      pulse.setValue(1);
    }
    return () => {
      loopRef.current?.stop();
      loopRef.current = null;
    };
  }, [isRecording, pulse]);

  // Timer helpers
  function startTimer() {
    setSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }
  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  // Start/stop with session safety
  async function start() {
    if (isRecording) return;
  
    // Always re-check/request before recording
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) {
      // Can't re-prompt if user already denied; give a Settings shortcut
      Alert.alert(
        "Microphone Access Needed",
        "Please allow microphone access to start recording.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }
  
    // new session token (prevents stale updates)
    sessionRef.current += 1;
    const token = sessionRef.current;
  
    // clear previous file so children can't use a stale URI
    setUri(null);
  
    // optimistic UI
    setIsRecording(true);
    startTimer();
  
    try {
      await setAudioModeAsync(RECORDING_AUDIO_MODE);
      await recorder.prepareToRecordAsync();
      await recorder.record();
      if (token !== sessionRef.current) return; // user restarted quickly
    } catch (e: any) {
      if (token === sessionRef.current) {
        setIsRecording(false);
        stopTimer();
      }
      Alert.alert("Start error", String(e?.message ?? e));
    }
  }

  async function stop() {
    if (!isRecording) return;
    const token = sessionRef.current;

    // optimistic UI
    setIsRecording(false);
    stopTimer();

    try {
      await recorder.stop();
      // only set URI if still current session
      if (token === sessionRef.current) {
        setUri(recorder.uri ?? null);
      }
    } catch (e: any) {
      Alert.alert("Stop error", String(e?.message ?? e));
    }
  }

  function reset() {
    // invalidate any inflight async from a prior session
    sessionRef.current += 1;
    setUri(null);
    setSeconds(0);
    setIsRecording(false);
  }

  return { isRecording, uri, seconds, pulse, start, stop, reset };
}
