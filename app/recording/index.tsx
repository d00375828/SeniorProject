// app/recording/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, SectionList, Text, View } from "react-native";

import { useRecordings, useTheme } from "@/context";
import Card from "../../components/Card";
import PageHeader from "../../components/PageHeader";
import Screen from "../../components/Screen";

type HistoryItem = {
  id?: string | number;
  createdAt: number;
  transcript?: string;
  notes?: string;
  score?: number;
};

type Section = {
  title: string;
  key: string;
  data: HistoryItem[];
};

export default function RecordingsList() {
  const { colors } = useTheme();
  const { history } = useRecordings();

  const sections: Section[] = useMemo(() => {
    const byDay = new Map<string, HistoryItem[]>();

    const keyFromTs = (ts: number) => {
      const d = new Date(ts);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const labelForKey = (key: string) => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      const kToDate = (k: string) => {
        const [y, m, d] = k.split("-").map((n) => parseInt(n, 10));
        return new Date(y, m - 1, d);
      };

      const todayKey = keyFromTs(today.getTime());
      const yKey = keyFromTs(yesterday.getTime());

      if (key === todayKey) return "Today";
      if (key === yKey) return "Yesterday";

      const dt = kToDate(key);
      return dt.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    (history as HistoryItem[]).forEach((item) => {
      const k = keyFromTs(item.createdAt ?? Date.now());
      if (!byDay.has(k)) byDay.set(k, []);
      byDay.get(k)!.push(item);
    });

    const result: Section[] = Array.from(byDay.entries())
      .map(([key, items]) => ({
        key,
        title: labelForKey(key),
        data: items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
      }))
      .sort((a, b) => (a.key < b.key ? 1 : -1)); // newer day first

    return result;
  }, [history]);

  const openDetail = (item: HistoryItem) =>
    router.push(`/recording/${item.id ?? item.createdAt}`);

  const When = ({ ts }: { ts: number }) => (
    <Text style={{ color: colors.fg, fontWeight: "700" }}>
      {new Date(ts).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}
    </Text>
  );

  return (
    <Screen scroll={false} style={{ padding: 16, backgroundColor: colors.bg }}>
      <PageHeader
        title="Past Recordings"
        left={
          <Pressable
            onPress={() => router.replace("/(tabs)/home")}
            hitSlop={12}
            style={{
              padding: 6,
              borderRadius: 9999,
              backgroundColor: colors.box,
              borderColor: colors.border,
              borderWidth: 1,
            }}
          >
            <Ionicons name="chevron-back" size={20} color={colors.fg} />
          </Pressable>
        }
      />

      <SectionList
        sections={sections}
        keyExtractor={(item, idx) => String(item.id ?? item.createdAt ?? idx)}
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
        renderSectionHeader={({ section }) => (
          <View
            style={{
              backgroundColor: colors.bg,
              paddingTop: 12,
              paddingBottom: 6,
            }}
          >
            <Text style={{ color: colors.fg, fontWeight: "800", fontSize: 16 }}>
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable onPress={() => openDetail(item)}>
            <Card style={{ gap: 8 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <When ts={item.createdAt} />
                {typeof item.score === "number" ? (
                  <Text style={{ color: colors.fg }}>
                    Score:{" "}
                    <Text style={{ color: colors.accent, fontWeight: "800" }}>
                      {item.score}/100
                    </Text>
                  </Text>
                ) : null}
              </View>

              <Text numberOfLines={2} style={{ color: colors.muted }}>
                {item.notes?.trim() || "(No notes)"}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: colors.muted }}>Tap to open</Text>
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={{ color: colors.muted, marginTop: 8 }}>
            No recordings yet. Make your first one on the Recording page.
          </Text>
        }
      />
    </Screen>
  );
}
