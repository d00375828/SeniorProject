import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import AppButton from "@/components/AppButton";
import BackButton from "@/components/BackButton";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import Screen from "@/components/Screen";
import {
  AttachmentKind,
  SessionAttachment,
  useSession,
  useTheme,
} from "@/context";
import { uploadRoleplayContext } from "@/lib/roleplay/client";

const ATTACHMENT_KIND_OPTIONS: { kind: AttachmentKind; label: string }[] = [
  { kind: "slides", label: "Slides" },
  { kind: "instructions", label: "Instructions" },
  { kind: "rubric", label: "Rubric" },
  { kind: "notes", label: "Notes" },
];
const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_ATTACHMENT_EXTENSIONS = [".pdf", ".txt", ".md"];

function hasSupportedExtension(fileName: string) {
  const lower = fileName.toLowerCase();
  return SUPPORTED_ATTACHMENT_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

export default function SetupScreen() {
  const { scenarioId } = useLocalSearchParams<{ scenarioId: string }>();
  const { colors } = useTheme();
  const { scenarios, startSession } = useSession();

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId),
    [scenarioId, scenarios]
  );

  const [userRole, setUserRole] = useState(scenario?.defaultConfig.userRole ?? "");
  const [objective, setObjective] = useState(scenario?.defaultConfig.objective ?? "");
  const [partnerStyle, setPartnerStyle] = useState(
    scenario?.defaultConfig.partnerStyle ?? ""
  );
  const [selectedAttachmentKind, setSelectedAttachmentKind] =
    useState<AttachmentKind>("slides");
  const [attachments, setAttachments] = useState<SessionAttachment[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!scenario) {
    router.replace("/");
    return null;
  }

  async function onPickDocument() {
    if (uploadBusy) return;
    if (attachments.length >= MAX_ATTACHMENTS) {
      Alert.alert("Limit reached", "Upload up to 3 supporting files for this session.");
      return;
    }

    try {
      setUploadError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "text/plain", "text/markdown"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const fileName = asset.name || "context-upload";
      const mimeType = asset.mimeType || "application/octet-stream";

      if (!hasSupportedExtension(fileName)) {
        throw new Error("Unsupported file type. Upload a PDF, TXT, or Markdown file.");
      }

      if (typeof asset.size === "number" && asset.size > MAX_ATTACHMENT_FILE_SIZE_BYTES) {
        throw new Error("That file is too large. Upload a file smaller than 10 MB.");
      }

      setUploadBusy(true);
      const attachment = await uploadRoleplayContext(
        asset.uri,
        fileName,
        mimeType,
        selectedAttachmentKind
      );

      setAttachments((current) => [...current, attachment]);
    } catch (error: any) {
      const message =
        error?.message ?? "Unable to upload and process that document.";
      setUploadError(message);
      Alert.alert("Upload failed", message);
    } finally {
      setUploadBusy(false);
    }
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((item) => item.id !== id));
  }

  return (
    <Screen backgroundColor={colors.bg} style={{ padding: 16, gap: 16 }}>
      <PageHeader title="Setup" left={<BackButton />} />

      <Card style={{ gap: 10 }}>
        <Text style={{ color: colors.fg, fontSize: 24, fontWeight: "800" }}>
          {scenario.title}
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 22 }}>
          {scenario.description}
        </Text>
        <View
          style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}
        >
          {[scenario.category, scenario.difficulty, scenario.persona].map((label) => (
            <View
              key={label}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: colors.box,
              }}
            >
              <Text style={{ color: colors.fg, fontSize: 12 }}>{label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={{ color: colors.fg, fontSize: 18, fontWeight: "700" }}>
          Session configuration
        </Text>

        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>
            Your role
          </Text>
          <TextInput
            value={userRole}
            onChangeText={setUserRole}
            placeholder="Presenter"
            placeholderTextColor={colors.muted}
            style={{
              color: colors.fg,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              backgroundColor: colors.box,
            }}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>
            Objective
          </Text>
          <TextInput
            value={objective}
            onChangeText={setObjective}
            placeholder="Uncover pains and secure a next step"
            placeholderTextColor={colors.muted}
            multiline
            style={{
              color: colors.fg,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              minHeight: 84,
              backgroundColor: colors.box,
              textAlignVertical: "top",
            }}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}>
            Audience or partner style
          </Text>
          <TextInput
            value={partnerStyle}
            onChangeText={setPartnerStyle}
            placeholder="Supportive but attentive audience"
            placeholderTextColor={colors.muted}
            style={{
              color: colors.fg,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              backgroundColor: colors.box,
            }}
          />
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={{ color: colors.fg, fontSize: 18, fontWeight: "700" }}>
          Upload materials
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 21 }}>
          Add slides, instructions, rubrics, or notes so the AI can use them in
          the roleplay and coaching. PDF, TXT, and Markdown files are supported
          right now.
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {ATTACHMENT_KIND_OPTIONS.map((option) => {
            const selected = selectedAttachmentKind === option.kind;
            return (
              <Pressable
                key={option.kind}
                onPress={() => setSelectedAttachmentKind(option.kind)}
                style={{
                  borderWidth: 1,
                  borderColor: selected ? colors.accent : colors.border,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: selected ? colors.accent : colors.box,
                }}
              >
                <Text
                  style={{
                    color: selected ? colors.onAccent : colors.fg,
                    fontWeight: "700",
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <AppButton
          title={uploadBusy ? "Uploading..." : `Upload ${selectedAttachmentKind}`}
          color={colors.accent}
          fg={colors.onAccent}
          disabled={uploadBusy || attachments.length >= MAX_ATTACHMENTS}
          onPress={onPickDocument}
        />

        <Text style={{ color: colors.muted, fontSize: 12 }}>
          Up to 3 files per session.
        </Text>

        {uploadError ? (
          <Text style={{ color: "#ffb3b3" }}>{uploadError}</Text>
        ) : null}

        {attachments.length ? (
          <View style={{ gap: 10 }}>
            {attachments.map((attachment) => (
              <Card
                key={attachment.id}
                bg={colors.box}
                border={colors.border}
                style={{ gap: 8 }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: colors.fg, fontWeight: "800" }}>
                      {attachment.name}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      {attachment.kind} | {attachment.mimeType}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeAttachment(attachment.id)}>
                    <Text style={{ color: colors.accent, fontWeight: "700" }}>
                      Remove
                    </Text>
                  </Pressable>
                </View>
                <Text style={{ color: colors.muted, lineHeight: 20 }}>
                  {attachment.promptText.slice(0, 180)}
                  {attachment.promptText.length > 180 ? "..." : ""}
                </Text>
              </Card>
            ))}
          </View>
        ) : (
          <Text style={{ color: colors.muted, lineHeight: 21 }}>
            No supporting materials added yet.
          </Text>
        )}
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={{ color: colors.muted, lineHeight: 21 }}>
          You will record one turn at a time. After each turn, the app will show
          the transcript, receive the AI reply, and play the voice response when
          audio is available.
        </Text>
        <AppButton
          title="Start Roleplay"
          color={colors.accent}
          fg={colors.onAccent}
          onPress={() => {
            startSession({
              scenarioId: scenario.id,
              userRole: userRole.trim() || scenario.defaultConfig.userRole,
              objective: objective.trim() || scenario.defaultConfig.objective,
              partnerStyle:
                partnerStyle.trim() || scenario.defaultConfig.partnerStyle,
              attachments,
            });
            router.push("/session" as any);
          }}
        />
        <Pressable onPress={() => router.push("/history" as any)}>
          <Text style={{ color: colors.accent, fontWeight: "700", textAlign: "center" }}>
            View saved sessions
          </Text>
        </Pressable>
      </Card>
    </Screen>
  );
}
