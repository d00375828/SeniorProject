import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Animated, Pressable, ScrollView, Text, View } from "react-native";

import AssistantPlayback from "@/components/AssistantPlayback";
import AppButton from "@/components/AppButton";
import BackButton from "@/components/BackButton";
import Card from "@/components/Card";
import MessageBubble from "@/components/MessageBubble";
import PageHeader from "@/components/PageHeader";
import Screen from "@/components/Screen";
import { ThemeProvider, useSession, useTheme } from "@/context";
import type { ActiveSession } from "@/context";
import { useRecorder } from "@/hooks/useRecorder";

type SessionActionHandlers = {
  submitTurn: (audioUri: string) => Promise<unknown>;
  retryLastTurn: () => Promise<unknown>;
  endSession: () => Promise<unknown>;
  setPlaybackState: (isPlaying: boolean) => void;
  failLatestPlayback: (message: string) => void;
};

export default function SessionScreen() {
  const {
    activeSession,
    submitTurn,
    retryLastTurn,
    endSession,
    setPlaybackState,
    failLatestPlayback,
  } = useSession();

  useEffect(() => {
    if (!activeSession) {
      router.replace("/");
    }
  }, [activeSession]);

  if (!activeSession) {
    return null;
  }

  return (
    <ThemeProvider scenarioId={activeSession.scenario.id as any}>
      <SessionScreenContent
        activeSession={activeSession}
        submitTurn={submitTurn}
        retryLastTurn={retryLastTurn}
        endSession={endSession}
        setPlaybackState={setPlaybackState}
        failLatestPlayback={failLatestPlayback}
      />
    </ThemeProvider>
  );
}

