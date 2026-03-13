import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/context";

type Props = {
  uri: string;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  onPlaybackError?: (message: string) => void;
};

export default function AssistantPlayback({
  uri,
  onPlaybackStart,
  onPlaybackEnd,
  onPlaybackError,
}: Props) {
  const { colors } = useTheme();
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    async function playNow() {
      try {
        onPlaybackStart?.();
        setPlaying(true);
        await player.seekTo(0);
        await player.play();
      } catch (error: any) {
        setPlaying(false);
        onPlaybackError?.(error?.message ?? "Assistant audio could not be played.");
      }
    }

    playNow();
  }, [onPlaybackEnd, onPlaybackError, onPlaybackStart, player, uri]);

  useEffect(() => {
    setPlaying(status.playing);
    if (status.didJustFinish) {
      onPlaybackEnd?.();
    }
  }, [onPlaybackEnd, status.didJustFinish, status.playing]);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Text style={{ color: colors.muted, flex: 1 }}>
        {playing ? "Playing AI voice reply..." : "Replay the last AI voice reply."}
      </Text>
      <Pressable
        onPress={async () => {
          try {
            onPlaybackStart?.();
            setPlaying(true);
            await player.seekTo(0);
            await player.play();
          } catch (error: any) {
            setPlaying(false);
            onPlaybackError?.(error?.message ?? "Assistant audio could not be played.");
          }
        }}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 8,
          backgroundColor: colors.box,
        }}
      >
        <Text style={{ color: colors.fg, fontWeight: "700" }}>
          {playing ? "Playing" : "Replay"}
        </Text>
      </Pressable>
    </View>
  );
}
