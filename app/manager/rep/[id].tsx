// app/manager/rep/[id].tsx
import { useTheme } from "@/context";
import { Link, useLocalSearchParams } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import BackButton from "../../../components/BackButton";
import Card from "../../../components/Card";
import PageHeader from "../../../components/PageHeader";
import RowItem from "../../../components/RowItem";
import Screen from "../../../components/Screen";
import SectionTitle from "../../../components/SectionTitle";

const MOCK_RECORDINGS = [
  { id: "r1", score: 85, title: "Doorstep – Objection Handling" },
  { id: "r2", score: 78, title: "Intro – Value Prop" },
];

function KPI({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <Card>
      <Text style={{ color: colors.muted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.fg, fontSize: 20, fontWeight: "800" }}>
        {value}
      </Text>
    </Card>
  );
}

export default function RepDetail() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const title = name || "Rep: ${id}";
  const { colors } = useTheme();

  return (
    <Screen backgroundColor={colors.bg} style={{ padding: 16 }}>
      <PageHeader title={title} left={<BackButton />} />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <KPI label="Avg Score (7d)" value="82%" />
        <KPI label="Recordings (7d)" value="12" />
      </View>

      <SectionTitle color={colors.fg} style={{ marginTop: 12 }}>
        Recent recordings
      </SectionTitle>

      <View style={{ gap: 10, marginTop: 8 }}>
        {MOCK_RECORDINGS.map((item) => (
          <Link
            key={item.id}
            // ✅ Use object form so TS validates against your routes
            href={{ pathname: "/recording/[id]", params: { id: item.id } }}
            asChild
          >
            <RowItem
              title={item.title}
              caption={`Score ${item.score}% · View details →`}
              bg={colors.box}
              border={colors.border}
            />
          </Link>
        ))}
      </View>
    </Screen>
  );
}
