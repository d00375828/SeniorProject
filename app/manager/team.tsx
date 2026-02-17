import BackButton from "@/components/BackButton";
import { useTheme } from "@/context";
import { Link } from "expo-router";
import React from "react";
import { FlatList, View } from "react-native";
import PageHeader from "../../components/PageHeader";
import RowItem from "../../components/RowItem";
import Screen from "../../components/Screen";

const MOCK_REPS = [
  { id: "u_1", name: "Alex Carter", lastActive: "2h", avgScore7d: 82 },
  { id: "u_2", name: "Jordan Lee", lastActive: "18m", avgScore7d: 76 },
  { id: "u_3", name: "Sam Patel", lastActive: "1d", avgScore7d: 90 },
];

export default function Team() {
  const { colors } = useTheme();

  return (
    <Screen backgroundColor={colors.bg} style={{ padding: 16 }} scroll={false}>
      <PageHeader title="Team" left={<BackButton />} />
      <FlatList
        data={MOCK_REPS}
        keyExtractor={(i) => i.id}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <Link
            href={{
              pathname: "/manager/rep/[id]",
              params: { id: item.id, name: item.name },
            }}
            asChild
          >
            <RowItem
              title={item.name}
              caption={`Avg (7d): ${item.avgScore7d}% · Last active ${item.lastActive}`}
              bg={colors.box}
              border={colors.border}
            />
          </Link>
        )}
      />
    </Screen>
  );
}
