// input row with TextInput and Send button

import { useTheme } from "@/context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, Pressable, TextInput, View } from "react-native";

export default function Composer({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (t: string) => void;
  onSend: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const cannotSend = disabled || !value.trim();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.bg,
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Ask for feedback…"
        placeholderTextColor={colors.muted}
        style={{
          flex: 1,
          color: colors.onAccent,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: Platform.OS === "ios" ? 12 : 8,
        }}
        returnKeyType="send"
        onSubmitEditing={() => !cannotSend && onSend()}
        editable={!disabled}
      />
      <Pressable
        onPress={onSend}
        disabled={cannotSend}
        style={{
          backgroundColor: colors.accent,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 10,
          alignItems: "center",
          justifyContent: "center",
          opacity: cannotSend ? 0.7 : 1,
        }}
      >
        <Ionicons name="send" size={18} color={colors.onAccent} />
      </Pressable>
    </View>
  );
}
