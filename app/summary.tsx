import { router } from "expo-router";
import React, { useMemo } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import AppButton from "@/components/AppButton";
import BackButton from "@/components/BackButton";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import Screen from "@/components/Screen";
import SectionTitle from "@/components/SectionTitle";
import { useSession, useTheme } from "@/context";

export default function SummaryScreen() {
  const { colors } = useTheme();
  const { activeSession, currentSummary, saveCurrentSummary, clearCurrentFlow } =
    useSession();

  const transcript = useMemo(
    () =>
      currentSummary?.transcript ||
      activeSession?.turns
        .map((turn) => `${turn.role === "user" ? "You" : "Prospect"}: ${turn.text}`)
        .join("\n") ||
      "",
    [activeSession?.turns, currentSummary?.transcript]
  );

  if (!activeSession || !currentSummary) {
    router.replace("/");
    return null;
  }

  return (
    <Screen backgroundColor={colors.bg} style={{ padding: 16, gap: 16 }}>
      <PageHeader title="Summary" left={<BackButton />} />

      <Card style={{ gap: 8 }}>
        <Text style={{ color: colors.fg, fontSize: 24, fontWeight: "800" }}>
          {activeSession.scenario.title}
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 22 }}>
          {currentSummary.overview}
        </Text>
      </Card>

      <Card style={{ gap: 14 }}>
        <SectionTitle color={colors.fg} style={{ textAlign: "left" }}>
          Wins
        </SectionTitle>
        {currentSummary.wins.map((item) => (
          <Text key={item} style={{ color: colors.fg, lineHeight: 22 }}>
            • {item}
          </Text>
        ))}
      </Card>

      <Card style={{ gap: 14 }}>
        <SectionTitle color={colors.fg} style={{ textAlign: "left" }}>
          Drills
        </SectionTitle>
        {currentSummary.drills.map((item) => (
          <Text key={item} style={{ color: colors.fg, lineHeight: 22 }}>
            • {item}
          </Text>
        ))}
        <View
          style={{
            marginTop: 4,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Text style={{ color: colors.muted, lineHeight: 22 }}>
            Next step: {currentSummary.nextStep}
          </Text>
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <SectionTitle color={colors.fg} style={{ textAlign: "left" }}>
          Transcript
        </SectionTitle>
        <Text style={{ color: colors.fg, lineHeight: 22 }}>{transcript}</Text>
      </Card>

      <View style={{ gap: 10 }}>
        <AppButton
          title="Save Session"
          color={colors.accent}
          fg={colors.onAccent}
          onPress={async () => {
            try {
              const saved = await saveCurrentSummary();
              clearCurrentFlow();
              router.replace(`/history/${saved.id}` as any);
            } catch (error: any) {
              Alert.alert("Save failed", error?.message ?? "Unable to save this session.");
            }
          }}
        />
        <Pressable
          onPress={() => {
            clearCurrentFlow();
            router.replace("/");
          }}
        >
          <Text style={{ color: colors.accent, textAlign: "center", fontWeight: "700" }}>
            Discard and return home
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
