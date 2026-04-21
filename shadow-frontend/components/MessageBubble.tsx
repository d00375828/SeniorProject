// Presentational chat bubble
import { useTheme } from "@/context";
import type { SessionTurn } from "@/context";
import React from "react";
import { Text, View } from "react-native";

export default function MessageBubble({ item }: { item: SessionTurn }) {
  const { colors } = useTheme();
  const mine = item.role === "user";
  const label = mine ? "You" : "AI";

  return (
    <View
      style={{
        marginVertical: 7,
        alignSelf: mine ? "flex-end" : "flex-start",
        maxWidth: "84%",
      }}
    >
      <View
        style={{
          backgroundColor: mine ? colors.accent : colors.box,
          borderWidth: mine ? 0 : 1,
          borderColor: mine ? "transparent" : colors.border,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: 18,
          borderBottomRightRadius: mine ? 6 : 18,
          borderBottomLeftRadius: mine ? 18 : 6,
          shadowColor: mine ? colors.accent : "#000",
          shadowOpacity: mine ? 0.14 : 0.12,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 2,
        }}
      >
        <Text
          style={{
            color: mine ? colors.onAccent : colors.muted,
            fontSize: 11,
            fontWeight: "800",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: mine ? colors.onAccent : colors.fg,
            lineHeight: 21,
            fontSize: 15,
          }}
        >
          {item.text}
        </Text>
      </View>
    </View>
  );
}
