import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import BackButton from "@/components/BackButton";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import Screen from "@/components/Screen";
import SectionTitle from "@/components/SectionTitle";
import { useSession, useTheme } from "@/context";

export default function SavedSessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { getSavedSession } = useSession();

  const session = id ? getSavedSession(id) : undefined;

  if (!session) {
    return (
      <Screen backgroundColor={colors.bg} style={{ padding: 16, gap: 16 }}>
        <PageHeader title="Saved Session" left={<BackButton />} />
        <Card style={{ gap: 10 }}>
          <Text style={{ color: colors.fg, fontSize: 18, fontWeight: "700" }}>
            Session not found
          </Text>
          <Pressable onPress={() => router.replace("/history" as any)}>
            <Text style={{ color: colors.accent, fontWeight: "700" }}>
              Return to history
            </Text>
          </Pressable>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={colors.bg} style={{ padding: 16, gap: 14 }}>
      <PageHeader title="Saved Session" left={<BackButton />} />

      <Card style={{ gap: 8 }}>
        <Text style={{ color: colors.fg, fontSize: 24, fontWeight: "800" }}>
          {session.scenario.title}
        </Text>
        <Text style={{ color: colors.muted }}>
          {new Date(session.createdAt).toLocaleString()}
        </Text>
        {session.config.attachments?.length ? (
          <Text style={{ color: colors.muted, lineHeight: 20 }}>
            Materials used: {session.config.attachments.length}
          </Text>
        ) : null}
        <Text style={{ color: colors.muted, lineHeight: 22 }}>
          {session.summary.overview}
        </Text>
      </Card>

      {session.config.attachments?.length ? (
        <Card style={{ gap: 12 }}>
          <SectionTitle color={colors.fg} style={{ textAlign: "left" }}>
            Materials
          </SectionTitle>
          {session.config.attachments.map((attachment) => (
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
        {session.summary.wins.map((item) => (
          <Text key={item} style={{ color: colors.fg, lineHeight: 22 }}>
            • {item}
          </Text>
        ))}
      </Card>

      <Card style={{ gap: 14 }}>
        <SectionTitle color={colors.fg} style={{ textAlign: "left" }}>
          Drills
        </SectionTitle>
        {session.summary.drills.map((item) => (
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
            Next step: {session.summary.nextStep}
          </Text>
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <SectionTitle color={colors.fg} style={{ textAlign: "left" }}>
          Transcript
        </SectionTitle>
        <Text style={{ color: colors.fg, lineHeight: 22 }}>
          {session.summary.transcript}
        </Text>
      </Card>
    </Screen>
  );
}
