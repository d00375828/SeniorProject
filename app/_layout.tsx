// app/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootProvider } from "../context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RootProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </RootProvider>
    </SafeAreaProvider>
  );
}
