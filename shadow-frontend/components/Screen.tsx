// Screen component that handles safe area, keyboard avoiding, and optional scrolling.
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode;
  backgroundColor?: string;
  style?: ViewStyle | ViewStyle[];
  bottomPadding?: number;
  scroll?: boolean;
};

export default function Screen({
  children,
  backgroundColor = "#000",
  style,
  bottomPadding = 24,
  scroll = true,
}: Props) {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor }}
      edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {scroll ? (
          <ScrollView
            style={{ flex: 1, backgroundColor }}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="always"
            contentContainerStyle={[
              { paddingBottom: bottomPadding, flexGrow: 1 },
              style as any,
            ]}
          >
            {children}
          </ScrollView>
        ) : (
          <View
            style={[
              { flex: 1, paddingBottom: bottomPadding, backgroundColor },
              style as any,
            ]}
          >
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
