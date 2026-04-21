import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import Screen from "@/components/Screen";
import { useSession, useTheme } from "@/context";

const scenarioAccent = {
  "team-presentation": "#25b8a6",
  "job-interview": "#67a6ff",
  "difficult-conversation": "#ff7d6b",
  "q-and-a-pressure": "#f2c14e",
} as const;

const scenarioGlow = {
  "team-presentation": "rgba(37, 184, 166, 0.16)",
  "job-interview": "rgba(103, 166, 255, 0.16)",
  "difficult-conversation": "rgba(255, 125, 107, 0.16)",
  "q-and-a-pressure": "rgba(242, 193, 78, 0.16)",
} as const;

function getNextPracticeId(lastScenarioId?: string) {
  switch (lastScenarioId) {
    case "team-presentation":
      return "q-and-a-pressure";
    case "job-interview":
      return "difficult-conversation";
    case "difficult-conversation":
      return "team-presentation";
    case "q-and-a-pressure":
      return "job-interview";
    default:
      return "job-interview";
  }
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { scenarios, savedSessions } = useSession();
  const recommendedScenario = useMemo(() => {
    const latestSaved = savedSessions[savedSessions.length - 1];
    const recommendedId = getNextPracticeId(latestSaved?.scenario.id);
    return (
      scenarios.find((scenario) => scenario.id === recommendedId) ??
      scenarios[0]
    );
  }, [savedSessions, scenarios]);

  const featuredAccent =
    scenarioAccent[recommendedScenario.id as keyof typeof scenarioAccent] ??
    colors.accent;
  const featuredGlow =
    scenarioGlow[recommendedScenario.id as keyof typeof scenarioGlow] ??
    "rgba(37, 184, 166, 0.16)";

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

      <Card
        bg={colors.card}
        border={colors.border}
        style={{
          gap: 14,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <View
          style={{
            position: "absolute",
            bottom: -36,
            left: -32,
            width: 120,
            height: 120,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
        />

        <View style={{ gap: 10 }}>
          <Text
            style={{
              color: colors.muted,
              fontSize: 18,
              fontWeight: "800",
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            Recommended next practice
          </Text>
        </View>

        <Card
          bg={colors.box}
          border={colors.border}
          style={{ gap: 12, position: "relative", overflow: "hidden" }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <View style={{ flex: 1, gap: 6 }}>
              <Text
                style={{ color: colors.muted, fontSize: 12, fontWeight: "800" }}
              >
                Suggested for you
              </Text>
              <Text
                style={{ color: colors.fg, fontSize: 22, fontWeight: "900" }}
              >
                {recommendedScenario.title}
              </Text>
              <Text style={{ color: colors.muted, lineHeight: 20 }}>
                {recommendedScenario.description}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() =>
              router.push(`/setup/${recommendedScenario.id}` as any)
            }
            style={({ pressed }) => ({
              backgroundColor: featuredAccent,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              alignItems: "center",
              opacity: pressed ? 0.86 : 1,
            })}
          >
            <Text style={{ color: colors.onAccent, fontWeight: "800" }}>
              Start recommended practice
            </Text>
          </Pressable>
        </Card>
      </Card>

      <View style={{ gap: 12 }}>
        {scenarios.map((scenario) => (
          <Pressable
            key={scenario.id}
            onPress={() => router.push(`/setup/${scenario.id}` as any)}
          >
            <Card
              style={{
                gap: 10,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: 6,
                  backgroundColor:
                    scenarioAccent[
                      scenario.id as keyof typeof scenarioAccent
                    ] ?? colors.accent,
                }}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: colors.fg, fontSize: 20, fontWeight: "800" }}
                >
                  {scenario.title}
                </Text>
              </View>
              <Text style={{ color: colors.muted, lineHeight: 21 }}>
                {scenario.description}
              </Text>
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
