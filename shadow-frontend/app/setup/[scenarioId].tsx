import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import AppButton from "@/components/AppButton";
import BackButton from "@/components/BackButton";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import Screen from "@/components/Screen";
import { useSession, useTheme } from "@/context";

export default function SetupScreen() {
  const { scenarioId } = useLocalSearchParams<{ scenarioId: string }>();
  const { colors } = useTheme();
  const { scenarios, startSession } = useSession();

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId),
    [scenarioId, scenarios]
  );

  const [userRole, setUserRole] = useState(scenario?.defaultConfig.userRole ?? "");
  const [objective, setObjective] = useState(scenario?.defaultConfig.objective ?? "");
  const [partnerStyle, setPartnerStyle] = useState(
    scenario?.defaultConfig.partnerStyle ?? ""
  );

  if (!scenario) {
    router.replace("/");
    return null;
  }

  return (
    <Screen backgroundColor={colors.bg} style={{ padding: 16, gap: 16 }}>
      <PageHeader title="Setup" left={<BackButton />} />

      <Card style={{ gap: 10 }}>
        <Text style={{ color: colors.fg, fontSize: 24, fontWeight: "800" }}>
          {scenario.title}
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 22 }}>
          {scenario.description}
        </Text>
        <View
          style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}
        >
          {[scenario.category, scenario.difficulty, scenario.persona].map((label) => (
            <View
              key={label}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: colors.box,
              }}
            >
              <Text style={{ color: colors.fg, fontSize: 12 }}>{label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={{ color: colors.fg, fontSize: 18, fontWeight: "700" }}>
          Session configuration
        </Text>

        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>
            Your role
          </Text>
          <TextInput
            value={userRole}
            onChangeText={setUserRole}
            placeholder="Presenter"
            placeholderTextColor={colors.muted}
            style={{
              color: colors.fg,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              backgroundColor: colors.box,
            }}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>
            Objective
          </Text>
          <TextInput
            value={objective}
            onChangeText={setObjective}
            placeholder="Uncover pains and secure a next step"
            placeholderTextColor={colors.muted}
            multiline
            style={{
              color: colors.fg,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              minHeight: 84,
              backgroundColor: colors.box,
              textAlignVertical: "top",
            }}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>
            Audience or partner style
          </Text>
          <TextInput
            value={partnerStyle}
            onChangeText={setPartnerStyle}
            placeholder="Supportive but attentive audience"
            placeholderTextColor={colors.muted}
            style={{
              color: colors.fg,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              backgroundColor: colors.box,
            }}
          />
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={{ color: colors.muted, lineHeight: 21 }}>
          You will record one turn at a time. After each turn, the app will show
          the transcript, receive the AI reply, and play the voice response when
          audio is available.
        </Text>
        <AppButton
          title="Start Roleplay"
          color={colors.accent}
          fg={colors.onAccent}
          onPress={() => {
            startSession({
              scenarioId: scenario.id,
              userRole: userRole.trim() || scenario.defaultConfig.userRole,
              objective: objective.trim() || scenario.defaultConfig.objective,
              partnerStyle:
                partnerStyle.trim() || scenario.defaultConfig.partnerStyle,
            });
            router.push("/session" as any);
          }}
        />
        <Pressable onPress={() => router.push("/history" as any)}>
          <Text style={{ color: colors.accent, fontWeight: "700", textAlign: "center" }}>
            View saved sessions
          </Text>
        </Pressable>
      </Card>
    </Screen>
  );
}
