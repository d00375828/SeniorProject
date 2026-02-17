import BackButton from "@/components/BackButton";
import { useTheme } from "@/context";
import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import PageHeader from "../../components/PageHeader";
import Screen from "../../components/Screen";

const METRICS = [
  "Intro Quality",
  "Discovery Depth",
  "Conversation Control",
  "Objection Handling",
  "Clarity & Pace",
];

export default function AISettings() {
  const { colors } = useTheme();
  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(METRICS.map((m) => [m, 0.2]))
  );

  const total = useMemo(
    () => Object.values(weights).reduce((a, b) => a + b, 0),
    [weights]
  );

  const adjust = (k: string, delta: number) => {
    setWeights((w) => {
      const next = Math.max(0, Math.min(1, (w[k] ?? 0) + delta));
      return { ...w, [k]: parseFloat(next.toFixed(2)) };
    });
  };

  return (
    <Screen backgroundColor={colors.bg} style={{ padding: 16 }}>
      <PageHeader title="AI Settings" left={<BackButton />} />
      <Card style={{ gap: 12 }}>
        <Text
          style={{
            color: total.toFixed(2) === "1.00" ? colors.fg : "#B91C1C",
            fontWeight: "800",
          }}
        >
          Total: {total.toFixed(2)} (target 1.00)
        </Text>

        {METRICS.map((m) => (
          <View key={m} style={{ gap: 6 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ color: colors.fg, fontWeight: "700" }}>{m}</Text>
              <Text style={{ color: colors.muted }}>
                {weights[m].toFixed(2)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <AppButton
                title="-0.05"
                onPress={() => adjust(m, -0.05)}
                color={colors.box}
                fg={colors.fg}
              />
              <AppButton
                title="+0.05"
                onPress={() => adjust(m, +0.05)}
                color={colors.accent}
                fg={colors.onAccent}
              />
            </View>
          </View>
        ))}

        <AppButton
          title="Preview impact"
          onPress={() => {
            /* TODO: preview calc */
          }}
          color={colors.box}
          fg={colors.fg}
        />
        <AppButton
          title="Publish"
          onPress={() => {
            /* TODO: POST /org/settings/gradingWeights */
          }}
          color={colors.accent}
          fg={colors.onAccent}
        />
      </Card>
    </Screen>
  );
}
