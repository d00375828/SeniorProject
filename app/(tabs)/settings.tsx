// app/(tabs)/settings.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import PageHeader from "@/components/PageHeader";
import { useAuth, useProfile, useTheme } from "@/context";
import Card from "../../components/Card";
import SafeModal from "../../components/SafeModal";
import Screen from "../../components/Screen";

const LEADING_ICON_SIZE = 26;
const CHEVRON_ICON_SIZE = 22;
const API_URL = "https://api.shadow.example";
const UNLOCK_KEY = "managerUnlocked";

function NavCard({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ marginBottom: 12 }}>
      <Card
        style={{
          borderColor: colors.border,
          borderWidth: 1,
          paddingVertical: 14,
          paddingHorizontal: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Ionicons
            name={icon}
            size={LEADING_ICON_SIZE}
            color={colors.accent}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.fg, fontWeight: "800", fontSize: 16 }}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={{ color: colors.muted, marginTop: 2 }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <Ionicons
            name="chevron-forward"
            size={CHEVRON_ICON_SIZE}
            color={colors.accent}
          />
        </View>
      </Card>
    </Pressable>
  );
}

export default function SettingsHub() {
  const { colors } = useTheme();
  const { signOut, sessionToken } = useAuth() as any;
  const { profile } = useProfile();

  const [showHelp, setShowHelp] = useState(false);

  // --- Manager code modal state ---
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [code, setCode] = useState("");

  function doSignOut() {
    Alert.alert("Sign out?", "You’ll need to sign in again to continue.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  }

  const openWebConsole = async () => {
    try {
      const redirect = Linking.createURL("/manager");
      const res = await fetch(
        `${API_URL}/console/link?redirect=${encodeURIComponent(redirect)}`,
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      const { url } = await res.json();
      await WebBrowser.openAuthSessionAsync(url, redirect);
    } catch (e: any) {
      Alert.alert("Unable to open console", String(e?.message || e));
    }
  };

  const tryUnlockAndOpenManager = async () => {
    // Always show the code prompt for now (testing mode)
    setShowCodeModal(true);
  };

  const handleSubmitCode = async () => {
    if (code.trim() === "0000") {
      await AsyncStorage.setItem(UNLOCK_KEY, "true");
      setShowCodeModal(false);
      setCode("");
      router.replace("/manager");
    } else {
      Alert.alert("Invalid code", "Please try again.");
    }
  };

  return (
    <Screen style={{ padding: 16, backgroundColor: colors.bg, flexGrow: 1 }}>
      <PageHeader title="Settings" />

      <NavCard
        title="Profile"
        subtitle="Manage your account info"
        icon="person-circle-outline"
        onPress={() => router.push("/settings/profile")}
      />

      <NavCard
        title="Notifications"
        subtitle="Manage your alerts"
        icon="notifications-outline"
        onPress={() => router.push("/settings/notifications")}
      />

      <NavCard
        title="Privacy & Security"
        subtitle="Permissions and access"
        icon="shield-checkmark-outline"
        onPress={() => router.push("/settings/privacy")}
      />

      <NavCard
        title="Help & Support"
        subtitle="Contact info and FAQs"
        icon="help-circle-outline"
        onPress={() => setShowHelp(true)}
      />

      {/* Manager (always visible in testing) 
      <View style={{ height: 12 }} />
      <SectionTitle
        color={colors.fg}
        style={{ marginTop: 12, marginBottom: 12 }}
      >
        Manager
      </SectionTitle>

      <NavCard
        title="Manager (in-app)"
        subtitle="Open the Manager Console inside the app"
        icon="speedometer-outline"
        onPress={tryUnlockAndOpenManager}
      />

      <NavCard
        title="Manager Web Console"
        subtitle="Bulk uploads, dataset curation, exports"
        icon="open-outline"
        onPress={openWebConsole}
      />

      <View style={{ flexGrow: 1 }} />

      <Pressable
        onPress={doSignOut}
        style={{
          backgroundColor: "#B00020",
          paddingVertical: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "800" }}>Sign Out</Text>
      </Pressable> */}

      {/* Help Modal */}
      <SafeModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        title="Help & Support"
      >
        <View style={{ backgroundColor: colors.card, gap: 12 }}>
          <Text style={{ color: colors.muted }}>
            Email: andy@shadowsales.com
          </Text>
          <Text style={{ color: colors.muted }}>Text: 435-705-9700</Text>
          <Text style={{ color: colors.muted }}>Sun - Sat: 9am - 5pm</Text>
        </View>
      </SafeModal>

      {/* Code Prompt Modal */}
      <SafeModal
        visible={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        title="Enter Manager Code"
      >
        <View style={{ gap: 12 }}>
          <Text style={{ color: colors.muted }}>
            Enter the 4-digit manager access code.
          </Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="0000"
            placeholderTextColor={colors.border}
            autoFocus
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: colors.fg,
            }}
          />
          <Pressable
            onPress={handleSubmitCode}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 10,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.onAccent, fontWeight: "800" }}>
              Unlock
            </Text>
          </Pressable>
        </View>
      </SafeModal>
    </Screen>
  );
}
