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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function scoreLabel(score: number) {
  if (score >= 85) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 55) return "Building";
  return "Needs work";
}

function excerpt(text: string, maxWords = 18) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(" ")}...`;
}

export default function SummaryScreen() {
  const { colors } = useTheme();
  const { activeSession, currentSummary, saveCurrentSummary, clearCurrentFlow } =
    useSession();

  const analysis = useMemo(() => {
    const turns = activeSession?.turns ?? [];
    const transcript =
      currentSummary?.transcript ||
      turns
        .map((turn) => `${turn.role === "user" ? "You" : "Partner"}: ${turn.text}`)
        .join("\n") ||
      "";

    const userTurns = turns.filter((turn) => turn.role === "user");
    const assistantTurns = turns.filter((turn) => turn.role === "assistant");
    const wordCount = transcript.split(/\s+/).filter(Boolean).length;
    const avgWordsPerTurn = turns.length ? wordCount / turns.length : 0;

    const confidence = clamp(
      Math.round(56 + userTurns.length * 7 + Math.min(18, avgWordsPerTurn * 1.2)),
      42,
      96
    );
    const clarity = clamp(
      Math.round(
        60 +
          Math.max(0, 18 - Math.abs(avgWordsPerTurn - 18)) * 2 +
          Math.min(12, assistantTurns.length * 2)
      ),
      40,
      97
    );
    const concision = clamp(
      Math.round(90 - Math.abs(avgWordsPerTurn - 22) * 2.4),
      38,
      95
    );

    const bestMomentSource =
      [...assistantTurns].reverse().find((turn) => turn.text.trim().length > 0) ||
      [...userTurns].reverse().find((turn) => turn.text.trim().length > 0) ||
      turns[0] ||
      null;

    const coachNotes = [
      currentSummary?.drills?.[0],
      currentSummary?.drills?.[1],
    ].filter(Boolean) as string[];

    return {
      transcript,
      turns,
      userTurns,
      assistantTurns,
      confidence,
      clarity,
      concision,
      avgWordsPerTurn,
      bestMomentSource,
      coachNotes,
    };
  }, [activeSession?.turns, currentSummary?.drills, currentSummary?.transcript]);

  if (!activeSession || !currentSummary) {
    router.replace("/");
    return null;
  }

  const bestMomentText = analysis.bestMomentSource
    ? `${analysis.bestMomentSource.role === "user" ? "You" : "Partner"}: ${excerpt(
        analysis.bestMomentSource.text,
        20
      )}`
    : currentSummary.overview;

  return (
    <Screen backgroundColor={colors.bg} style={{ padding: 16, gap: 16 }}>
      <PageHeader title="Summary" left={<BackButton />} />

      <Card style={{ gap: 14 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" }}>
            Session Review
          </Text>
          <Text style={{ color: colors.fg, fontSize: 26, fontWeight: "900" }}>
            {activeSession.scenario.title}
          </Text>
          <Text style={{ color: colors.muted, lineHeight: 22 }}>
            {currentSummary.overview}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { label: "Confidence", value: analysis.confidence },
            { label: "Clarity", value: analysis.clarity },
            { label: "Concision", value: analysis.concision },
          ].map((item) => (
            <View key={item.label} style={{ flex: 1, gap: 8 }}>
              <Card bg={colors.box} border={colors.border} style={{ gap: 10 }}>
                <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "800" }}>
                  {item.label}
                </Text>
                <Text style={{ color: colors.fg, fontSize: 24, fontWeight: "900" }}>
                  {item.value}%
                </Text>
                <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "700" }}>
                  {scoreLabel(item.value)}
                </Text>
              </Card>
              <View
                style={{
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: colors.border,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${item.value}%`,
                    height: "100%",
                    borderRadius: 999,
                    backgroundColor: colors.accent,
                  }}
                />
              </View>
            </View>
          ))}
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <Card bg={colors.box} border={colors.border} style={{ flex: 1, minWidth: 150, gap: 6 }}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "800" }}>
              Turns
            </Text>
            <Text style={{ color: colors.fg, fontSize: 22, fontWeight: "900" }}>
              {analysis.turns.length}
            </Text>
          </Card>
          <Card bg={colors.box} border={colors.border} style={{ flex: 1, minWidth: 150, gap: 6 }}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "800" }}>
              Avg. words / turn
            </Text>
            <Text style={{ color: colors.fg, fontSize: 22, fontWeight: "900" }}>
              {analysis.avgWordsPerTurn ? analysis.avgWordsPerTurn.toFixed(1) : "0"}
            </Text>
          </Card>
        </View>
      </Card>

      <Card style={{ gap: 10 }}>
        <Text
          style={{
            color: colors.muted,
            fontSize: 12,
            fontWeight: "800",
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          Best Moment
        </Text>
        <Text style={{ color: colors.fg, fontSize: 18, fontWeight: "800", lineHeight: 26 }}>
          {bestMomentText}
        </Text>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text
          style={{
            color: colors.muted,
            fontSize: 12,
            fontWeight: "800",
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          Coach Notes
        </Text>
        <View style={{ gap: 10 }}>
          {analysis.coachNotes.length ? (
            analysis.coachNotes.map((note) => (
              <Card key={note} bg={colors.box} border={colors.border} style={{ gap: 4 }}>
                <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "800" }}>
                  Coaching cue
                </Text>
                <Text style={{ color: colors.fg, lineHeight: 21 }}>{note}</Text>
              </Card>
            ))
          ) : (
            <Text style={{ color: colors.muted, lineHeight: 22 }}>
              No drills generated yet.
            </Text>
          )}
        </View>
        <View
          style={{
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

      {activeSession.config.attachments?.length ? (
        <Card style={{ gap: 12 }}>
          <SectionTitle color={colors.fg} style={{ textAlign: "left" }}>
            Materials
          </SectionTitle>
          {activeSession.config.attachments.map((attachment) => (
            <Card
              key={attachment.id}
              bg={colors.box}
              border={colors.border}
              style={{ gap: 8 }}
            >
              <Text style={{ color: colors.fg, fontWeight: "800" }}>
                {attachment.name}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {attachment.kind} | {attachment.mimeType}
              </Text>
              <Text style={{ color: colors.muted, lineHeight: 20 }}>
                {attachment.promptText.slice(0, 180)}
                {attachment.promptText.length > 180 ? "..." : ""}
              </Text>
            </Card>
          ))}
        </Card>
      ) : null}

      <Card style={{ gap: 14 }}>
        <SectionTitle color={colors.fg} style={{ textAlign: "left" }}>
          Wins
        </SectionTitle>
        {currentSummary.wins.map((item) => (
          <Card key={item} bg={colors.box} border={colors.border} style={{ gap: 4 }}>
            <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "800" }}>
              Win
            </Text>
            <Text style={{ color: colors.fg, lineHeight: 22 }}>{item}</Text>
          </Card>
        ))}
      </Card>

      <Card style={{ gap: 14 }}>
        <SectionTitle color={colors.fg} style={{ textAlign: "left" }}>
          Drills
        </SectionTitle>
        {currentSummary.drills.map((item) => (
          <Card key={item} bg={colors.box} border={colors.border} style={{ gap: 4 }}>
            <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "800" }}>
              Drill
            </Text>
            <Text style={{ color: colors.fg, lineHeight: 22 }}>{item}</Text>
          </Card>
        ))}
      </Card>

      <Card style={{ gap: 12 }}>
        <SectionTitle color={colors.fg} style={{ textAlign: "left" }}>
          Transcript
        </SectionTitle>
        <Text style={{ color: colors.fg, lineHeight: 22 }}>{analysis.transcript}</Text>
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
