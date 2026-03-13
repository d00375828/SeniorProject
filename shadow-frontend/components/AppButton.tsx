// A customizable button

import React from "react";
import { Pressable, Text } from "react-native";

type Props = {
  title: string;
  onPress?: () => void;
  color?: string;
  fg?: string;
  disabled?: boolean;
  style?: any;
};

export default function AppButton({
  title,
  onPress,
  color = "#4cff00",
  fg = "#000",
  disabled,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: color,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 10,
          alignItems: "center",
        },
        style,
      ]}
    >
      <Text style={{ color: fg, fontWeight: "800" }}>{title}</Text>
    </Pressable>
  );
}