function SessionScreenContent({
  activeSession,
  submitTurn,
  retryLastTurn,
  endSession,
  setPlaybackState,
  failLatestPlayback,
}: { activeSession: ActiveSession } & SessionActionHandlers) {
  const { colors } = useTheme();
  const { isRecording, seconds, pulse, start, stop, reset } = useRecorder();
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [localBusy, setLocalBusy] = useState(false);

  const messages = useMemo(() => activeSession.turns ?? [], [activeSession.turns]);

  const clock = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  const isBusy =
    localBusy ||
    activeSession.status === "submitting" ||
    activeSession.status === "ending";
  const hasTurnError = Boolean(activeSession.error);

  async function onRecordPress() {
    try {
      if (isRecording) {
        const uri = await stop();
        if (!uri) {
          Alert.alert("Recording error", "No audio was captured for this turn.");
          return;
        }
        setPlaybackError(null);
        setLocalBusy(true);
        await submitTurn(uri);
      } else {
        await start();
      }
    } catch (error: any) {
      Alert.alert("Turn failed", error?.message ?? "Unable to submit this turn.");
    } finally {
      setLocalBusy(false);
    }
  }

  async function onRetry() {
    try {
      setPlaybackError(null);
      setLocalBusy(true);
      await retryLastTurn();
    } catch (error: any) {
      Alert.alert("Retry failed", error?.message ?? "Unable to retry the last turn.");
    } finally {
      setLocalBusy(false);
    }
  }

  async function onEndSession() {
    try {
      setLocalBusy(true);
      await endSession();
      reset();
      router.push("/summary" as any);
    } catch (error: any) {
      Alert.alert(
        "Summary failed",
        error?.message ?? "Unable to build the session summary."
      );
    } finally {
      setLocalBusy(false);
    }
  }

  return (
    <Screen scroll={false} backgroundColor={colors.bg} style={{ padding: 16 }}>
      <PageHeader
        title="Roleplay"
        left={<BackButton />}
        right={
          <Pressable onPress={() => router.push("/history" as any)}>
            <Text style={{ color: colors.accent, fontWeight: "700" }}>History</Text>
          </Pressable>
        }
      />

      <View style={{ flex: 1, gap: 12 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
        >
          <Card style={{ gap: 8 }}>
            <Text style={{ color: colors.fg, fontSize: 22, fontWeight: "800" }}>
              {activeSession.scenario.title}
            </Text>
            <Text style={{ color: colors.muted, lineHeight: 20 }}>
              {activeSession.config.userRole} | {activeSession.config.partnerStyle}
            </Text>
            <Text style={{ color: colors.muted, lineHeight: 22 }}>
              Objective: {activeSession.config.objective}
            </Text>
            {activeSession.config.attachments?.length ? (
              <Text style={{ color: colors.muted, lineHeight: 20 }}>
                Materials loaded: {activeSession.config.attachments.length}
              </Text>
            ) : null}
          </Card>

          <Card style={{ gap: 12 }}>
            <View style={{ alignItems: "center", gap: 8 }}>
              <Animated.View
                style={{
                  transform: [{ scale: pulse }],
                  borderRadius: 999,
                  padding: 6,
                  backgroundColor: isRecording ? "#ff4d4d20" : "transparent",
                }}
              >
                <Pressable
                  disabled={isBusy || activeSession.status === "playing" || hasTurnError}
                  onPress={onRecordPress}
                  style={{
                    height: 128,
                    width: 128,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isRecording ? "#ff5454" : colors.accent,
                    opacity:
                      isBusy || activeSession.status === "playing" || hasTurnError
                        ? 0.55
                        : 1,
                  }}
                >
                  <Ionicons
                    name={isRecording ? "stop" : "mic"}
                    size={34}
                    color={isRecording ? "#120000" : colors.onAccent}
                  />
                </Pressable>
              </Animated.View>
              <Text style={{ color: colors.fg, fontWeight: "800", fontSize: 18 }}>
                {isRecording ? "Recording turn..." : "Tap to record your next turn"}
              </Text>
              <Text style={{ color: colors.muted }}>
                {isRecording
                  ? `Live timer ${clock}`
                  : activeSession.status === "submitting"
                  ? "Processing turn..."
                  : activeSession.status === "playing"
                  ? "Playing AI reply..."
                  : activeSession.status === "ending"
                  ? "Building summary..."
                  : activeSession.error
                  ? "Retry the last turn before recording again"
                  : "Ready"}
              </Text>
            </View>

            {activeSession.error ? (
              <Card bg="#2a1616" border="#613131" style={{ gap: 10 }}>
                <Text style={{ color: "#ffb3b3", fontWeight: "700" }}>
                  Turn issue
                </Text>
                <Text style={{ color: "#ffd9d9" }}>{activeSession.error}</Text>
                {activeSession.failedTurnPreview ? (
                  <Card bg="#351d1d" border="#613131" style={{ gap: 8 }}>
                    <Text style={{ color: "#ffb3b3", fontWeight: "700" }}>
                      Failed turn preview
                    </Text>
                    <Text style={{ color: "#ffd9d9", lineHeight: 21 }}>
                      You:{" "}
                      {activeSession.failedTurnPreview.userTranscript ||
                        "Transcript unavailable"}
                    </Text>
                    <Text style={{ color: "#ffd9d9", lineHeight: 21 }}>
                      AI:{" "}
                      {activeSession.failedTurnPreview.assistantText ||
                        "Reply unavailable"}
                    </Text>
                  </Card>
                ) : null}
                <AppButton
                  title="Retry Last Turn"
                  onPress={onRetry}
                  color={colors.accent}
                  fg={colors.onAccent}
                />
              </Card>
            ) : null}

            {activeSession.latestAssistantAudioUri ? (
              <AssistantPlayback
                uri={activeSession.latestAssistantAudioUri}
                onPlaybackStart={() => setPlaybackState(true)}
                onPlaybackEnd={() => setPlaybackState(false)}
                onPlaybackError={(message) => {
                  setPlaybackError(message);
                  failLatestPlayback(
                    message ||
                      "Assistant audio playback failed. Retry the turn so the voice reply completes successfully."
                  );
                }}
              />
            ) : null}

            {playbackError ? (
              <Text style={{ color: "#ffb3b3" }}>
                Voice playback failed. Review the preview and retry the turn.
              </Text>
            ) : null}
          </Card>

          <Card style={{ gap: 12, minHeight: 280 }}>
            <Text style={{ color: colors.fg, fontSize: 18, fontWeight: "700" }}>
              Conversation
            </Text>
            {messages.length ? (
              messages.map((message) => (
                <MessageBubble key={message.id} item={message} />
              ))
            ) : (
              <Text style={{ color: colors.muted, lineHeight: 22 }}>
                No turns yet. Record your opening message to start the practice
                session.
              </Text>
            )}
          </Card>
        </ScrollView>

        <View style={{ paddingTop: 4 }}>
          <AppButton
            title="End Session"
            color={colors.accent}
            fg={colors.onAccent}
            disabled={!activeSession.turns.length || isRecording || isBusy || hasTurnError}
            onPress={onEndSession}
          />
        </View>
      </View>
    </Screen>
  );
}
