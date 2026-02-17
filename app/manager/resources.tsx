import BackButton from "@/components/BackButton";
import { useAuth, useTheme } from "@/context";
import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { Alert } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import PageHeader from "../../components/PageHeader";
import Screen from "../../components/Screen";

const API_URL = "https://api.shadow.example"; // TODO

export default function Resources() {
  const { colors } = useTheme();
  const { sessionToken } = (useAuth() as any) || {};

  const quickAdd = async () => {
    const pick = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (pick.canceled) return;

    try {
      // TODO: presign -> PUT -> attach loop
      // for (const f of pick.assets ?? []) { ... }
      Alert.alert("Queued", "Selected file(s) ready to upload.");
    } catch (e: any) {
      Alert.alert("Upload error", String(e?.message || e));
    }
  };

  const openWebUploader = async () => {
    try {
      const redirect = Linking.createURL("/manager/resources");
      const res = await fetch(
        `${API_URL}/console/upload-link?redirect=${encodeURIComponent(
          redirect
        )}`,
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      const { url } = await res.json();
      await WebBrowser.openAuthSessionAsync(url, redirect);
    } catch (e: any) {
      Alert.alert("Unable to open uploader", String(e?.message || e));
    }
  };

  return (
    <Screen backgroundColor={colors.bg} style={{ padding: 16 }} scroll={false}>
      <PageHeader title="Resources" left={<BackButton />} />
      <Card style={{ gap: 12 }}>
        <AppButton
          title="Quick add from this device"
          onPress={quickAdd}
          color={colors.accent}
          fg={colors.onAccent}
        />
        <AppButton
          title="Open web uploader (bulk & large)"
          onPress={openWebUploader}
          color={colors.box}
          fg={colors.fg}
        />
      </Card>
    </Screen>
  );
}
