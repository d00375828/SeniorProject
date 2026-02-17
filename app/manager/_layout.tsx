// app/manager/_layout.tsx
import { useProfile, useTheme } from "@/context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

const UNLOCK_KEY = "managerUnlocked";

export default function ManagerLayout() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useProfile();
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  const role = (profile?.role ?? "").toString().toLowerCase();
  const isManagerRole = /manager|owner|admin/.test(role);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(UNLOCK_KEY);
        setUnlocked(v === "true");
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!checking && !(unlocked || isManagerRole)) {
      router.replace("/(tabs)/settings");
    }
  }, [checking, unlocked, isManagerRole, router]);

  if (checking) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!(unlocked || isManagerRole)) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false, // 🔕 remove native header
        contentStyle: { backgroundColor: colors.bg }, // keep theme background
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="team" />
      <Stack.Screen name="rep/[id]" />
      <Stack.Screen name="ai" />
      <Stack.Screen name="branding" />
      <Stack.Screen name="resources" />
    </Stack>
  );
}
