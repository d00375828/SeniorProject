// Back button component to navigate back to previous screen
import { useTheme } from "@/context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable } from "react-native";

export default function BackButton() {
  const { colors } = useTheme();
  // Only show if we can actually go back
  if (!router.canGoBack()) return null;

  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={10}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.box,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Ionicons name="arrow-back" size={18} color={colors.fg} />
    </Pressable>
  );
}
