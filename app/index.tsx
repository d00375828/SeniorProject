import React, { useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Redirect, router } from "expo-router";

import { useAuth, useTheme } from "@/context";
import useIsLandscape from "@/hooks/useIsLandscape";

const faqs = [
  { q: "Forgot password?", a: "Contact your admin to reset your credentials." },
  { q: "Need help?", a: "Email support@shadow.example or check the docs." },
];

export default function Login() {
  const { colors } = useTheme();
  const { isAuthed, signIn } = useAuth();
  const isLandscape = useIsLandscape();
  const { width } = useWindowDimensions();

  const cardWidth = isLandscape
    ? Math.min(520, Math.max(380, width * 0.5))
    : undefined;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  if (isAuthed) {
    return <Redirect href="/(tabs)/home" />;
  }

  async function onSignIn() {
    if (!username.trim() || !password.trim()) {
      setError("Enter username and password");
      return;
    }
    setError("");
    await signIn(username.trim());
    router.replace("/(tabs)/home");
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingHorizontal: isLandscape ? 24 : 24,
        paddingVertical: isLandscape ? 16 : 24,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View style={{ width: cardWidth ?? "100%", maxWidth: 560 }}>
        <Text
          style={{
            color: colors.fg,
            fontSize: 36,
            fontWeight: "800",
            letterSpacing: 6,
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          SHADOW
        </Text>

        <View style={{ gap: 12 }}>
          <TextInput
            value={username}
            onChangeText={(t) => {
              setUsername(t);
              if (error) setError("");
            }}
            placeholder="Username"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            style={{
              backgroundColor: colors.box,
              color: colors.fg,
              padding: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
          <View style={{ position: "relative" }}>
            <TextInput
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (error) setError("");
              }}
              placeholder="Password"
              placeholderTextColor={colors.muted}
              secureTextEntry={!showPw}
              style={{
                backgroundColor: colors.box,
                color: colors.fg,
                padding: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                paddingRight: 60,
              }}
            />
            <Pressable
              onPress={() => setShowPw((s) => !s)}
              style={{ position: "absolute", right: 10, top: 10, padding: 8 }}
            >
              <Text style={{ color: colors.accent, fontWeight: "700" }}>
                {showPw ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>

          {!!error && (
            <Text style={{ color: "#ff6666", fontSize: 13 }}>{error}</Text>
          )}

          <Pressable
            onPress={onSignIn}
            style={({ pressed }) => ({
              backgroundColor: colors.accent,
              opacity: pressed ? 0.85 : 1,
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 8,
            })}
          >
            <Text style={{ fontWeight: "700", color: colors.onAccent }}>
              Sign In
            </Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={() => setOpen(true)}
        style={{ position: "absolute", right: 16, bottom: 24 }}
      >
        <Text style={{ color: colors.fg, fontSize: 28, fontWeight: "900" }}>
          ?
        </Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#000a",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.box,
              borderRadius: 16,
              padding: 20,
              gap: 8,
            }}
          >
            <Text
              style={{
                color: colors.fg,
                fontSize: 18,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              Help & Contact
            </Text>
            {faqs.map((f, i) => (
              <View
                key={i}
                style={{
                  borderTopWidth: i ? 1 : 0,
                  borderTopColor: colors.border,
                  paddingTop: i ? 8 : 0,
                }}
              >
                <Pressable
                  onPress={() => setExpanded(expanded === i ? null : i)}
                >
                  <Text style={{ color: colors.fg, fontWeight: "600" }}>
                    {f.q}
                  </Text>
                </Pressable>
                {expanded === i && (
                  <Text style={{ color: colors.muted, marginTop: 4 }}>
                    {f.a}
                  </Text>
                )}
              </View>
            ))}
            <Pressable
              onPress={() => setOpen(false)}
              style={{ alignSelf: "center", marginTop: 8 }}
            >
              <Text style={{ color: colors.accent, fontWeight: "700" }}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
