// app/manager/index.tsx
import { useTheme } from "@/context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import AppButton from "../../components/AppButton";
import Card from "../../components/Card";
import PageHeader from "../../components/PageHeader";
import Screen from "../../components/Screen";

type LinkHref =
  | { pathname: "/manager/team" }
  | { pathname: "/manager/ai" }
  | { pathname: "/manager/resources" }
  | { pathname: "/manager/branding" };

const Tile = ({
  title,
  desc,
  href,
}: {
  title: string;
  desc?: string;
  href: LinkHref;
}) => {
  const { colors } = useTheme();
  return (
    <Link href={href} asChild>
      <Pressable style={{ flex: 1 }}>
        <Card style={{ gap: 6 }}>
          <Text style={{ color: colors.fg, fontWeight: "800", fontSize: 16 }}>
            {title}
          </Text>
          {!!desc && <Text style={{ color: colors.muted }}>{desc}</Text>}
        </Card>
      </Pressable>
    </Link>
  );
};

const UNLOCK_KEY = "managerUnlocked";

export default function ManagerHome() {
  const { colors } = useTheme();

  return (
    <Screen backgroundColor={colors.bg} style={{ padding: 16 }} scroll={false}>
      <PageHeader title="Manager Console" />
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Tile
            title="Team"
            desc="Reps, activity, scores"
            href={{ pathname: "/manager/team" }}
          />
          <Tile
            title="AI Settings"
            desc="Weights & rubric"
            href={{ pathname: "/manager/ai" }}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Tile
            title="Resources"
            desc="Uploads & knowledge"
            href={{ pathname: "/manager/resources" }}
          />
          <Tile
            title="Branding"
            desc="Theme & colors"
            href={{ pathname: "/manager/branding" }}
          />
        </View>

        {/* Lock & Exit */}
        <View
          style={{
            marginTop: 16,
          }}
        >
          <AppButton
            title="Exit Manager Console"
            onPress={async () => {
              await AsyncStorage.removeItem(UNLOCK_KEY);
              router.replace("/(tabs)/settings");
            }}
            color={colors.box}
            fg={colors.fg}
          />
        </View>
      </View>
    </Screen>
  );
}
