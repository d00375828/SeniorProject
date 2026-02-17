// app/settings/privacy.tsx
import { Ionicons } from "@expo/vector-icons";
import { AudioModule, setAudioModeAsync } from "expo-audio";
import * as Location from "expo-location";
import { router } from "expo-router";
import React from "react";
import { Alert, Linking, Pressable, Switch, Text, View } from "react-native";

import { useTheme } from "@/context";
import { usePrivacyPrefs } from "@/hooks/usePrivacyPrefs";
import { IDLE_AUDIO_MODE, RECORDING_AUDIO_MODE } from "@/lib/audio/audioMode";
import Card from "../../components/Card";
import PageHeader from "../../components/PageHeader";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";

export default function PrivacySettings() {
  const { colors } = useTheme();
  const { privacyPrefs, setPrivacyPrefs } = usePrivacyPrefs();

  async function toggleLocation(v: boolean) {
    if (v) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location access was not granted.");
        return;
      }
    }
    setPrivacyPrefs({ ...privacyPrefs, location: v });
  }

  async function toggleMic(v: boolean) {
    if (v) {
      const st = await AudioModule.requestRecordingPermissionsAsync();
      if (!st.granted) {
        Alert.alert(
          "Microphone Permission",
          "Microphone access is currently blocked in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
        setPrivacyPrefs({ ...privacyPrefs, microphone: false });
        return;
      }
      await setAudioModeAsync(RECORDING_AUDIO_MODE);
      setPrivacyPrefs({ ...privacyPrefs, microphone: true });
    } else {
      await setAudioModeAsync(IDLE_AUDIO_MODE);
      setPrivacyPrefs({ ...privacyPrefs, microphone: false });
    }
  }

  return (
    <Screen style={{ padding: 16, backgroundColor: colors.bg }}>
      <PageHeader
        title="Privacy & Security"
        left={
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={{
              padding: 6,
              borderRadius: 9999,
              backgroundColor: colors.box,
              borderColor: colors.border,
              borderWidth: 1,
            }}
          >
            <Ionicons name="chevron-back" size={20} color={colors.fg} />
          </Pressable>
        }
      />

      {/* Active Listening 
      <Card
        style={{ gap: 8 }}
      >
        <SectionTitle color={colors.fg}>Active Listening</SectionTitle>

        <Row>
          <Text style={{ color: colors.fg, fontWeight: "700" }}>
            Safety Monitoring
          </Text>
          <Switch
            value={privacyPrefs.activeListening}
            onValueChange={(v) =>
              setPrivacyPrefs({ ...privacyPrefs, activeListening: v })
            }
            trackColor={{ false: colors.border, true: "#314d25" }}
            thumbColor={privacyPrefs.activeListening ? colors.accent : "#777"}
          />
        </Row>
        <Text style={{ color: colors.muted, lineHeight: 20 }}>
          When enabled, SHADOW AI monitors conversations in real-time for safety
          concerns. If unsafe language, threats, or dangerous situations are
          detected, your manager will be immediately notified with your exact
          GPS location for emergency response.
        </Text>
      </Card>

      <View style={{ height: 16 }} /> */}

      {/* Data & Permissions */}
      <Card>
        <SectionTitle color={colors.fg}>Data & Permissions</SectionTitle>

        <ToggleRow
          label="Location"
          value={privacyPrefs.location}
          onChange={toggleLocation}
        />
        <ToggleRow
          label="Microphone"
          value={privacyPrefs.microphone}
          onChange={toggleMic}
        />
        <ToggleRow
          label="Analytics Sharing"
          value={privacyPrefs.analytics}
          onChange={(v) => setPrivacyPrefs({ ...privacyPrefs, analytics: v })}
          last
        />
      </Card>

      <View style={{ height: 16 }} />

      {/* Access & Sharing 
      <Card
        style={{ gap: 8 }}
      >
        <SectionTitle color={colors.fg}>Access & Sharing</SectionTitle>
        {privacyPrefs.access.map((a, i) => (
          <View
            key={a.name + i}
            style={{
              paddingVertical: 10,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderTopColor: colors.border,
              borderTopWidth: i === 0 ? 0 : 1,
            }}
          >
            <View>
              <Text style={{ color: colors.fg, fontWeight: "700" }}>
                {a.name}
              </Text>
              <Text style={{ color: colors.muted }}>
                {a.role} • {a.relation}
              </Text>
            </View>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={colors.muted}
            />
          </View>
        ))}
      </Card>*/}
    </Screen>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6,
      }}
    >
      {children}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  last,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void | Promise<void>;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        paddingVertical: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopColor: colors.border,
        borderTopWidth: 1,
        borderBottomColor: colors.border,
        borderBottomWidth: last ? 0 : 1,
      }}
    >
      <Text style={{ color: colors.fg }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.bg }}
        thumbColor={value ? colors.accent : colors.box}
      />
    </View>
  );
}
