import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React, { useEffect, useRef, useState } from "react";
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
  const onPlaybackStartRef = useRef(onPlaybackStart);
  const onPlaybackEndRef = useRef(onPlaybackEnd);
  const onPlaybackErrorRef = useRef(onPlaybackError);

  useEffect(() => {
    onPlaybackStartRef.current = onPlaybackStart;
    onPlaybackEndRef.current = onPlaybackEnd;
    onPlaybackErrorRef.current = onPlaybackError;
  }, [onPlaybackStart, onPlaybackEnd, onPlaybackError]);

  useEffect(() => {
    async function playNow() {
      try {
        onPlaybackStartRef.current?.();
        setPlaying(true);
        await player.seekTo(0);
        await player.play();
      } catch (error: any) {
        setPlaying(false);
        onPlaybackErrorRef.current?.(
          error?.message ?? "Assistant audio could not be played."
        );
      }
    }

    playNow();
  }, [player, uri]);

  useEffect(() => {
    setPlaying(status.playing);
    if (status.didJustFinish) {
      onPlaybackEndRef.current?.();
    }
  }, [status.didJustFinish, status.playing]);

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
            onPlaybackStartRef.current?.();
            setPlaying(true);
            await player.seekTo(0);
            await player.play();
          } catch (error: any) {
            setPlaying(false);
            onPlaybackErrorRef.current?.(
              error?.message ?? "Assistant audio could not be played."
            );
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
