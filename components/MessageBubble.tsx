// Presentational chat bubble
import { useTheme } from "@/context";
import type { Msg } from "@/lib/chat/types";
import React from "react";
import { Text, View } from "react-native";

export default function MessageBubble({ item }: { item: Msg }) {
  const { colors } = useTheme();
  const mine = item.role === "user";

  return (
    <View
      style={{
        marginVertical: 6,
        alignSelf: mine ? "flex-end" : "flex-start",
        maxWidth: "80%",
      }}
    >
      <View
        style={{
          backgroundColor: mine ? colors.accent : colors.box,
          borderWidth: mine ? 0 : 1,
          borderColor: colors.border,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 14,
          borderBottomRightRadius: mine ? 4 : 14,
          borderBottomLeftRadius: mine ? 14 : 4,
        }}
      >
        <Text
          style={{ color: mine ? colors.onAccent : colors.fg, lineHeight: 20 }}
        >
          {item.text}
        </Text>
      </View>
    </View>
  );
}
