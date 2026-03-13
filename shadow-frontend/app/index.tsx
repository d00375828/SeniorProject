import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import Screen from "@/components/Screen";
import { useSession, useTheme } from "@/context";

export default function HomeScreen() {
  const { colors } = useTheme();
  const { scenarios, savedSessions } = useSession();

  return (
    <Screen backgroundColor={colors.bg} style={{ padding: 16, gap: 16 }}>
      <PageHeader
        title="Shadow"
        right={
          <Pressable onPress={() => router.push("/history" as any)}>
            <Text style={{ color: colors.accent, fontWeight: "700" }}>
              Saved {savedSessions.length}
            </Text>
          </Pressable>
        }
      />

      <Card style={{ gap: 10 }}>
        <Text style={{ color: colors.fg, fontSize: 30, fontWeight: "900" }}>
          AI confidence practice built around live turns.
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 22 }}>
          Practice public speaking, rehearse interviews, and simulate difficult
          conversations out loud, then review the transcript and coaching summary.
        </Text>
      </Card>

      <View style={{ gap: 12 }}>
        {scenarios.map((scenario) => (
          <Pressable
            key={scenario.id}
            onPress={() => router.push(`/setup/${scenario.id}` as any)}
          >
            <Card style={{ gap: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.fg, fontSize: 20, fontWeight: "800" }}>
                  {scenario.title}
                </Text>
                <Text style={{ color: colors.accent, fontWeight: "700" }}>
                  {scenario.difficulty}
                </Text>
              </View>
              <Text style={{ color: colors.muted, lineHeight: 21 }}>
                {scenario.description}
              </Text>
              <Text style={{ color: colors.fg }}>
                {scenario.category} | {scenario.persona}
              </Text>
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
