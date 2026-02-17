// app/settings/notifications.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, Switch, Text, View } from "react-native";

import { useTheme } from "@/context";
import { useNotificationPrefs } from "@/hooks/useNotificationPrefs";
import Card from "../../components/Card";
import PageHeader from "../../components/PageHeader";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";

export default function NotificationsSettings() {
  const { colors } = useTheme();
  const { notifPrefs, setNotifPrefs } = useNotificationPrefs();

  return (
    <Screen style={{ padding: 16, backgroundColor: colors.bg }}>
      <PageHeader
        title="Notifications"
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

      <Card style={{ gap: 10 }}>
        <SectionTitle color={colors.fg}>Alerts</SectionTitle>

        <ToggleRow
          label="Push Notifications"
          value={notifPrefs.push}
          onChange={(v) => setNotifPrefs({ ...notifPrefs, push: v })}
        />
        <ToggleRow
          label="Email Alerts"
          value={notifPrefs.email}
          onChange={(v) => setNotifPrefs({ ...notifPrefs, email: v })}
        />
        <ToggleRow
          label="SMS Alerts"
          value={notifPrefs.sms}
          onChange={(v) => setNotifPrefs({ ...notifPrefs, sms: v })}
        />
      </Card>
    </Screen>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
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
      }}
    >
      <Text style={{ color: colors.fg }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.border }}
        thumbColor={value ? colors.accent : colors.box}
      />
    </View>
  );
}
