// components/PageHeader.tsx
import { useTheme } from "@/context";
import React from "react";
import { Text, View, ViewStyle } from "react-native";

type Props = {
  title: string;
  left?: React.ReactNode; // e.g., a back button
  right?: React.ReactNode; // override right side if needed
  style?: ViewStyle | ViewStyle[];
  brandText?: string; // defaults to "SHADOW"
};

export default function PageHeader({
  title,
  left,
  right,
  style,
  brandText = "SHADOW",
}: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        },
        style as any,
      ]}
    >
      {/* Left cluster: optional left control + title */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {left}
        <Text style={{ color: colors.fg, fontSize: 24, fontWeight: "800" }}>
          {title}
        </Text>
      </View>

      {/* Right brand (inline with header) */}
      {right ?? (
        <Text
          style={{
            color: colors.border,
            fontSize: 18,
            fontWeight: "900",
            letterSpacing: 0.5,
          }}
        >
          {brandText.toUpperCase()}
        </Text>
      )}
    </View>
  );
}
