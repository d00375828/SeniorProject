// app/(tabs)/training.tsx
import { useTheme } from "@/context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import PageHeader from "../../components/PageHeader";
import Screen from "../../components/Screen";

export default function Training() {
  const { colors } = useTheme();

  function startRolePlay() {
    // TODO: point this wherever your role-play flow lives.
    // For now, this navigates to /training/roleplay (create that screen when ready).

    router.push("/home");
  }

  return (
    <Screen
      scroll={false}
      style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}
    >
      {/* Header */}
      <PageHeader title="Training" />

      {/* Centered CTA */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Pressable
          onPress={startRolePlay}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor: colors.accent,
            paddingVertical: 16,
            paddingHorizontal: 22,
            borderRadius: 14,
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 10,
          }}
        >
          <Ionicons name="play-outline" size={22} color={colors.onAccent} />
          <Text
            style={{ color: colors.onAccent, fontWeight: "900", fontSize: 16 }}
          >
            Start AI Role Play
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

// Cutting off fat so I am the only one is working on this
// I need to docunent what I worked on while on a team and what I did alone
// Test test
