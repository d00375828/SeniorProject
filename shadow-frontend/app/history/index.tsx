import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import BackButton from "@/components/BackButton";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import Screen from "@/components/Screen";
import { useSession, useTheme } from "@/context";

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { savedSessions } = useSession();

  return (
    <Screen backgroundColor={colors.bg} style={{ padding: 16, gap: 14 }}>
      <PageHeader title="Saved Sessions" left={<BackButton />} />

      {savedSessions.length ? (
        savedSessions.map((session) => (
          <Pressable
            key={session.id}
            onPress={() => router.push(`/history/${session.id}` as any)}
          >
            <Card style={{ gap: 8 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.fg, fontSize: 18, fontWeight: "800" }}>
                  {session.scenario.title}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {new Date(session.createdAt).toLocaleDateString()}
                </Text>
              </View>
              {session.config.attachments?.length ? (
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  Materials: {session.config.attachments.length}
                </Text>
              ) : null}
              <Text style={{ color: colors.muted, lineHeight: 21 }}>
                {session.summary.overview}
              </Text>
            </Card>
          </Pressable>
        ))
      ) : (
        <Card>
          <Text style={{ color: colors.muted, lineHeight: 22 }}>
            No sessions saved yet. Complete a practice session and save the summary to
            see it here.
          </Text>
        </Card>
      )}
    </Screen>
  );
}
