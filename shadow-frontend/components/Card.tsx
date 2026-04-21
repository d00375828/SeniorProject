// components/Card.tsx
import { useTheme } from "@/context";
import React from "react";
import {
  Platform,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

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
  radius = 16,
  padding = 14,
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
          shadowColor: "#000",
          shadowOpacity: Platform.OS === "ios" ? 0.16 : 0,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: Platform.OS === "android" ? 3 : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
