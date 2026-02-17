// app/settings/profile.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { useProfile, useTheme } from "@/context";
import Card from "../../components/Card";
import PageHeader from "../../components/PageHeader";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";

export default function ProfileSettings() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { profile, setProfile } = useProfile();

  const [avatarUri, setAvatarUri] = useState(profile.avatarUri ?? "");
  const [name, setName] = useState(profile.name ?? "");
  const [email, setEmail] = useState(profile.email ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [org, setOrg] = useState(profile.org ?? "");
  const [role, setRole] = useState(profile.role ?? "");

  const dirty = useMemo(
    () =>
      (avatarUri || "") !== (profile.avatarUri || "") ||
      (name || "") !== (profile.name || "") ||
      (email || "") !== (profile.email || "") ||
      (phone || "") !== (profile.phone || "") ||
      (org || "") !== (profile.org || "") ||
      (role || "") !== (profile.role || ""),
    [avatarUri, name, email, phone, org, role, profile]
  );

  async function pickPhoto() {
    // Check current permission (accept iOS "limited")
    let perm = await ImagePicker.getMediaLibraryPermissionsAsync();
    const limited = (perm as any).accessPrivileges === "limited";
    if (!perm.granted && !limited) {
      perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }
    const ok = perm.granted || (perm as any).accessPrivileges === "limited";
    if (!ok) {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to pick a profile picture.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    // Modern API (no MediaTypeOptions)
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
      selectionLimit: 1,
    });

    if (!res.canceled && res.assets?.[0]?.uri) {
      setAvatarUri(res.assets[0].uri);
    }
  }

  function resetPassword() {
    Alert.alert(
      "Reset password",
      "A password reset request has been sent to your administrator."
    );
  }

  function save() {
    setProfile({
      ...profile,
      avatarUri: avatarUri || undefined,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      org: org.trim(),
      role: role.trim(),
    });
    Alert.alert("Saved", "Your profile has been updated.");
    router.back();
  }

  return (
    <Screen style={{ padding: 16, backgroundColor: colors.bg }}>
      <PageHeader
        title="Profile"
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

      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
        {/* Avatar + Change button (no card) */}
        <View style={{ alignItems: "center", gap: 10, paddingVertical: 6 }}>
          <View
            style={{
              height: 112,
              width: 112,
              borderRadius: 9999,
              backgroundColor: colors.bg,
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: colors.border,
            }}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{ height: "100%", width: "100%" }}
              />
            ) : (
              <Ionicons name="person-outline" size={48} color={colors.muted} />
            )}
          </View>

          <Pressable
            onPress={pickPhoto}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 9999,
              backgroundColor: colors.accent,
            }}
          >
            <Text style={{ color: colors.onAccent, fontWeight: "800" }}>
              Change Photo
            </Text>
          </Pressable>
        </View>

        {/* Info Card */}
        <Card style={{ gap: 10 }}>
          <Field label="Name" value={name} onChangeText={setName} />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Field
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Field label="Organization" value={org} onChangeText={setOrg} />
          <Field label="Role" value={role} onChangeText={setRole} />
        </Card>

        {/* Appearance (Light/Dark) */}
        <Card style={{ gap: 10 }}>
          <SectionTitle color={colors.fg}>Appearance</SectionTitle>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: colors.fg, fontWeight: "600" }}>
              Light Mode
            </Text>
            <Switch
              value={!isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.bg }}
              thumbColor={!isDark ? colors.accent : colors.box}
            />
          </View>
        </Card>

        {/* Security Card */}
        <Card style={{ gap: 10 }}>
          <SectionTitle color={colors.fg}>Security</SectionTitle>
          <Pressable
            onPress={resetPassword}
            style={{
              alignSelf: "center",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: colors.border,
            }}
          >
            <Text style={{ color: colors.fg, fontWeight: "700" }}>
              Reset Password
            </Text>
          </Pressable>
        </Card>
      </ScrollView>

      {/* Sticky Save */}
      <Pressable
        disabled={!dirty}
        onPress={save}
        style={{
          backgroundColor: dirty ? colors.accent : "#2a2a2a",
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: "center",
          opacity: dirty ? 1 : 0.6,
        }}
      >
        <Text style={{ color: colors.onAccent, fontWeight: "800" }}>
          Save Changes
        </Text>
      </Pressable>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  const { colors, isDark, toggleTheme } = useTheme();
  return (
    <View>
      <Text style={{ color: colors.muted, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
        placeholder={label}
        placeholderTextColor={colors.muted}
        style={{
          color: colors.fg,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      />
    </View>
  );
}
