// components/Card.tsx
import { useTheme } from "@/context";
import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Optional overrides; defaults come from theme */
  bg?: string;
  border?: string;
  radius?: number;
  padding?: number;
  borderWidth?: number;
};

export default function Card({
  children,
  style,
  bg,
  border,
  radius = 12,
  padding = 12,
  borderWidth = 1,
}: Props) {
  const { colors } = useTheme();
  const backgroundColor = bg ?? colors.card;
  const borderColor = border ?? colors.border;

  return (
    <View
      style={[
        {
          backgroundColor,
          borderRadius: radius,
          padding,
          borderWidth,
          borderColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
