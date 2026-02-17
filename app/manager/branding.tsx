// app/manager/branding.tsx
import { useTheme } from "@/context";
import { DARK_COLORS } from "@/context/theme";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import AppButton from "../../components/AppButton";
import BackButton from "../../components/BackButton";
import Card from "../../components/Card";
import PageHeader from "../../components/PageHeader";
import Screen from "../../components/Screen";

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export default function Branding() {
  const { colors, setOverrides, clearOverrides } = useTheme() as any;

  // fields (start from current theme)
  const [accent, setAccent] = useState(colors.accent);
  const [onAccent, setOnAccent] = useState(colors.onAccent);
  const [bg, setBg] = useState(colors.bg);
  const [box, setBox] = useState(colors.box);
  const [fg, setFg] = useState(colors.fg);
  const [muted, setMuted] = useState(colors.muted);
  const [border, setBorder] = useState(colors.border);

  // ✅ Keep inputs in sync if theme changes externally (e.g., after reset)
  useEffect(() => {
    setAccent(colors.accent);
    setOnAccent(colors.onAccent);
    setBg(colors.bg);
    setBox(colors.box);
    setFg(colors.fg);
    setMuted(colors.muted);
    setBorder(colors.border);
  }, [colors]);

  const allValid = useMemo(
    () =>
      [accent, onAccent, bg, box, fg, muted, border].every((v) =>
        HEX_RE.test(v)
      ),
    [accent, onAccent, bg, box, fg, muted, border]
  );

  const save = async () => {
    if (!allValid) {
      Alert.alert("Invalid color", "Use hex values like #00E6C3 or #111418.");
      return;
    }
    await setOverrides({ accent, onAccent, bg, box, fg, muted, border });
    Alert.alert("Saved", "Theme updated for this device.");
  };

  const reset = async () => {
    // 1) Clear stored overrides (context goes back to defaults)
    await clearOverrides();

    // 2) Explicitly populate fields with the default palette
    setAccent(DARK_COLORS.accent);
    setOnAccent(DARK_COLORS.onAccent);
    setBg(DARK_COLORS.bg);
    setBox(DARK_COLORS.box);
    setFg(DARK_COLORS.fg);
    setMuted(DARK_COLORS.muted);
    setBorder(DARK_COLORS.border);

    Alert.alert("Reset", "Fields restored to default theme.");
  };

  return (
    <Screen backgroundColor={colors.bg} style={{ padding: 16 }}>
      <PageHeader title="Branding" left={<BackButton />} brandText="SHADOW" />

      <Card style={{ gap: 16 }}>
        <Field label="Accent" value={accent} onChangeText={setAccent} />
        <Field label="On Accent" value={onAccent} onChangeText={setOnAccent} />
        <Field label="Background" value={bg} onChangeText={setBg} />
        <Field label="Card / Box" value={box} onChangeText={setBox} />
        <Field label="Text (Primary)" value={fg} onChangeText={setFg} />
        <Field label="Text (Muted)" value={muted} onChangeText={setMuted} />
        <Field label="Border" value={border} onChangeText={setBorder} />

        {/* Live preview */}
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.fg, fontWeight: "700" }}>Preview</Text>
          <View
            style={{
              backgroundColor: bg,
              padding: 12,
              borderRadius: 12,
              gap: 8,
            }}
          >
            <View
              style={{ backgroundColor: accent, padding: 12, borderRadius: 10 }}
            >
              <Text style={{ color: onAccent, fontWeight: "800" }}>
                Primary Button
              </Text>
            </View>
            <View
              style={{
                backgroundColor: box,
                borderColor: border,
                borderWidth: 1,
                padding: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: fg, fontWeight: "700" }}>Card Title</Text>
              <Text style={{ color: muted }}>Secondary text on card</Text>
            </View>
          </View>
        </View>

        <AppButton
          title={allValid ? "Apply & Save" : "Fix color values to save"}
          onPress={save}
          disabled={!allValid}
          color={allValid ? colors.accent : colors.box}
          fg={allValid ? colors.onAccent : colors.fg}
        />
        <AppButton
          title="Reset to Default"
          onPress={reset}
          color={colors.box}
          fg={colors.fg}
        />
      </Card>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  const { colors } = useTheme();
  const valid = HEX_RE.test(value);
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: colors.fg, fontWeight: "700" }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="#RRGGBB"
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          borderWidth: 1,
          borderColor: valid ? colors.border : "#B91C1C",
          color: colors.fg,
          padding: 12,
          borderRadius: 10,
        }}
      />
    </View>
  );
}
