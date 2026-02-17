import { useAuth, useTheme } from "@/context";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";

export default function TabsLayout() {
  const { isAuthed } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthed) router.replace("/");
  }, [isAuthed, router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.border,
          borderTopColor: colors.fg,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Record",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" color={color} size={size} />
            // Like cellular icon as well - name="cellular"
          ),
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          href: null,
          //title: "Training",
          //tabBarIcon: ({ color, size }) => (
          // <Ionicons name="book" color={color} size={size} />
          //),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbox" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-sharp" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
